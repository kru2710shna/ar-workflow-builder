// src/context/ProjectContext.tsx
import React, { createContext, useContext, useState, useCallback } from "react";
import { mockProjects } from "@/data/mockData";
import type { Project, WorkflowStep } from "@/types/workflow";

interface ProjectContextType {
  projects: Project[];
  addProject: (title: string, category: string) => void;
  getProject: (id: string) => Project | undefined;
  updateSteps: (projectId: string, steps: WorkflowStep[]) => void;
  deleteProject: (id: string) => void;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export const useProjects = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjects must be used within ProjectProvider");
  return ctx;
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(mockProjects);

  const addProject = useCallback((title: string, category: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      title,
      category,
      stepsCount: 0,
      createdAt: new Date().toISOString().split("T")[0],
      status: "processing",
      steps: [],
    };
    setProjects((prev) => [newProject, ...prev]);

    // Simulate processing
    setTimeout(() => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === newProject.id
            ? {
              ...p,
              status: "ready" as const,
              stepsCount: 4,
              steps: [
                { id: "1", title: "Unpack all components and verify against checklist." },
                { id: "2", title: "Prepare workspace and required tools.", durationSec: 60 },
                { id: "3", title: "Follow assembly diagram on page 3.", durationSec: 300 },
                { id: "4", title: "Final quality check and cleanup.", durationSec: 60 },
              ],
            }
            : p
        )
      );
    }, 3000);
  }, []);

  const getProject = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects]
  );

  const updateSteps = useCallback((projectId: string, steps: WorkflowStep[]) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, steps, stepsCount: steps.length } : p
      )
    );
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <ProjectContext.Provider value={{ projects, addProject, getProject, updateSteps, deleteProject }}>
      {children}
    </ProjectContext.Provider>
  );
};
