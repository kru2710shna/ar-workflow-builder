import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

type WorkflowPayload = {
  workflowUUID: string;
  workflowId: string;
  name: string;
  steps: Array<{
    stepId: string;
    order: number;
    title: string;
    description?: string;
    durationSec?: number;
    page?: number;
  }>;
  createdAt: string;
};

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// In-memory store (replace with DB later)
const store = new Map<string, WorkflowPayload>();

app.get("/health", (_req, res) => res.json({ ok: true }));

// Create workflow
app.post("/api/workflows", (req, res) => {
  const body = req.body as Partial<WorkflowPayload>;

  if (!body?.name || !Array.isArray(body.steps)) {
    return res.status(400).json({ error: "Invalid workflow payload" });
  }

  const workflowUUID = body.workflowUUID || uuidv4();
  const workflowId = body.workflowId || workflowUUID;

  const payload: WorkflowPayload = {
    workflowUUID,
    workflowId,
    name: body.name,
    steps: body.steps.map((s, i) => ({
      stepId: s.stepId || `step-${i + 1}`,
      order: typeof s.order === "number" ? s.order : i + 1,
      title: s.title || `Step ${i + 1}`,
      description: s.description,
      durationSec: s.durationSec,
      page: s.page,
    })),
    createdAt: body.createdAt || new Date().toISOString(),
  };

  store.set(workflowUUID, payload);
  return res.status(201).json(payload);
});

// Fetch workflow
app.get("/api/workflows/:workflowUUID", (req, res) => {
  const wf = store.get(req.params.workflowUUID);
  if (!wf) return res.status(404).json({ error: "Not found" });
  return res.json(wf);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`API running on :${PORT}`));
