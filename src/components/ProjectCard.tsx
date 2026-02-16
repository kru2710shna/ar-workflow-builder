import { motion } from "framer-motion";
import { Clock, ChevronRight, Share2, Loader2, Trash2 } from "lucide-react";
import { Project } from "@/data/mockData";

interface ProjectCardProps {
  project: Project;
  onOpen: (id: string) => void;
  onShare: (project: Project) => void;
  onDelete: (id: string) => void;
  index: number;
}

const ProjectCard = ({ project, onOpen, onShare, onDelete, index }: ProjectCardProps) => {
  const isProcessing = project.status === "processing";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`group relative rounded-lg border bg-card p-5 transition-all duration-300 ${
        isProcessing
          ? "border-primary/30 pulse-glow"
          : "border-border hover:border-primary/40 hover:glow-primary cursor-pointer"
      }`}
      onClick={() => !isProcessing && onOpen(project.id)}
    >
      {isProcessing && (
        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
          <div className="scan-line w-full h-full" />
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-mono font-medium text-primary uppercase tracking-wider">
            {project.category}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(project);
              }}
              className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project.id);
              }}
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h3 className="text-lg font-bold text-foreground mb-2">{project.title}</h3>

        {isProcessing ? (
          <div className="flex items-center gap-2 text-primary">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Analyzing Manual...</span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{project.stepsCount} steps</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {project.createdAt}
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProjectCard;
