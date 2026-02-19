// server/index.ts
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

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
  name: string; // workflow title
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
};

const app = express();

// ---------- Config ----------
const PORT = Number(process.env.PORT || 10000);
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data"); // for Render disk: /var/data
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*"; // set to your frontend domain in prod

app.use(
  cors({
    origin: CORS_ORIGIN === "*" ? "*" : CORS_ORIGIN.split(",").map((s) => s.trim()),
  })
);
app.use(express.json({ limit: "10mb" }));

// ---------- Helpers ----------
async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function workflowPath(id: string) {
  // Store each workflow as its own JSON file
  return path.join(DATA_DIR, `${id}.json`);
}

function safeId(id: string) {
  // basic hardening against path traversal
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

  // newest first
  items.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return items;
}

// ---------- Routes ----------
app.get("/health", async (_req, res) => {
  await ensureDataDir();
  res.json({ ok: true });
});

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

// Optional: update (PATCH) if you want to save edits without resending everything
app.patch("/api/workflows/:workflowUUID", async (req, res) => {
  const id = safeId(req.params.workflowUUID);
  const existing = await readWorkflow(id);
  if (!existing) return res.status(404).json({ error: "Not found" });

  // allow updating name/steps
  const name = typeof req.body?.name === "string" && req.body.name.trim() ? req.body.name.trim() : existing.name;
  const steps = Array.isArray(req.body?.steps) ? req.body.steps : existing.steps;

  const next: WorkflowPayload = {
    ...existing,
    name,
    steps,
    updatedAt: nowISO(),
  };

  await writeWorkflow(next);
  res.json(next);
});

app.listen(PORT, () => {
  console.log(`API running on :${PORT}`);
  console.log(`DATA_DIR=${DATA_DIR}`);
});
