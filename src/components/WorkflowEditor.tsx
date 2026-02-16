import { useState, useCallback } from "react";
import { motion, Reorder } from "framer-motion";
import { GripVertical, Pencil, Trash2, Plus, Check, X, Clock } from "lucide-react";
import { WorkflowStep } from "@/data/mockData";

interface WorkflowEditorProps {
  steps: WorkflowStep[];
  onUpdate: (steps: WorkflowStep[]) => void;
}

const WorkflowEditor = ({ steps, onUpdate }: WorkflowEditorProps) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editTimer, setEditTimer] = useState(0);

  const handleReorder = useCallback(
    (newOrder: WorkflowStep[]) => {
      const reindexed = newOrder.map((step, i) => ({ ...step, id: i + 1 }));
      onUpdate(reindexed);
    },
    [onUpdate]
  );

  const startEdit = (step: WorkflowStep) => {
    setEditingId(step.id);
    setEditText(step.text);
    setEditTimer(step.timer);
  };

  const saveEdit = () => {
    if (editingId === null) return;
    onUpdate(
      steps.map((s) =>
        s.id === editingId ? { ...s, text: editText, timer: editTimer } : s
      )
    );
    setEditingId(null);
  };

  const deleteStep = (id: number) => {
    const filtered = steps.filter((s) => s.id !== id).map((s, i) => ({ ...s, id: i + 1 }));
    onUpdate(filtered);
  };

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: steps.length + 1,
      text: "New instruction step — edit me.",
      timer: 0,
    };
    onUpdate([...steps, newStep]);
  };

  const formatTime = (seconds: number) => {
    if (seconds === 0) return "No timer";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3">
      <Reorder.Group axis="y" values={steps} onReorder={handleReorder} className="space-y-2">
        {steps.map((step) => (
          <Reorder.Item
            key={step.id}
            value={step}
            className="list-none"
          >
            <motion.div
              layout
              className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors group"
            >
              <div className="cursor-grab active:cursor-grabbing pt-1 text-muted-foreground hover:text-primary transition-colors">
                <GripVertical className="w-5 h-5" />
              </div>

              <span className="shrink-0 w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary font-mono">
                {step.id}
              </span>

              {editingId === step.id ? (
                <div className="flex-1 space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full min-h-[80px] p-3 rounded-md bg-secondary border border-border text-foreground text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <input
                      type="number"
                      value={editTimer}
                      onChange={(e) => setEditTimer(Number(e.target.value))}
                      className="w-24 p-2 rounded-md bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Seconds"
                    />
                    <span className="text-xs text-muted-foreground">seconds</span>
                    <div className="flex-1" />
                    <button
                      onClick={saveEdit}
                      className="p-2 rounded-md bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2 rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed">{step.text}</p>
                  {step.timer > 0 && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-mono text-accent">
                      <Clock className="w-3 h-3" />
                      {formatTime(step.timer)}
                    </span>
                  )}
                </div>
              )}

              {editingId !== step.id && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(step)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteStep(step.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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
