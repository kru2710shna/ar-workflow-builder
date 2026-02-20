// src/pages/Editor.tsx
import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Loader2, UploadCloud, Link2, Unlink, Play } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import WorkflowEditor from "@/components/WorkflowEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postWorkflow } from "@/lib/api";
import type { WorkflowStep } from "@/types/workflow";
import "./editor.css";

// ---------- Helpers ----------

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

type GeneratedWorkflow = {
  title?: string;
  steps: Array<{
    title: string;
    description?: string;
    durationSec?: number;
    page?: number;
  }>;
};

/**
 * Calls the Express backend which securely calls Claude Haiku server-side.
 * No API key is ever sent to the browser.
 */
async function generateWorkflowFromPdf(pdfFile: File): Promise<GeneratedWorkflow> {
  const base = import.meta.env.VITE_API_BASE as string | undefined;
  if (!base) throw new Error("Missing VITE_API_BASE in .env");

  const pdfBase64 = await fileToBase64(pdfFile);

  const res = await fetch(`${base}/api/generate-workflow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pdfBase64, filename: pdfFile.name }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Workflow generation failed (${res.status}): ${errText}`);
  }

  return res.json() as Promise<GeneratedWorkflow>;
}

// ---------- Component ----------

export default function Editor() {
  const navigate = useNavigate();

  const [pdf, setPdf] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [savedUUID, setSavedUUID] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [steps, setSteps] = useState<WorkflowStep[]>([]);

  const [alignMode, setAlignMode] = useState(false);
  const [activePage, setActivePage] = useState<number>(1);

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const canGenerate = useMemo(() => !!pdf && !generating, [pdf, generating]);

  // Object URL for in-browser PDF preview
  useEffect(() => {
    if (!pdf) {
      setPdfUrl(null);
      setAlignMode(false);
      setActivePage(1);
      return;
    }
    const url = URL.createObjectURL(pdf);
    setPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pdf]);

  // Save mutation (TanStack Query)
  const saveMutation = useMutation({
    mutationFn: postWorkflow,
    onError: (err: any) => {
      console.error("Save to backend failed:", err?.message);
    },
  });

  const onPickFile = (file: File | null) => {
    setGenError(null);
    setSteps([]);
    setTitle("");
    setSavedUUID(null);
    setPdf(file);
    setAlignMode(false);
    setActivePage(1);
  };

  const onGenerate = async () => {
    if (!pdf) return;
    setGenerating(true);
    setGenError(null);

    try {
      const wf = await generateWorkflowFromPdf(pdf);
      const workflowTitle = wf.title || pdf.name.replace(/\.pdf$/i, "");
      setTitle(workflowTitle);

      const nextSteps: WorkflowStep[] = wf.steps.map((s, idx) => ({
        id: `step-${idx + 1}`,
        title: s.title || `Step ${idx + 1}`,
        description: s.description || undefined,
        durationSec: typeof s.durationSec === "number" ? s.durationSec : undefined,
        page: typeof s.page === "number" ? s.page : undefined,
      }));

      setSteps(nextSteps);

      const workflowUUID = crypto.randomUUID();
      setSavedUUID(workflowUUID);

      // Save to backend via TanStack Query mutation
      saveMutation.mutate({
        workflowUUID,
        workflowId: workflowUUID,
        name: workflowTitle,
        steps: nextSteps.map((s, idx) => ({
          stepId: s.id,
          order: idx + 1,
          title: s.title,
          description: s.description,
          durationSec: s.durationSec,
          page: s.page,
        })),
        createdAt: new Date().toISOString(),
      });

      // Jump to first mapped page if align mode is on
      const firstPage = nextSteps.find((x) => typeof x.page === "number")?.page;
      if (alignMode && firstPage) setActivePage(firstPage);
    } catch (e: any) {
      setGenError(e?.message || "Failed to generate workflow.");
    } finally {
      setGenerating(false);
    }
  };

  const onToggleAlign = () => {
    if (!pdfUrl) return;
    setAlignMode((v) => !v);
    if (!alignMode) {
      const firstPage = steps.find((x) => typeof x.page === "number")?.page;
      if (firstPage) setActivePage(firstPage);
    }
  };

  const onSelectStep = (step: WorkflowStep) => {
    if (!alignMode) return;
    if (typeof step.page === "number" && step.page >= 1) {
      setActivePage(step.page);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
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

          {/* Saved workflow info + Launch in AR button */}
          {savedUUID && (
            <div className="mb-6 rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs text-muted-foreground">
                  Workflow ID: <span className="font-mono">{savedUUID}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Share:{" "}
                  <span className="font-mono">
                    {`${window.location.origin}/run/${savedUUID}`}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                className="shrink-0 gap-2"
                onClick={() => navigate(`/run/${savedUUID}`)}
              >
                <Play className="w-4 h-4" />
                Launch in AR
              </Button>
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
              Upload a PDF (IKEA, recipe, SOP). Claude Haiku extracts an AR-ready workflow you can edit.
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
                  {generating ? (
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

                {genError && (
                  <div className="text-sm text-destructive mt-2">{genError}</div>
                )}

                {saveMutation.isError && (
                  <div className="text-xs text-muted-foreground mt-1">
                    ⚠ Auto-save failed — your workflow is still shown below.
                  </div>
                )}

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

              {steps.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
                  Upload a PDF and click "Generate Workflow". Your steps will appear here for editing.
                </div>
              ) : (
                <>
                  <WorkflowEditor steps={steps} onUpdate={setSteps} onSelectStep={onSelectStep} />

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
