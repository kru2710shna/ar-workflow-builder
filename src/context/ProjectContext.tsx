import React, { createContext, useContext, useState, useCallback } from "react";
import { Project, mockProjects, WorkflowStep } from "@/data/mockData";

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
                  { id: 1, text: "Unpack all components and verify against checklist.", timer: 0 },
                  { id: 2, text: "Prepare workspace and required tools.", timer: 60 },
                  { id: 3, text: "Follow assembly diagram on page 3.", timer: 300 },
                  { id: 4, text: "Final quality check and cleanup.", timer: 60 },
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
