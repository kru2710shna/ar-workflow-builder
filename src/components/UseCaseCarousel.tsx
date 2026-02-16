import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import usecaseIndustrial from "@/assets/usecase-industrial.jpg";
import usecaseField from "@/assets/usecase-field.jpg";
import usecaseMedical from "@/assets/usecase-medical.jpg";
import usecaseManufacturing from "@/assets/usecase-manufacturing.jpg";
import usecaseMilitary from "@/assets/usecase-military.jpg";
import usecaseLab from "@/assets/usecase-lab.jpg";
import usecaseAviation from "@/assets/usecase-aviation.jpg";

const useCases = [
  {
    label: "Industrial Maintenance",
    tagline: "Hands occupied. Errors expensive.",
    image: usecaseIndustrial,
    examples: ["Aircraft engine servicing", "Wind turbine repair", "Oil refinery valve replacement", "Factory robotics calibration"],
    why: "Technicians wear gloves in dirty, oily environments. No clean place for a tablet. Schematics are complex. Errors cost millions. AR keeps instructions always in field of view.",
  },
  {
    label: "Field Service & Utilities",
    tagline: "Both hands busy. 40 feet up.",
    image: usecaseField,
    examples: ["Power grid repairs", "Telecom tower servicing", "Underground inspection", "Solar installation"],
    why: "Outdoor environments, climbing ladders, high-risk tasks. Cannot hold a phone while climbing. Screen glare in sunlight. Risk of dropping. AR stays in your line of sight.",
  },
  {
    label: "Medical & Clinical",
    tagline: "Sterile hands. Zero contamination.",
    image: usecaseMedical,
    examples: ["Surgical step checklist", "Sterile field procedure", "Emergency room protocols"],
    why: "Cannot touch a phone with sterile hands. Tablet in sterile zone means contamination risk. AR provides real-time checklists in line of sight — no touch required.",
  },
  {
    label: "Manufacturing Assembly",
    tagline: "High step count. Time sensitive.",
    image: usecaseManufacturing,
    examples: ["Wiring harness assembly", "PCB assembly guidance", "Complex machine build"],
    why: "Workers repeat processes with variations. High step counts under time pressure. AR reduces training time and provides real-time error reduction on the line.",
  },
  {
    label: "Military & Defense",
    tagline: "No external device allowed.",
    image: usecaseMilitary,
    examples: ["Equipment assembly", "Field repair", "SOP rehearsal"],
    why: "Hands occupied with equipment. Complex sequences in high-pressure environments. No external device allowed in many contexts. AR integrates directly into existing gear.",
  },
  {
    label: "Laboratory & Biotech",
    tagline: "Gloves on. Precision timing.",
    image: usecaseLab,
    examples: ["Multi-step chemical protocol", "PCR setup", "Clean room assembly"],
    why: "Gloves and contamination risk mean no touching devices. Precision timing is critical. Must follow exact order. AR eliminates the contamination risk of tablets entirely.",
  },
  {
    label: "Aviation & Marine",
    tagline: "The natural next step.",
    image: usecaseAviation,
    examples: ["Aircraft maintenance checklist", "Ship engine room procedure"],
    why: "These industries already use digital checklists and SOP engines. AR is the natural evolution — hands-free, always visible, integrated into existing workflows.",
  },
];

const UseCaseCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const goTo = (index: number) => {
    const wrapped = ((index % useCases.length) + useCases.length) % useCases.length;
    setActiveIndex(wrapped);
  };

  const getCardStyle = (index: number) => {
    const total = useCases.length;
    let diff = index - activeIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;

    const absD = Math.abs(diff);
    const isVisible = absD <= 3;

    return {
      x: diff * 72,
      rotate: diff * 4,
      scale: 1 - absD * 0.08,
      zIndex: 10 - absD,
      opacity: isVisible ? 1 - absD * 0.2 : 0,
      pointerEvents: (isVisible ? "auto" : "none") as "auto" | "none",
    };
  };

  return (
    <section className="py-24 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-3">
          Where AR wins
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-16">
          Genuinely useful.
        </h2>

        {/* Carousel */}
        <div className="relative flex items-center justify-center min-h-[480px] select-none">
          {/* Nav arrows */}
          <button
            onClick={() => goTo(activeIndex - 1)}
            className="absolute left-0 z-20 p-2 rounded-full border border-border bg-background hover:bg-accent transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={() => goTo(activeIndex + 1)}
            className="absolute right-0 z-20 p-2 rounded-full border border-border bg-background hover:bg-accent transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>

          {/* Cards */}
          <div className="relative w-[300px] h-[420px]">
            {useCases.map((uc, index) => {
              const style = getCardStyle(index);
              return (
                <motion.div
                  key={uc.label}
                  animate={{
                    x: style.x,
                    rotate: style.rotate,
                    scale: style.scale,
                    opacity: style.opacity,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{
                    zIndex: style.zIndex,
                    pointerEvents: style.pointerEvents,
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                  className="w-[300px] h-[420px] cursor-pointer"
                  onClick={() => {
                    if (index === activeIndex) {
                      setExpandedIndex(index);
                    } else {
                      goTo(index);
                    }
                  }}
                >
                  <div className="relative w-full h-full rounded-xl overflow-hidden border border-border bg-card shadow-sm">
                    <img
                      src={uc.image}
                      alt={uc.label}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <p className="text-xs font-mono tracking-widest uppercase text-background/70 mb-1">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3 className="text-lg font-bold text-background mb-1">
                        {uc.label}
                      </h3>
                      <p className="text-sm text-background/70">{uc.tagline}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {useCases.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === activeIndex ? "bg-foreground w-6" : "bg-border"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Expanded detail modal */}
      <AnimatePresence>
        {expandedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setExpandedIndex(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-lg bg-background rounded-xl border border-border shadow-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={useCases[expandedIndex].image}
                alt={useCases[expandedIndex].label}
                className="w-full h-48 object-cover"
              />
              <button
                onClick={() => setExpandedIndex(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-background/80 border border-border hover:bg-accent transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="p-6">
                <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-2">
                  Category {String(expandedIndex + 1).padStart(2, "0")}
                </p>
                <h3 className="text-xl font-bold mb-1">
                  {useCases[expandedIndex].label}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {useCases[expandedIndex].tagline}
                </p>

                <div className="mb-4">
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">
                    Examples
                  </p>
                  <ul className="space-y-1">
                    {useCases[expandedIndex].examples.map((ex) => (
                      <li key={ex} className="text-sm text-foreground flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-foreground shrink-0" />
                        {ex}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">
                    Why AR wins
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {useCases[expandedIndex].why}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default UseCaseCarousel;
