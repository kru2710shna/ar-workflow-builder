// src/pages/Dashboard.tsx
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import UseCaseCarousel from "@/components/UseCaseCarousel";
import { useNavigate } from "react-router-dom";
import demoVideo from "@/assets/My Movie.MOV";

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

const Dashboard = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0); // 0–100
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
    setCurrentTime(fmt(v.currentTime));
  };

  const onLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(fmt(v.duration));
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    const bar = progressRef.current;
    if (!v || !bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    v.currentTime = ratio * v.duration;
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !muted;
    videoRef.current.muted = next;
    setMuted(next);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight">IndusXR</span>
          <Button size="sm" className="text-xs h-8" onClick={() => navigate("/editor")}>
            Try It Now <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-[4rem] font-black leading-[1.05] tracking-tight mb-6">
              Hands-Free Mastery
              <br />
              for Everyday Life.
            </h1>
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed mb-8">
              Upload any PDF manual. Get AR-ready, step-by-step instructions — instantly.
            </p>
            <Button size="lg" className="text-sm tracking-wide" onClick={() => navigate("/editor")}>
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── Demo Video — prominent, right after the hero ── */}
      <section className="px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          {/* Label */}
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-4">
            See IndusXR in action
          </p>

          {/* Video card */}
          <div className="relative rounded-xl overflow-hidden border border-border shadow-2xl group">
            <video
              ref={videoRef}
              src={demoVideo}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-auto block"
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={onLoadedMetadata}
            />

            {/* Progress bar + controls overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 pt-8 pb-3 flex flex-col gap-2">
              {/* Seek bar */}
              <div
                ref={progressRef}
                onClick={seekTo}
                className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer group/bar hover:h-2.5 transition-all"
              >
                <div
                  className="h-full bg-white rounded-full pointer-events-none transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Bottom row: time + mute */}
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-xs font-mono tabular-nums">
                  {currentTime} / {duration}
                </span>
                <button
                  onClick={toggleMute}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-medium hover:bg-white/20 transition-colors"
                >
                  {muted ? (
                    <><VolumeX className="w-3.5 h-3.5" /> Unmute</>
                  ) : (
                    <><Volume2 className="w-3.5 h-3.5" /> Mute</>
                  )}
                </button>
              </div>
            </div>
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
            Upload any manual and get AR-ready step-by-step instructions in seconds.
          </p>
          <Button size="lg" className="text-sm tracking-wide" onClick={() => navigate("/editor")}>
            Try It Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">IndusXR</span>
          <span className="text-xs text-muted-foreground">© 2026</span>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
