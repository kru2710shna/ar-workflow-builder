import { useState } from "react";
import { X, Copy, Check, Link } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Project } from "@/data/mockData";

interface ShareDialogProps {
  project: Project | null;
  onClose: () => void;
}

const ShareDialog = ({ project, onClose }: ShareDialogProps) => {
  const [copied, setCopied] = useState(false);

  if (!project) return null;

  const shareUrl = `${window.location.origin}/project/${project.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-lg border border-border bg-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Share Project</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Share <span className="text-primary font-medium">{project.title}</span> with your team.
          </p>

          <div className="flex items-center gap-2 p-3 rounded-md bg-secondary border border-border">
            <Link className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-foreground truncate flex-1 font-mono">
              {shareUrl}
            </span>
            <button
              onClick={handleCopy}
              className="shrink-0 p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="mt-4 p-3 rounded-md bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground">
              <span className="text-primary font-medium">Workflow Data:</span>{" "}
              {project.stepsCount} steps • {project.category}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShareDialog;
