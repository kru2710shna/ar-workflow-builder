// server/index.ts
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import Anthropic from "@anthropic-ai/sdk";

// ---------- Types ----------
type WorkflowStep = {
    stepId: string;
    order: number;
    title: string;
    description?: string;
    durationSec?: number;
    page?: number;
};

export type WorkflowPayload = {
    workflowUUID: string;
    workflowId: string;
    name: string;
    steps: WorkflowStep[];
    createdAt: string;
    updatedAt: string;
};

type GeneratedStep = {
    title: string;
    description?: string;
    durationSec?: number;
    page?: number;
};

type GeneratedWorkflow = {
    title?: string;
    steps: GeneratedStep[];
};

// ---------- App ----------
const app = express();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ---------- Config ----------
const PORT = Number(process.env.PORT || 10000);
const DATA_DIR = process.env.DATA_DIR || "/tmp";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

app.use(
    cors({
        origin: CORS_ORIGIN === "*" ? "*" : CORS_ORIGIN.split(",").map((s) => s.trim()),
    })
);
app.use(express.json({ limit: "20mb" })); // larger limit for PDF base64

// ---------- Helpers ----------
async function ensureDataDir() {
    await fs.mkdir(DATA_DIR, { recursive: true });
}

function workflowPath(id: string) {
    return path.join(DATA_DIR, `${id}.json`);
}

function safeId(id: string) {
    return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

function nowISO() {
    return new Date().toISOString();
}

function newUUID() {
    return crypto.randomUUID();
}

function validateIncoming(body: any): { ok: true } | { ok: false; error: string } {
    if (!body) return { ok: false, error: "Missing body" };
    if (typeof body.name !== "string" || !body.name.trim()) return { ok: false, error: "Missing name" };
    if (!Array.isArray(body.steps)) return { ok: false, error: "steps must be an array" };
    if (body.steps.length === 0) return { ok: false, error: "steps must not be empty" };
    return { ok: true };
}

function normalizeWorkflow(body: any): WorkflowPayload {
    const workflowUUID = safeId(body.workflowUUID || newUUID());
    const workflowId = safeId(body.workflowId || workflowUUID);

    const createdAt = typeof body.createdAt === "string" ? body.createdAt : nowISO();
    const updatedAt = nowISO();

    const steps: WorkflowStep[] = body.steps.map((s: any, idx: number) => ({
        stepId: safeId(s.stepId || `step-${idx + 1}`),
        order: Number.isFinite(s.order) ? s.order : idx + 1,
        title: typeof s.title === "string" && s.title.trim() ? s.title.trim() : `Step ${idx + 1}`,
        description: typeof s.description === "string" ? s.description : undefined,
        durationSec: Number.isFinite(s.durationSec) && s.durationSec > 0 ? Math.round(s.durationSec) : undefined,
        page: Number.isFinite(s.page) && s.page >= 1 ? Math.floor(s.page) : undefined,
    }));

    return {
        workflowUUID,
        workflowId,
        name: body.name.trim(),
        steps,
        createdAt,
        updatedAt,
    };
}

async function writeWorkflow(wf: WorkflowPayload) {
    await ensureDataDir();
    await fs.writeFile(workflowPath(wf.workflowUUID), JSON.stringify(wf, null, 2), "utf-8");
}

async function readWorkflow(id: string): Promise<WorkflowPayload | null> {
    try {
        const p = workflowPath(safeId(id));
        const raw = await fs.readFile(p, "utf-8");
        return JSON.parse(raw) as WorkflowPayload;
    } catch {
        return null;
    }
}

async function listWorkflows(): Promise<Array<Pick<WorkflowPayload, "workflowUUID" | "workflowId" | "name" | "createdAt" | "updatedAt">>> {
    await ensureDataDir();
    const files = await fs.readdir(DATA_DIR);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const items = await Promise.all(
        jsonFiles.map(async (f) => {
            const raw = await fs.readFile(path.join(DATA_DIR, f), "utf-8");
            const wf = JSON.parse(raw) as WorkflowPayload;
            return {
                workflowUUID: wf.workflowUUID,
                workflowId: wf.workflowId,
                name: wf.name,
                createdAt: wf.createdAt,
                updatedAt: wf.updatedAt,
            };
        })
    );

    items.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    return items;
}

function extractJsonFromText(text: string): unknown {
    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    const tryParse = (s: string) => {
        try {
            return JSON.parse(s);
        } catch {
            const repaired = s.replace(/\r?\n/g, "\\n");
            return JSON.parse(repaired);
        }
    };

    try { return tryParse(cleaned); } catch { /* fall through */ }

    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first === -1 || last === -1 || last <= first) {
        throw new Error("No JSON object found in Claude output.");
    }
    return tryParse(cleaned.slice(first, last + 1));
}

function normalizeGeneratedWorkflow(raw: unknown): GeneratedWorkflow {
    if (!raw || typeof raw !== "object") throw new Error("Claude returned non-object JSON.");

    const wf = raw as any;
    if (!Array.isArray(wf.steps) || wf.steps.length === 0) {
        throw new Error("Claude returned JSON but 'steps' is missing or empty.");
    }

    const steps = wf.steps
        .filter(Boolean)
        .slice(0, 20)
        .map((s: any) => {
            const title = typeof s.title === "string" ? s.title.trim() : "";
            if (!title) throw new Error("Claude produced a step without a title.");

            const description = typeof s.description === "string" ? s.description.trim() : undefined;

            let durationSec: number | undefined;
            if (typeof s.durationSec === "number" && Number.isFinite(s.durationSec) && s.durationSec > 0) {
                durationSec = Math.round(s.durationSec);
            }

            let page: number | undefined;
            if (typeof s.page === "number" && Number.isFinite(s.page) && s.page >= 1) {
                page = Math.floor(s.page);
            }

            return { title, description, durationSec, page };
        });

    return {
        title: typeof wf.title === "string" ? wf.title.trim() : undefined,
        steps,
    };
}

// ---------- Routes ----------

app.get("/health", async (_req, res) => {
    await ensureDataDir();
    res.json({ ok: true });
});

// ------------------------------------
// AI: Generate workflow from PDF
// ------------------------------------
app.post("/api/generate-workflow", async (req, res) => {
    const { pdfBase64, filename } = req.body as { pdfBase64?: string; filename?: string };

    if (!pdfBase64 || typeof pdfBase64 !== "string") {
        return res.status(400).json({ error: "Missing pdfBase64 in request body" });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY" });
    }

    const prompt = `You are a workflow extraction engine that produces AR-ready step-by-step instructions.

The input is a PDF that may be IMAGE/DIAGRAM heavy (e.g., IKEA manuals with mostly pictures).
Primary goal: infer steps from diagrams/illustrations. Treat visuals as the source of truth.

Instructions:
- If the PDF contains diagrams, exploded views, arrows, parts callouts, numbered panels: use those to infer the steps.
- Ignore marketing text and irrelevant labels.
- Only use text when it is necessary to disambiguate part names or safety warnings.
- Produce concise, actionable, ordered steps.
- 6 to 20 steps max. If the PDF is large, summarize to the essential steps.
- If timing is implied (wait/bake/cure/heat), set durationSec. Otherwise omit durationSec.

CRITICAL: Align steps to PDF pages.
For each step, include a 1-based "page" number indicating the most relevant PDF page where that step is shown.
If a step spans multiple pages, choose the best primary page.

Return STRICT JSON ONLY in this exact schema (no markdown, no commentary, no backticks, no extra keys):

{
  "title": "short workflow name",
  "steps": [
    {
      "title": "Step title",
      "description": "1-3 sentences max",
      "durationSec": 120,
      "page": 3
    }
  ]
}`;

    try {
        const message = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 2048,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "document",
                            source: {
                                type: "base64",
                                media_type: "application/pdf",
                                data: pdfBase64,
                            },
                        } as any,
                        {
                            type: "text",
                            text: prompt,
                        },
                    ],
                },
            ],
            betas: ["pdfs-2024-09-25"] as any,
        });

        const text = message.content
            .filter((b: any) => b.type === "text")
            .map((b: any) => b.text)
            .join("")
            .trim();

        if (!text) throw new Error("Claude returned empty output.");

        const parsed = extractJsonFromText(text);
        const workflow = normalizeGeneratedWorkflow(parsed);

        return res.json(workflow);
    } catch (err: any) {
        console.error("Claude API error:", err);
        return res.status(500).json({ error: err?.message || "Failed to generate workflow." });
    }
});

// ------------------------------------
// Workflows CRUD
// ------------------------------------

// Create or overwrite workflow
app.post("/api/workflows", async (req, res) => {
    const v = validateIncoming(req.body);
    if (!v.ok) return res.status(400).json({ error: v.error });

    const wf = normalizeWorkflow(req.body);
    await writeWorkflow(wf);
    return res.status(201).json(wf);
});

// List all (metadata only)
app.get("/api/workflows", async (_req, res) => {
    const list = await listWorkflows();
    res.json({ items: list });
});

// Fetch one by UUID
app.get("/api/workflows/:workflowUUID", async (req, res) => {
    const id = safeId(req.params.workflowUUID);
    const wf = await readWorkflow(id);
    if (!wf) return res.status(404).json({ error: "Not found" });
    res.json(wf);
});

// Delete one by UUID
app.delete("/api/workflows/:workflowUUID", async (req, res) => {
    const id = safeId(req.params.workflowUUID);
    const p = workflowPath(id);
    try {
        await fs.unlink(p);
        return res.json({ ok: true });
    } catch (err: any) {
        if (err.code === "ENOENT") return res.status(404).json({ error: "Not found" });
        throw err;
    }
});

app.listen(PORT, () => {
    console.log(`API running on :${PORT}`);
    console.log(`DATA_DIR=${DATA_DIR}`);
    console.log(`Anthropic SDK ready: ${!!process.env.ANTHROPIC_API_KEY}`);
});