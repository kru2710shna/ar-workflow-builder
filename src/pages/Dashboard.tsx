import { motion } from "framer-motion";
import { Cpu, FileText, Eye, Workflow, Timer, Share2, ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-ar.jpg";

const features = [
  {
    icon: FileText,
    title: "PDF to Workflow",
    description: "Drop any manual — IKEA, lab protocols, recipes — and watch it become structured, step-by-step instructions instantly.",
  },
  {
    icon: Eye,
    title: "AR-Ready Display",
    description: "High-contrast, large-type instructions designed for spatial computing. Transparent black mode for XREAL & Meta glasses.",
  },
  {
    icon: Workflow,
    title: "Drag & Reorder",
    description: "Full editorial control. Reorder steps, edit timers, customize every instruction before launching.",
  },
  {
    icon: Timer,
    title: "Built-in Timers",
    description: "Per-step countdown timers keep you on track — from curing epoxy to proofing dough.",
  },
  {
    icon: Share2,
    title: "Share Workflows",
    description: "Generate a link and share your optimized workflow with teammates, students, or the internet.",
  },
];

const useCases = [
  { label: "Furniture Assembly", example: "IKEA Micke Desk — 8 steps, hands-free" },
  { label: "Lab Protocols", example: "PCB Soldering — precision timed steps" },
  { label: "Recipes", example: "Sourdough Bread — 12h workflow tracked" },
  { label: "Maintenance", example: "Engine teardown — torque specs in-view" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight">IndustryXR</span>
          </div>
          <Button size="sm" className="font-mono text-xs tracking-wider">
            Get Early Access
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-primary font-mono text-sm tracking-widest uppercase mb-4">
                Spatial Workflow Engine
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] mb-6">
                Your manuals,{" "}
                <span className="text-primary glow-text">in mid-air.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
                Upload any PDF manual. IndustryXR converts it into AR-ready, step-by-step
                workflows — optimized for hands-free assembly on spatial computing glasses.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="font-mono text-sm tracking-wider glow-primary">
                  Try the Demo
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <Button size="lg" variant="outline" className="font-mono text-sm tracking-wider">
                  Watch Video
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-xl overflow-hidden border border-border glow-primary">
                <img
                  src={heroImage}
                  alt="AR headset displaying holographic assembly instructions over a workbench"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex justify-center mt-16"
          >
            <ChevronDown className="w-6 h-6 text-muted-foreground animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} custom={0} className="text-primary font-mono text-xs tracking-widest uppercase mb-3">
              How It Works
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold">
              From PDF to AR in seconds
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i}
                className="group p-6 rounded-xl border border-border bg-card/50 hover:border-primary/40 hover:glow-primary transition-all duration-300"
              >
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 px-6 border-t border-border/50 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} custom={0} className="text-primary font-mono text-xs tracking-widest uppercase mb-3">
              Use Cases
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold">
              Built for every workflow
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid sm:grid-cols-2 gap-4"
          >
            {useCases.map((uc, i) => (
              <motion.div
                key={uc.label}
                variants={fadeUp}
                custom={i}
                className="flex items-center gap-4 p-5 rounded-lg border border-border bg-card/50 hover:border-primary/30 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <div>
                  <p className="font-semibold text-sm">{uc.label}</p>
                  <p className="text-xs text-muted-foreground font-mono">{uc.example}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-border/50">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to go hands-free?
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-8 text-lg">
            Join the waitlist and be among the first to experience spatial workflows.
          </motion.p>
          <motion.div variants={fadeUp} custom={2}>
            <Button size="lg" className="font-mono text-sm tracking-wider glow-primary">
              Get Early Access
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">IndustryXR</span>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            © 2026 IndustryXR. Spatial workflows for the real world.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
