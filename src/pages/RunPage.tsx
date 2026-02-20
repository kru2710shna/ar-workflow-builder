// src/pages/RunPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";
import { getWorkflow } from "@/lib/api";
import ARRunner from "@/components/ARRunner";
import type { WorkflowStep } from "@/types/workflow";

type BackendStep = {
    stepId: string;
    order: number;
    title: string;
    description?: string;
    durationSec?: number;
    page?: number;
};

type BackendWorkflow = {
    workflowUUID: string;
    name: string;
    steps: BackendStep[];
};

function adaptSteps(backendSteps: BackendStep[]): WorkflowStep[] {
    return backendSteps
        .sort((a, b) => a.order - b.order)
        .map((s) => ({
            id: s.stepId,
            title: s.title,
            description: s.description,
            durationSec: s.durationSec,
            page: s.page,
        }));
}

export default function RunPage() {
    const { uuid } = useParams<{ uuid: string }>();
    const navigate = useNavigate();

    const { data, isLoading, isError, error } = useQuery<BackendWorkflow>({
        queryKey: ["workflow", uuid],
        queryFn: () => getWorkflow(uuid!),
        enabled: !!uuid,
        retry: 1,
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <Loader2 className="w-8 h-8 text-primary" />
                </motion.div>
                <p className="text-sm text-muted-foreground font-mono tracking-wide">
                    Loading workflow…
                </p>
            </div>
        );
    }

    if (isError || !data) {
        const msg = (error as any)?.message || "Workflow not found.";
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center p-8">
                <AlertCircle className="w-10 h-10 text-destructive" />
                <h1 className="text-xl font-bold text-foreground">Could not load workflow</h1>
                <p className="text-sm text-muted-foreground max-w-sm">{msg}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 px-4 py-2 rounded-md bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const steps = adaptSteps(data.steps);

    return (
        <ARRunner
            title={data.name}
            steps={steps}
            onExit={() => navigate(-1)}
        />
    );
}
