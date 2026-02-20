// server/index.ts
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import Anthropic from "@anthropic-ai/sdk";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorkflowStep {
    stepId: string;
    order: number;
    title: string;
    description?: string;
    durationSec?: number;
    page?: number;
}

interface WorkflowPayload {
    workflowUUID: string;
    workflowId: string;
    name: string;
    steps: WorkflowStep[];
    createdAt: string;
    updatedAt: string;
}

interface GeneratedStep {
    title: string;
    description?: string;
    durationSec?: number;
    page?: number;
}

interface GeneratedWorkflow {
    title?: string;
    steps: GeneratedStep[];
}

// ── Config ────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT ?? 10000);
const DATA_DIR = process.env.DATA_DIR ?? "/tmp";
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";

// ── Express app ───────────────────────────────────────────────────────────────

const app = express();

app.use(
    cors({
        origin: CORS_ORIGIN === "*" ? "*" : CORS_ORIGIN.split(",").map((s) => s.trim()),
    })
);
// 20 MB limit to accommodate base64-encoded PDF bodies
app.use(express.json({ limit: "20mb" }));

// ── Anthropic client ──────────────────────────────────────────────────────────

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

// ── File-system helpers ───────────────────────────────────────────────────────

async function ensureDataDir(): Promise<void> {
    await fs.mkdir(DATA_DIR, { recursive: true });
}

function workflowFilePath(id: string): string {
    return path.join(DATA_DIR, `${id}.json`);
}

/** Strip everything except alphanumeric, dash, underscore — prevents path traversal. */
function safeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

function nowISO(): string {
    return new Date().toISOString();
}

function newUUID(): string {
    return crypto.randomUUID();
}

// ── Workflow validation / normalisation ───────────────────────────────────────

function validateIncoming(body: unknown): { ok: true } | { ok: false; error: string } {
    if (!body || typeof body !== "object") return { ok: false, error: "Missing body" };
    const b = body as Record<string, unknown>;
    if (typeof b.name !== "string" || !b.name.trim()) return { ok: false, error: "Missing name" };
    if (!Array.isArray(b.steps)) return { ok: false, error: "steps must be an array" };
    if (b.steps.length === 0) return { ok: false, error: "steps must not be empty" };
    return { ok: true };
}

function normalizeWorkflow(body: Record<string, unknown>): WorkflowPayload {
    const workflowUUID = safeId(String(body.workflowUUID ?? newUUID()));
    const workflowId = safeId(String(body.workflowId ?? workflowUUID));
    const createdAt = typeof body.createdAt === "string" ? body.createdAt : nowISO();

    const rawSteps = Array.isArray(body.steps) ? body.steps : [];
    const steps: WorkflowStep[] = rawSteps.map((s: unknown, idx: number) => {
        const step = (s ?? {}) as Record<string, unknown>;
        return {
            stepId: safeId(String(step.stepId ?? `step-${idx + 1}`)),
            order: typeof step.order === "number" && Number.isFinite(step.order) ? step.order : idx + 1,
            title:
                typeof step.title === "string" && step.title.trim()
                    ? step.title.trim()
                    : `Step ${idx + 1}`,
            description: typeof step.description === "string" ? step.description : undefined,
            durationSec:
                typeof step.durationSec === "number" && step.durationSec > 0
                    ? Math.round(step.durationSec)
                    : undefined,
            page:
                typeof step.page === "number" && step.page >= 1
                    ? Math.floor(step.page)
                    : undefined,
        };
    });

    return {
        workflowUUID,
        workflowId,
        name: (body.name as string).trim(),
        steps,
        createdAt,
        updatedAt: nowISO(),
    };
}

async function writeWorkflow(wf: WorkflowPayload): Promise<void> {
    await ensureDataDir();
    await fs.writeFile(workflowFilePath(wf.workflowUUID), JSON.stringify(wf, null, 2), "utf-8");
}

async function readWorkflow(id: string): Promise<WorkflowPayload | null> {
    try {
        const raw = await fs.readFile(workflowFilePath(safeId(id)), "utf-8");
        return JSON.parse(raw) as WorkflowPayload;
    } catch {
        return null;
    }
}

async function listWorkflows(): Promise<
    Pick<WorkflowPayload, "workflowUUID" | "workflowId" | "name" | "createdAt" | "updatedAt">[]
> {
    await ensureDataDir();
    const files = (await fs.readdir(DATA_DIR)).filter((f) => f.endsWith(".json"));

    const items = await Promise.all(
        files.map(async (f) => {
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

    return items.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

// ── Claude Haiku helpers ──────────────────────────────────────────────────────

/**
 * Strips markdown fences and attempts to parse JSON.
 * Falls back to extracting the first {...} block, then repairs bare newlines.
 */
function extractJsonFromText(text: string): unknown {
    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    const tryParse = (s: string): unknown => {
        try {
            return JSON.parse(s);
        } catch {
            return JSON.parse(s.replace(/\r?\n/g, "\\n"));
        }
    };

    try {
        return tryParse(cleaned);
    } catch { /* fall through */ }

    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first === -1 || last <= first) {
        throw new Error("No JSON object found in Claude output.");
    }
    return tryParse(cleaned.slice(first, last + 1));
}

function normalizeGeneratedWorkflow(raw: unknown): GeneratedWorkflow {
    if (!raw || typeof raw !== "object") {
        throw new Error("Claude returned non-object JSON.");
    }
    const wf = raw as Record<string, unknown>;
    if (!Array.isArray(wf.steps) || wf.steps.length === 0) {
        throw new Error("Claude returned JSON but 'steps' is missing or empty.");
    }

    const steps: GeneratedStep[] = (wf.steps as unknown[])
        .filter(Boolean)
        .slice(0, 20)
        .map((s: unknown) => {
            const step = (s ?? {}) as Record<string, unknown>;
            const title = typeof step.title === "string" ? step.title.trim() : "";
            if (!title) throw new Error("Claude produced a step without a title.");

            return {
                title,
                description:
                    typeof step.description === "string" ? step.description.trim() : undefined,
                durationSec:
                    typeof step.durationSec === "number" && step.durationSec > 0
                        ? Math.round(step.durationSec)
                        : undefined,
                page:
                    typeof step.page === "number" && step.page >= 1
                        ? Math.floor(step.page)
                        : undefined,
            };
        });

    return {
        title: typeof wf.title === "string" ? wf.title.trim() : undefined,
        steps,
    };
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
    void ensureDataDir().then(() => res.json({ ok: true }));
});

// ── AI: Generate workflow from PDF via Claude Haiku ───────────────────────────

app.post("/api/generate-workflow", (req: Request, res: Response) => {
    void (async () => {
        const { pdfBase64, filename } = req.body as {
            pdfBase64?: unknown;
            filename?: unknown;
        };

        if (typeof pdfBase64 !== "string" || !pdfBase64) {
            res.status(400).json({ error: "Missing pdfBase64 in request body" });
            return;
        }
        if (!process.env.ANTHROPIC_API_KEY) {
            res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY" });
            return;
        }

        const safeFilename = typeof filename === "string" ? filename : "document.pdf";

        const prompt = `You are a workflow extraction engine that produces AR-ready step-by-step instructions.

The input is a PDF named "${safeFilename}". It may be IMAGE/DIAGRAM heavy (e.g., IKEA manuals).
Primary goal: infer steps from diagrams/illustrations. Treat visuals as the source of truth.

Rules:
- Use diagrams, exploded views, arrows, numbered panels to determine the steps.
- Ignore marketing text. Only use text to clarify part names or safety warnings.
- Produce concise, actionable, ordered steps (6 to 20 steps max).
- If timing is implied (wait/bake/cure/heat), set durationSec. Otherwise omit it.
- For each step, include a 1-based "page" number for the most relevant PDF page.

Return STRICT JSON ONLY — no markdown, no commentary, no backticks:
{
  "title": "short workflow name",
  "steps": [
    { "title": "Step title", "description": "1-3 sentences", "durationSec": 120, "page": 3 }
  ]
}`;

        try {
            // Use anthropic.beta.messages.create for PDF document support
            const response = await anthropic.beta.messages.create({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 2048,
                betas: ["pdfs-2024-09-25"],
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
                            },
                            {
                                type: "text",
                                text: prompt,
                            },
                        ],
                    },
                ],
            });

            const text = response.content
                .filter((b) => b.type === "text")
                .map((b) => (b as { type: "text"; text: string }).text)
                .join("")
                .trim();

            if (!text) throw new Error("Claude returned empty output.");

            const parsed = extractJsonFromText(text);
            const workflow = normalizeGeneratedWorkflow(parsed);

            res.json(workflow);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to generate workflow.";
            console.error("Claude API error:", message);
            res.status(500).json({ error: message });
        }
    })();
});

// ── Workflows CRUD ────────────────────────────────────────────────────────────

/** POST /api/workflows — create or overwrite */
app.post("/api/workflows", (req: Request, res: Response) => {
    void (async () => {
        const v = validateIncoming(req.body);
        if (!v.ok) {
            res.status(400).json({ error: v.error });
            return;
        }
        const wf = normalizeWorkflow(req.body as Record<string, unknown>);
        await writeWorkflow(wf);
        res.status(201).json(wf);
    })();
});

/** GET /api/workflows — list (metadata only) */
app.get("/api/workflows", (_req: Request, res: Response) => {
    void (async () => {
        const list = await listWorkflows();
        res.json({ items: list });
    })();
});

/** GET /api/workflows/:workflowUUID — fetch one */
app.get("/api/workflows/:workflowUUID", (req: Request, res: Response) => {
    void (async () => {
        const id = safeId(req.params.workflowUUID);
        const wf = await readWorkflow(id);
        if (!wf) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        res.json(wf);
    })();
});

/** DELETE /api/workflows/:workflowUUID — remove */
app.delete("/api/workflows/:workflowUUID", (req: Request, res: Response) => {
    void (async () => {
        const id = safeId(req.params.workflowUUID);
        try {
            await fs.unlink(workflowFilePath(id));
            res.json({ ok: true });
        } catch (err: unknown) {
            const code = (err as NodeJS.ErrnoException).code;
            if (code === "ENOENT") {
                res.status(404).json({ error: "Not found" });
            } else {
                res.status(500).json({ error: "Failed to delete workflow" });
            }
        }
    })();
});

// ── Global error handler ──────────────────────────────────────────────────────

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Unhandled error:", message);
    res.status(500).json({ error: message });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log(`API running on :${PORT}`);
    console.log(`DATA_DIR=${DATA_DIR}`);
    console.log(`Anthropic key set: ${!!process.env.ANTHROPIC_API_KEY}`);
});