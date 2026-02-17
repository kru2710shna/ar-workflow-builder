// src/pages/Editor.tsx
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Loader2, UploadCloud } from "lucide-react";

import WorkflowEditor, { type WorkflowEditorStep } from "@/components/WorkflowEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import "./editor.css";
const key = import.meta.env.VITE_GEMINI_KEY;

/**
 * Gemini response schema we expect (strict JSON)
 */
type GeminiWorkflow = {
  title?: string;
  steps: Array<{
    title: string;
    description?: string;
    durationSec?: number;
  }>;
};

const MODEL = "gemini-flash-latest";
const url = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${key}`;




function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const res = String(r.result || "");
      // data:application/pdf;base64,AAA...
      const base64 = res.split(",")[1];
      if (!base64) return reject(new Error("Failed to convert file to base64."));
      resolve(base64);
    };
    r.onerror = () => reject(new Error("Failed to read file."));
    r.readAsDataURL(file);
  });
}

function extractJsonFromText(text: string): unknown {
  // 1) ```json ... ```
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return JSON.parse(fenced[1]);

  // 2) plain JSON
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return JSON.parse(trimmed);

  // 3) best-effort slice first {...} block
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return JSON.parse(text.slice(firstBrace, lastBrace + 1));
  }

  throw new Error("Gemini did not return valid JSON.");
}

function normalizeGeminiWorkflow(raw: unknown): GeminiWorkflow {
  if (!raw || typeof raw !== "object") throw new Error("Gemini returned non-object JSON.");

  const wf = raw as any;

  if (!Array.isArray(wf.steps) || wf.steps.length === 0) {
    throw new Error("Gemini returned JSON but 'steps' is missing or empty.");
  }

  const steps = wf.steps
    .filter(Boolean)
    .slice(0, 20)
    .map((s: any) => {
      const title = typeof s.title === "string" ? s.title.trim() : "";
      const description = typeof s.description === "string" ? s.description.trim() : undefined;

      let durationSec: number | undefined = undefined;
      if (typeof s.durationSec === "number" && Number.isFinite(s.durationSec) && s.durationSec > 0) {
        durationSec = Math.round(s.durationSec);
      }

      if (!title) throw new Error("Gemini produced a step without a title.");

      return { title, description, durationSec };
    });

  return {
    title: typeof wf.title === "string" ? wf.title.trim() : undefined,
    steps,
  };
}

/**
 * Core Gemini call:
 * - Sends the PDF
 * - Strongly instructs: "diagram-first", "image-heavy", "ignore text"
 * - Must return STRICT JSON only
 */
async function generateWorkflowFromPdf(pdfFile: File): Promise<GeminiWorkflow> {
  const key = import.meta.env.VITE_GEMINI_KEY as string | undefined;
  if (!key) throw new Error("Missing VITE_GEMINI_KEY in your .env file.");

  const base64 = await fileToBase64(pdfFile);

  // NOTE: This prompt is tuned for IKEA-style manuals (diagram-heavy),
  // but still works for recipes/SOPs: it prefers visuals when present.
  const prompt = `
You are a workflow extraction engine that produces AR-ready step-by-step instructions.

The input is a PDF that may be IMAGE/DIAGRAM heavy (e.g., IKEA manuals with mostly pictures).
Primary goal: infer steps from diagrams/illustrations. Treat visuals as the source of truth.

Instructions:
- If the PDF contains diagrams, exploded views, arrows, parts callouts, numbered panels: use those to infer the steps.
- Ignore marketing text and irrelevant labels.
- Only use text when it is necessary to disambiguate part names or safety warnings.
- Produce concise, actionable, ordered steps.
- 6 to 20 steps max. If the PDF is large, summarize to the essential steps.
- If timing is implied (wait/bake/cure), set durationSec. Otherwise omit durationSec.

Return STRICT JSON ONLY in this exact schema (no markdown, no commentary, no extra keys):

{
  "title": "short workflow name",
  "steps": [
    {
      "title": "Step title",
      "description": "1-3 sentences max",
      "durationSec": 120
    }
  ]
}
`.trim();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: "application/pdf",
              data: base64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errTxt = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errTxt}`);
  }

  const json = await res.json();

  const text =
    json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || "").join("") || "";

  const parsed = extractJsonFromText(text);
  return normalizeGeminiWorkflow(parsed);
}

export default function Editor() {
  const [pdf, setPdf] = useState<File | null>(null);
  const [title, setTitle] = useState<string>("");

  // IMPORTANT: This must be WorkflowEditorStep[] because WorkflowEditor expects that type.
  const [steps, setSteps] = useState<WorkflowEditorStep[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = useMemo(() => !!pdf && !loading, [pdf, loading]);

  const onPickFile = (file: File | null) => {
    setError(null);
    setSteps([]);
    setTitle("");
    setPdf(file);
  };

  const onGenerate = async () => {
    if (!pdf) return;

    setLoading(true);
    setError(null);

    try {
      const wf = await generateWorkflowFromPdf(pdf);
      setTitle(wf.title || pdf.name.replace(/\.pdf$/i, ""));

      const nextSteps: WorkflowEditorStep[] = wf.steps.map((s, idx) => ({
        id: `step-${idx + 1}`,
        title: s.title || `Step ${idx + 1}`,
        description: s.description || "",
        durationSec: typeof s.durationSec === "number" ? s.durationSec : undefined,
      }));

      setSteps(nextSteps);
    } catch (e: any) {
      setError(e?.message || "Failed to generate workflow.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Minimal nav to match Dashboard aesthetic */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight">XR</span>
          <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
            Workflow Builder
          </span>
        </div>
      </nav>

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-10"
          >
            <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-3">
              PDF → Workflow
            </p>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Turn a manual into steps.
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Upload a PDF (IKEA, recipe, SOP). Gemini extracts an AR-ready workflow you can edit.
            </p>
          </motion.div>

          {/* Upload + Controls */}
          <div className="editor-grid gap-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <UploadCloud className="w-4 h-4" />
                <h2 className="text-sm font-semibold">Upload PDF</h2>
              </div>

              <div className="flex flex-col gap-3">
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => onPickFile(e.target.files?.[0] || null)}
                />

                {pdf && (
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="truncate">{pdf.name}</span>
                  </div>
                )}

                <Button onClick={onGenerate} disabled={!canGenerate} className="mt-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      Generate Workflow <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                {error && <div className="text-sm text-destructive mt-2">{error}</div>}

                <div className="text-xs text-muted-foreground mt-2">
                  Tip: Use a real IKEA PDF/manual for best extraction.
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                    Output
                  </p>
                  <h2 className="text-sm font-semibold">{title || "Workflow Steps"}</h2>
                </div>
              </div>

              {/* If no steps yet, show a clean empty state */}
              {steps.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
                  Upload a PDF and click “Generate Workflow”. Your steps will appear here for editing.
                </div>
              ) : (
                <WorkflowEditor steps={steps} onUpdate={setSteps} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
