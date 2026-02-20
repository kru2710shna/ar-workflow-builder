// src/components/ErrorBoundary.tsx
import React from "react";

interface State {
    hasError: boolean;
    message: string;
}

export class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    State
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, message: "" };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, message: error.message };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error("ErrorBoundary caught:", error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
                    <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-4">
                        Something went wrong
                    </p>
                    <h1 className="text-2xl font-bold text-foreground mb-2">Page Error</h1>
                    <p className="text-sm text-muted-foreground max-w-md mb-6">
                        {this.state.message || "An unexpected error occurred."}
                    </p>
                    <button
                        onClick={() => window.location.assign("/")}
                        className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        Go Home
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
