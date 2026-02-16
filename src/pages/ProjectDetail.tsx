import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Share2, Braces } from "lucide-react";
import { useProjects } from "@/context/ProjectContext";
import WorkflowEditor from "@/components/WorkflowEditor";
import ARRunner from "@/components/ARRunner";
import ShareDialog from "@/components/ShareDialog";

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProject, updateSteps } = useProjects();
  const [showAR, setShowAR] = useState(false);
  const [showJSON, setShowJSON] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const project = getProject(id || "");

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Project not found.</p>
      </div>
    );
  }

  if (showAR) {
    return (
      <ARRunner
        title={project.title}
        steps={project.steps}
        onExit={() => setShowAR(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Nav */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between mb-6"
        >
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShare(true)}
              className="p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowJSON(!showJSON)}
              className={`p-2 rounded-md transition-colors ${
                showJSON
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              }`}
            >
              <Braces className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <span className="text-xs font-mono font-medium text-primary uppercase tracking-wider">
            {project.category}
          </span>
          <h1 className="text-2xl font-bold text-foreground mt-1">{project.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {project.steps.length} steps • Created {project.createdAt}
          </p>
        </motion.div>

        {/* Launch AR */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setShowAR(true)}
          className="w-full flex items-center justify-center gap-3 py-4 mb-6 rounded-lg bg-primary text-primary-foreground font-bold text-lg glow-primary hover:bg-primary/90 transition-all"
        >
          <Play className="w-6 h-6" />
          Launch in AR
        </motion.button>

        {/* JSON Preview */}
        {showJSON && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <pre className="p-4 rounded-lg bg-card border border-border text-xs font-mono text-muted-foreground overflow-x-auto max-h-64 overflow-y-auto">
              {JSON.stringify(
                { title: project.title, steps: project.steps },
                null,
                2
              )}
            </pre>
          </motion.div>
        )}

        {/* Workflow Editor */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-sm font-mono font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Workflow Steps
          </h2>
          <WorkflowEditor
            steps={project.steps}
            onUpdate={(steps) => updateSteps(project.id, steps)}
          />
        </motion.div>
      </div>

      <ShareDialog
        project={showShare ? project : null}
        onClose={() => setShowShare(false)}
      />
    </div>
  );
};

export default ProjectDetail;
