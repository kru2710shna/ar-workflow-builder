// src/data/mockData.ts
// Re-export shared types from the canonical location, and provide sample data.
export type { WorkflowStep, Project } from "@/types/workflow";

import type { Project } from "@/types/workflow";

export const mockProjects: Project[] = [
  {
    id: "1",
    title: "IKEA Micke Desk",
    category: "Furniture Assembly",
    stepsCount: 8,
    createdAt: "2026-02-14",
    status: "ready",
    steps: [
      { id: "1", title: "Lay all parts on a soft surface to avoid scratching. Verify all components against the parts list.", durationSec: 0 },
      { id: "2", title: "Insert 4 wooden dowels (104322) into the pre-drilled holes on Side Panel A.", durationSec: 120 },
      { id: "3", title: "Attach Side Panel B to the dowels. Align carefully and press firmly until flush.", durationSec: 90 },
      { id: "4", title: "Secure the back panel using 8 cam-lock screws. Tighten with the Allen key provided.", durationSec: 180 },
      { id: "5", title: "Install the drawer rails on both side panels. Left rail first, then right.", durationSec: 150 },
      { id: "6", title: "Assemble the drawer box and slide onto the rails. Test smooth operation.", durationSec: 120 },
      { id: "7", title: "Attach the desktop surface. Secure with 6 screws from underneath.", durationSec: 200 },
      { id: "8", title: "Install cable management clip on the back. Final inspection complete.", durationSec: 60 },
    ],
  },
  {
    id: "2",
    title: "Sourdough Bread",
    category: "Recipe",
    stepsCount: 6,
    createdAt: "2026-02-13",
    status: "ready",
    steps: [
      { id: "1", title: "Mix 500g flour with 350g water. Let autolyse for 30 minutes.", durationSec: 1800 },
      { id: "2", title: "Add 100g active starter and 10g salt. Fold until combined.", durationSec: 300 },
      { id: "3", title: "Perform stretch-and-fold every 30 minutes for 2 hours.", durationSec: 7200 },
      { id: "4", title: "Shape the dough into a boule. Place in banneton seam-side up.", durationSec: 180 },
      { id: "5", title: "Cold retard in refrigerator for 12-16 hours." },
      { id: "6", title: "Preheat Dutch oven to 250°C. Score and bake: 20 min lid on, 25 min lid off.", durationSec: 2700 },
    ],
  },
  {
    id: "3",
    title: "PCB Soldering Protocol",
    category: "Lab Protocol",
    stepsCount: 5,
    createdAt: "2026-02-10",
    status: "ready",
    steps: [
      { id: "1", title: "Inspect PCB for defects. Clean pads with isopropyl alcohol.", durationSec: 60 },
      { id: "2", title: "Apply flux to all SMD pads. Set soldering iron to 350°C.", durationSec: 30 },
      { id: "3", title: "Place components using tweezers. Start with smallest components first.", durationSec: 300 },
      { id: "4", title: "Solder all joints. Ensure proper wetting and no cold joints.", durationSec: 600 },
      { id: "5", title: "Visual inspection under magnification. Test continuity on critical paths.", durationSec: 120 },
    ],
  },
];
