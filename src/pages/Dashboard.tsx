// src/pages/Dashboard.tsx
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, Play, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UseCaseCarousel from "@/components/UseCaseCarousel";
import heroImage from "@/assets/hero-ar.jpg";
import demoVideo from "@/assets/demo-video.mp4";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const SHOW_START_NOW_LAST_SECONDS = 5;

const features = [
  {
    title: "PDF → Workflow",
    description: "Drop any manual. Get structured, step-by-step instructions back.",
  },
  {
    title: "AR-Ready",
    description: "High-contrast display designed for spatial computing glasses.",
  },
  {
    title: "Editable Steps",
    description: "Reorder, edit timers, customize every instruction before launch.",
  },
];

// Simple inline email capture — no backend needed.
function EarlyAccessForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    toast.success("You're on the list!", {
      description: "We'll reach out when early access opens.",
    });
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
        <CheckCircle2 className="w-4 h-4 text-primary" />
        You're on the list — we'll be in touch.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-9 text-sm h-10"
          required
        />
      </div>
      <Button type="submit" size="sm" className="h-10 px-4 text-sm shrink-0">
        Get Early Access
      </Button>
    </form>
  );
}

const Dashboard = () => {
  const [showDemo, setShowDemo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showStartNow, setShowStartNow] = useState(false);
  const navigate = useNavigate();

  const openDemo = () => {
    setShowDemo(true);
    setShowStartNow(false);
  };

  const closeDemo = useCallback(() => {
    setShowDemo(false);
    setShowStartNow(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  const updateStartNowVisibility = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const duration = Number.isFinite(v.duration) ? v.duration : 0;
    const remaining = duration - v.currentTime;
    const shouldShow =
      duration > 0 && remaining <= SHOW_START_NOW_LAST_SECONDS && remaining >= 0;
    setShowStartNow(shouldShow);
  }, []);

  const handleStartNow = () => {
    navigate("/editor");
    closeDemo();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight">XR</span>
          <EarlyAccessForm />
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-6">
              Spatial Workflow Engine
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black leading-[1.08] tracking-tight mb-6">
              Your manuals,
              <br />
              in mid-air.
            </h1>
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed mb-4">
              Upload a PDF. Get AR-ready, step-by-step instructions — hands-free.
            </p>
            <p className="text-sm font-mono text-foreground/70 tracking-wide">
              Scan product box → instant guided build.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Image */}
      <section className="px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-5xl mx-auto"
        >
          <div className="rounded-lg overflow-hidden border border-border">
            <img
              src={heroImage}
              alt="AR headset displaying holographic assembly instructions"
              className="w-full h-auto"
            />
          </div>
        </motion.div>
      </section>

      {/* Use Cases Carousel */}
      <UseCaseCarousel />

      {/* Features */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-12"
          >
            How it works
          </motion.p>

          <div className="grid md:grid-cols-3 gap-12">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <h3 className="text-sm font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-border">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            Ready to go hands-free?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md">
            Join the waitlist. Be among the first to experience spatial workflows.
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <Button size="lg" className="text-sm tracking-wide" onClick={openDemo}>
              <Play className="w-4 h-4 mr-2" />
              Try the Demo
            </Button>
            <EarlyAccessForm />
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">XR</span>
          <span className="text-xs text-muted-foreground">© 2026</span>
        </div>
      </footer>

      {/* Video Modal */}
      <AnimatePresence>
        {showDemo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/80 backdrop-blur-sm"
            onClick={closeDemo}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-4xl mx-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeDemo}
                className="absolute -top-12 right-0 text-background/80 hover:text-background transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="rounded-lg overflow-hidden border border-border shadow-2xl">
                <video
                  ref={videoRef}
                  src={demoVideo}
                  autoPlay
                  controls
                  playsInline
                  className="w-full h-auto"
                  onLoadedMetadata={updateStartNowVisibility}
                  onTimeUpdate={updateStartNowVisibility}
                  onSeeked={updateStartNowVisibility}
                  onEnded={() => setShowStartNow(true)}
                />

                {/* START NOW overlay (last 5s) */}
                <AnimatePresence>
                  {showStartNow && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-x-0 bottom-0 p-6 flex justify-center"
                    >
                      <Button
                        size="lg"
                        className="text-sm tracking-wide shadow-xl"
                        onClick={handleStartNow}
                      >
                        START NOW
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
