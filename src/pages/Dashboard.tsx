import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Cpu } from "lucide-react";
import { useProjects } from "@/context/ProjectContext";
import UploadZone from "@/components/UploadZone";
import ProjectCard from "@/components/ProjectCard";
import ShareDialog from "@/components/ShareDialog";
import { Project } from "@/data/mockData";

const Dashboard = () => {
  const { projects, addProject, deleteProject } = useProjects();
  const navigate = useNavigate();
  const [shareProject, setShareProject] = useState<Project | null>(null);

  const handleUpload = (fileName: string) => {
    addProject(fileName, "Uploaded Manual");
  };

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 glow-primary">
            <Cpu className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              IndustryXR
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              Workflow Orchestrator
            </p>
          </div>
        </motion.div>

        {/* Upload */}
        <div className="mb-8">
          <UploadZone onUpload={handleUpload} />
        </div>

        {/* Projects */}
        <div className="mb-4">
          <h2 className="text-sm font-mono font-medium text-muted-foreground uppercase tracking-wider">
            Active Projects ({projects.length})
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              onOpen={(id) => navigate(`/project/${id}`)}
              onShare={(p) => setShareProject(p)}
              onDelete={deleteProject}
            />
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No projects yet.</p>
            <p className="text-sm">Upload a PDF manual to get started.</p>
          </div>
        )}
      </div>

      <ShareDialog project={shareProject} onClose={() => setShareProject(null)} />
    </div>
  );
};

export default Dashboard;
