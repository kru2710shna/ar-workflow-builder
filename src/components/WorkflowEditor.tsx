import { useState, useCallback } from "react";
import { motion, Reorder } from "framer-motion";
import { GripVertical, Pencil, Trash2, Plus, Check, X, Clock } from "lucide-react";

export type WorkflowEditorStep = {
  id: string;              // stable id (uuid-like or "step-1")
  title: string;           // short title
  description?: string;    // optional detail
  durationSec?: number;    // optional timer in seconds
};

interface WorkflowEditorProps {
  steps: WorkflowEditorStep[];
  onUpdate: (steps: WorkflowEditorStep[]) => void;
}

const WorkflowEditor = ({ steps, onUpdate }: WorkflowEditorProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTimer, setEditTimer] = useState<number>(0);

  const handleReorder = useCallback(
    (newOrder: WorkflowEditorStep[]) => {
      // Keep IDs stable; just update ordering.
      onUpdate(newOrder);
    },
    [onUpdate]
  );

  const startEdit = (step: WorkflowEditorStep) => {
    setEditingId(step.id);
    setEditTitle(step.title);
    setEditDescription(step.description ?? "");
    setEditTimer(step.durationSec ?? 0);
  };

  const saveEdit = () => {
    if (editingId === null) return;

    const next = steps.map((s) =>
      s.id === editingId
        ? {
            ...s,
            title: editTitle.trim() || "Untitled step",
            description: editDescription.trim() || "",
            durationSec: editTimer > 0 ? editTimer : undefined,
          }
        : s
    );

    onUpdate(next);
    setEditingId(null);
  };

  const deleteStep = (id: string) => {
    const filtered = steps.filter((s) => s.id !== id);
    onUpdate(filtered);
  };

  const addStep = () => {
    const newStep: WorkflowEditorStep = {
      id: `step-${Date.now()}`, // stable unique id
      title: "New step",
      description: "New instruction step — edit me.",
      durationSec: undefined,
    };
    onUpdate([...steps, newStep]);
  };

  const formatTime = (seconds?: number) => {
    const v = seconds ?? 0;
    if (!v) return "No timer";
    const m = Math.floor(v / 60);
    const s = v % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3">
      <Reorder.Group axis="y" values={steps} onReorder={handleReorder} className="space-y-2">
        {steps.map((step, index) => (
          <Reorder.Item key={step.id} value={step} className="list-none">
            <motion.div
              layout
              className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors group"
            >
              <div className="cursor-grab active:cursor-grabbing pt-1 text-muted-foreground hover:text-primary transition-colors">
                <GripVertical className="w-5 h-5" />
              </div>

              {/* Display number based on position (not id) */}
              <span className="shrink-0 w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary font-mono">
                {index + 1}
              </span>

              {editingId === step.id ? (
                <div className="flex-1 space-y-2">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full p-3 rounded-md bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Step title"
                    autoFocus
                  />

                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full min-h-[90px] p-3 rounded-md bg-secondary border border-border text-foreground text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Step description (optional)"
                  />

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <input
                      type="number"
                      min={0}
                      value={editTimer}
                      onChange={(e) => setEditTimer(Number(e.target.value))}
                      className="w-28 p-2 rounded-md bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Seconds"
                    />
                    <span className="text-xs text-muted-foreground">seconds</span>

                    <div className="flex-1" />

                    <button
                      onClick={saveEdit}
                      className="p-2 rounded-md bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
                      aria-label="Save"
                    >
                      <Check className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2 rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-relaxed">
                    {step.title}
                  </p>

                  {step.description && (
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  )}

                  {!!step.durationSec && step.durationSec > 0 && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-mono text-accent">
                      <Clock className="w-3 h-3" />
                      {formatTime(step.durationSec)}
                    </span>
                  )}
                </div>
              )}

              {editingId !== step.id && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(step)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => deleteStep(step.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={addStep}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-border hover:border-primary/40 text-muted-foreground hover:text-primary transition-all"
      >
        <Plus className="w-5 h-5" />
        <span className="text-sm font-medium">Add Step</span>
      </motion.button>
    </div>
  );
};

export default WorkflowEditor;
