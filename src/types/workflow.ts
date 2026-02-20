// src/types/workflow.ts
// Single source of truth for the shared step / project types.
// Used by: WorkflowEditor, ARRunner, ProjectContext, mockData, RunPage, Editor.

export interface WorkflowStep {
    /** Stable unique id (uuid-like or "step-1") */
    id: string;
    /** Short, actionable step title */
    title: string;
    /** Optional longer description */
    description?: string;
    /** Optional countdown timer in seconds */
    durationSec?: number;
    /** 1-based PDF page this step was extracted from */
    page?: number;
}

export interface Project {
    id: string;
    title: string;
    category: string;
    stepsCount: number;
    createdAt: string;
    status: "ready" | "processing";
    steps: WorkflowStep[];
}
