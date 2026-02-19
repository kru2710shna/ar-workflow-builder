// src/pages/Editor.tsx
import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Loader2, UploadCloud, Link2, Unlink } from "lucide-react";

import WorkflowEditor, { type WorkflowEditorStep } from "@/components/WorkflowEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { v4 as uuidv4 } from "uuid";
import "./editor.css";
import { postWorkflow } from "@/lib/api";


/**
 * Extend the editor step with optional PDF page mapping.
 * (WorkflowEditor will ignore extra fields safely)
 */
type EditorStep = WorkflowEditorStep & {
  page?: number; // 1-based page number
};

type GeminiWorkflow = {
  title?: string;
  steps: Array<{
    title: string;
    description?: string;
    durationSec?: number;
    page?: number;
  }>;
};

const MODEL = "gemini-flash-latest";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const res = String(r.result || "");
      const base64 = res.split(",")[1];
      if (!base64) return reject(new Error("Failed to convert file to base64."));
      resolve(base64);
    };
    r.onerror = () => reject(new Error("Failed to read file."));
    r.readAsDataURL(file);
  });
}

async function saveWorkflowToBackend(payload: any) {
  const base = import.meta.env.VITE_API_BASE as string | undefined;
  if (!base) throw new Error("Missing VITE_API_BASE in .env");

  const res = await fetch(`${base}/api/workflows`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Backend save failed (${res.status}): ${t}`);
  }

  return res.json();
}


function extractJsonFromText(text: string): unknown {
  // Remove markdown fences
  text = text.replace(/```json/g, "").replace(/```/g, "").trim();

  // Find first { and last }
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");

  if (first === -1 || last === -1) {
    throw new Error("No JSON object found in model output.");
  }

  const candidate = text.slice(first, last + 1);

  try {
    return JSON.parse(candidate);
  } catch (err) {
    console.error("Raw model output:\n", text);
    throw new Error("Model returned malformed JSON.");
  }
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

      let page: number | undefined = undefined;
      if (typeof s.page === "number" && Number.isFinite(s.page) && s.page >= 1) {
        page = Math.floor(s.page);
      }

      if (!title) throw new Error("Gemini produced a step without a title.");
      return { title, description, durationSec, page };
    });

  return {
    title: typeof wf.title === "string" ? wf.title.trim() : undefined,
    steps,
  };
}

async function generateWorkflowFromPdf(pdfFile: File): Promise<GeminiWorkflow> {
  const key = import.meta.env.VITE_GEMINI_KEY as string | undefined;
  if (!key) throw new Error("Missing VITE_GEMINI_KEY in your .env file.");

  const base64 = await fileToBase64(pdfFile);

  // IMPORTANT: image-heavy / diagram-first + page alignment
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

CRITICAL: Align steps to PDF pages.
For each step, include a 1-based "page" number indicating the most relevant PDF page where that step is shown (diagram/panel).
If a step spans multiple pages, choose the best primary page.

Return STRICT JSON ONLY in this exact schema (no markdown, no commentary, no extra keys):

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
}
`.trim();

  // KEEP what’s working for you: v1beta + gemini-flash-latest
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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [savedUUID, setSavedUUID] = useState<string | null>(null);

  const [title, setTitle] = useState<string>("");
  const [steps, setSteps] = useState<EditorStep[]>([]);

  const [alignMode, setAlignMode] = useState(false);
  const [activePage, setActivePage] = useState<number>(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = useMemo(() => !!pdf && !loading, [pdf, loading]);

  // Create/revoke object URL for PDF viewing
  useEffect(() => {
    if (!pdf) {
      setPdfUrl(null);
      setAlignMode(false);
      setActivePage(1);
      return;
    }

    const url = URL.createObjectURL(pdf);
    setPdfUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pdf]);

  const onPickFile = (file: File | null) => {
    setError(null);
    setSteps([]);
    setTitle("");
    setSavedUUID(null);
    setPdf(file);
    setAlignMode(false);
    setActivePage(1);
  };

  const onGenerate = async () => {
    if (!pdf) return;

    setLoading(true);
    setError(null);

    try {
      const wf = await generateWorkflowFromPdf(pdf);
      setTitle(wf.title || pdf.name.replace(/\.pdf$/i, ""));

      const nextSteps: EditorStep[] = wf.steps.map((s, idx) => ({
        id: `step-${idx + 1}`,
        title: s.title || `Step ${idx + 1}`,
        description: s.description || "",
        durationSec: typeof s.durationSec === "number" ? s.durationSec : undefined,
        page: typeof s.page === "number" ? s.page : undefined,
      }));

      setSteps(nextSteps);

      const workflowUUID = crypto.randomUUID();
      setSavedUUID(workflowUUID);

      const payload = {
        workflowUUID,
        workflowId: workflowUUID,
        name: wf.title || pdf.name.replace(/\.pdf$/i, ""),
        steps: nextSteps.map((s, idx) => ({
          stepId: s.id,
          order: idx + 1,
          title: s.title,
          description: s.description,
          durationSec: s.durationSec,
          page: (s as any).page,
        })),
        createdAt: new Date().toISOString(),
      };

      // send to backend (does not change UI)
      await postWorkflow(payload);;


      // If align is on and the first step has a page, jump there
      const firstPage = nextSteps.find((x) => typeof x.page === "number")?.page;
      if (alignMode && firstPage) setActivePage(firstPage);
    } catch (e: any) {
      setError(e?.message || "Failed to generate workflow.");
    } finally {
      setLoading(false);
    }
  };

  const onToggleAlign = () => {
    // Only allow if we have a pdf loaded
    if (!pdfUrl) return;
    setAlignMode((v) => !v);

    // When turning on, try to jump to first mapped page
    if (!alignMode) {
      const firstPage = steps.find((x) => typeof x.page === "number")?.page;
      if (firstPage) setActivePage(firstPage);
    }
  };

  const onSelectStep = (step: WorkflowEditorStep) => {
    if (!alignMode) return;

    const s = step as EditorStep;
    if (typeof s.page === "number" && s.page >= 1) {
      setActivePage(s.page);
      return;
    }

    // If no page mapping exists for this step, do nothing (no UI disruption)
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
          {savedUUID && (
            <div className="mb-6 rounded-xl border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground">
                Saved workflow ID: <span className="font-mono">{savedUUID}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Share link:{" "}
                <span className="font-mono">
                  {`${window.location.origin}/project/${savedUUID}`}
                </span>
              </div>
            </div>
          )}
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

                {/* Align toggle — small, minimal UI change */}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={onToggleAlign}
                  disabled={!pdfUrl}
                >
                  {alignMode ? (
                    <>
                      <Unlink className="w-4 h-4 mr-2" />
                      Aligned
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 mr-2" />
                      Align with PDF
                    </>
                  )}
                </Button>
              </div>

              {/* If no steps yet, show a clean empty state */}
              {steps.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
                  Upload a PDF and click “Generate Workflow”. Your steps will appear here for editing.
                </div>
              ) : (
                <>
                  {/* Workflow editor (unchanged UI) + step click support */}
                  <WorkflowEditor steps={steps} onUpdate={setSteps} onSelectStep={onSelectStep} />

                  {/* PDF viewer appears only when align is enabled */}
                  {alignMode && pdfUrl && (
                    <div className="mt-5 rounded-lg overflow-hidden border border-border">
                      <object
                        data={`${pdfUrl}#page=${activePage}`}
                        type="application/pdf"
                        className="w-full"
                        style={{ height: 520 }}
                      >
                        <div className="p-4 text-sm text-muted-foreground">
                          PDF preview unavailable in this browser. Try Chrome, or download the file.
                        </div>
                      </object>
                      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground font-mono">
                        Viewing page {activePage}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
