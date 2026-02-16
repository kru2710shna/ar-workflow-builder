export interface WorkflowStep {
  id: number;
  text: string;
  timer: number;
  imageUrl?: string;
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

export const mockProjects: Project[] = [
  {
    id: "1",
    title: "IKEA Micke Desk",
    category: "Furniture Assembly",
    stepsCount: 8,
    createdAt: "2026-02-14",
    status: "ready",
    steps: [
      { id: 1, text: "Lay all parts on a soft surface to avoid scratching. Verify all components against the parts list.", timer: 0 },
      { id: 2, text: "Insert 4 wooden dowels (104322) into the pre-drilled holes on Side Panel A.", timer: 120 },
      { id: 3, text: "Attach Side Panel B to the dowels. Align carefully and press firmly until flush.", timer: 90 },
      { id: 4, text: "Secure the back panel using 8 cam-lock screws. Tighten with the Allen key provided.", timer: 180 },
      { id: 5, text: "Install the drawer rails on both side panels. Left rail first, then right.", timer: 150 },
      { id: 6, text: "Assemble the drawer box and slide onto the rails. Test smooth operation.", timer: 120 },
      { id: 7, text: "Attach the desktop surface. Secure with 6 screws from underneath.", timer: 200 },
      { id: 8, text: "Install cable management clip on the back. Final inspection complete.", timer: 60 },
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
      { id: 1, text: "Mix 500g flour with 350g water. Let autolyse for 30 minutes.", timer: 1800 },
      { id: 2, text: "Add 100g active starter and 10g salt. Fold until combined.", timer: 300 },
      { id: 3, text: "Perform stretch-and-fold every 30 minutes for 2 hours.", timer: 7200 },
      { id: 4, text: "Shape the dough into a boule. Place in banneton seam-side up.", timer: 180 },
      { id: 5, text: "Cold retard in refrigerator for 12-16 hours.", timer: 0 },
      { id: 6, text: "Preheat Dutch oven to 250°C. Score and bake: 20 min lid on, 25 min lid off.", timer: 2700 },
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
      { id: 1, text: "Inspect PCB for defects. Clean pads with isopropyl alcohol.", timer: 60 },
      { id: 2, text: "Apply flux to all SMD pads. Set soldering iron to 350°C.", timer: 30 },
      { id: 3, text: "Place components using tweezers. Start with smallest components first.", timer: 300 },
      { id: 4, text: "Solder all joints. Ensure proper wetting and no cold joints.", timer: 600 },
      { id: 5, text: "Visual inspection under magnification. Test continuity on critical paths.", timer: 120 },
    ],
  },
];
