// src/components/ARRunner.tsx
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Timer, Eye, Layers } from "lucide-react";
import type { WorkflowStep } from "@/types/workflow";

interface ARRunnerProps {
  title: string;
  steps: WorkflowStep[];
  onExit: () => void;
}

const ARRunner = ({ title, steps, onExit }: ARRunnerProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [arMode, setArMode] = useState(false);

  const step = steps[currentStep];

  useEffect(() => {
    const duration = step?.durationSec ?? 0;
    if (duration > 0) {
      setTimeLeft(duration);
      setTimerActive(true);
    } else {
      setTimeLeft(0);
      setTimerActive(false);
    }
  }, [currentStep, step]);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setTimerActive(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const next = useCallback(() => {
    if (currentStep < steps.length - 1) setCurrentStep((c) => c + 1);
  }, [currentStep, steps.length]);

  const prev = useCallback(() => {
    if (currentStep > 0) setCurrentStep((c) => c - 1);
  }, [currentStep]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex flex-col ${arMode ? "ar-mode" : "bg-background"}`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between p-4 ${arMode ? "" : "border-b border-border"}`}>
        <button
          onClick={onExit}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="text-center">
          <p className={`text-xs font-mono uppercase tracking-wider ${arMode ? "text-primary" : "text-muted-foreground"}`}>
            {title}
          </p>
          <p className="text-sm font-bold text-foreground">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>
        <button
          onClick={() => setArMode(!arMode)}
          className={`p-2 rounded-md transition-colors ${arMode
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            }`}
          title={arMode ? "Exit AR Mode" : "Enter AR Mode"}
        >
          {arMode ? <Layers className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
        </button>
      </div>

      {/* Progress bar */}
      <div className={`h-1 ${arMode ? "bg-secondary/20" : "bg-secondary"}`}>
        <motion.div
          className="h-full bg-primary"
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl w-full text-center space-y-8"
          >
            {/* Step number badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-sm font-mono font-bold text-primary">
                STEP {currentStep + 1}
              </span>
            </div>

            {/* Instruction text */}
            <p className={`text-2xl font-semibold leading-relaxed ${arMode ? "text-primary" : "text-foreground"}`}>
              {step.title}
            </p>

            {/* Description */}
            {step.description && (
              <p className={`text-base leading-relaxed ${arMode ? "text-primary/70" : "text-muted-foreground"}`}>
                {step.description}
              </p>
            )}

            {/* Timer */}
            {(step.durationSec ?? 0) > 0 && (
              <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-lg ${arMode ? "bg-accent/10 border border-accent/30" : "bg-secondary border border-border"
                }`}>
                <Timer className={`w-6 h-6 ${timeLeft === 0 ? "text-accent" : "text-primary"}`} />
                <span className={`text-3xl font-mono font-bold ${timeLeft === 0 ? "text-accent" : "text-foreground"
                  }`}>
                  {formatTime(timeLeft)}
                </span>
                {timeLeft === 0 && (
                  <span className="text-sm font-medium text-accent">DONE</span>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="p-4 flex items-center gap-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={prev}
          disabled={currentStep === 0}
          className={`flex-1 flex items-center justify-center gap-2 py-5 rounded-lg text-lg font-bold transition-all ${currentStep === 0
              ? "bg-secondary/50 text-muted-foreground cursor-not-allowed"
              : "bg-secondary text-foreground hover:bg-secondary/80 active:bg-secondary/60"
            }`}
        >
          <ChevronLeft className="w-6 h-6" />
          BACK
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={next}
          disabled={currentStep === steps.length - 1}
          className={`flex-1 flex items-center justify-center gap-2 py-5 rounded-lg text-lg font-bold transition-all ${currentStep === steps.length - 1
              ? "bg-primary/30 text-primary/50 cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80"
            }`}
        >
          NEXT
          <ChevronRight className="w-6 h-6" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ARRunner;
