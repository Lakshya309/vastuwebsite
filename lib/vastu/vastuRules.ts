export interface VastuRule {
  devtaName: string;
  description: string;
  optimal: string[];
  avoid: string[];
}

export const vastuRules: Record<string, VastuRule> = {
  // =========================
  // CENTER
  // =========================
  "Brahma": {
    devtaName: "Brahma",
    description: "The creative core and balance point of the plot. Governs harmony and energy circulation.",
    optimal: ["Open Space", "Courtyard (uncovered)", "Skylight", "Low-height decor"],
    avoid: ["Heavy furniture", "Columns/Pillars", "Toilets", "Staircases", "Bedrooms", "Kitchen/Stove"]
  },

  // =========================
  // MIDDLE RING (16)
  // =========================
  "Shikhi": {
    devtaName: "Shikhi",
    description: "Zone of fire, clarity, and inspiration. Supports focused inner activity.",
    optimal: ["Meditation", "Yoga", "Study desk", "Spiritual practices"],
    avoid: ["Water elements", "Toilets", "Septic tanks"]
  },

  "Parjanya": {
    devtaName: "Parjanya",
    description: "Zone of nourishment and growth. Governs rainfall, sustenance, and renewal.",
    optimal: ["Indoor plants", "Water purifier", "Healing spaces"],
    avoid: ["Fire sources", "Excessive heat"]
  },

  "Jayanta": {
    devtaName: "Jayanta",
    description: "Zone of victory, progress, and ambition.",
    optimal: ["Workstation", "Office desk", "Planning area"],
    avoid: ["Sleeping zones", "Storage clutter"]
  },

  "Indra": {
    devtaName: "Indra",
    description: "Zone of leadership, power, and social interaction.",
    optimal: ["Living Room", "Sofa", "Drawing Room", "Meeting space"],
    avoid: ["Toilets", "Shoe racks", "Heavy storage"]
  },

  "Surya": {
    devtaName: "Surya",
    description: "Zone of vitality, health, and authority.",
    optimal: ["Sunlight access", "Windows", "Morning activity space"],
    avoid: ["Dark storage", "Bathrooms"]
  },

  "Satya": {
    devtaName: "Satya",
    description: "Zone of truth, stability, and ethical grounding.",
    optimal: ["Pooja Room", "Prayer", "Study"],
    avoid: ["Entertainment units", "Television"]
  },

  "Bhrisha": {
    devtaName: "Bhrisha",
    description: "Zone of endurance and strength.",
    optimal: ["Gym equipment", "Safe", "Heavy furniture (controlled)"],
    avoid: ["Water features", "Loose clutter"]
  },

  "Akash": {
    devtaName: "Akash",
    description: "Zone of space, expansion, and connectivity.",
    optimal: ["Open passages", "Ventilation", "Corridors"],
    avoid: ["Closed storage", "Heavy cupboards"]
  },

  "Vayu": {
    devtaName: "Vayu",
    description: "Zone of movement, breath, and circulation.",
    optimal: ["Windows", "Balcony doors", "Air flow"],
    avoid: ["Blocked walls", "Heavy wardrobes"]
  },

  "Pusha": {
    devtaName: "Pusha",
    description: "Zone of nourishment and care.",
    optimal: ["Dining Table", "Food storage", "Pantry"],
    avoid: ["Toilets", "Waste bins"]
  },

  "Vitatha": {
    devtaName: "Vitatha",
    description: "Zone of instability and imbalance if misused.",
    optimal: ["Light movement areas", "Circulation"],
    avoid: ["Permanent furniture", "Beds"]
  },

  "Gruhakshat": {
    devtaName: "Gruhakshat",
    description: "Protector of the house structure.",
    optimal: ["Walls", "Structural supports"],
    avoid: ["Water leakage", "Weak construction"]
  },

  "Yama": {
    devtaName: "Yama",
    description: "Zone of discipline, control, and restraint.",
    optimal: ["Wardrobe", "Storage", "Master Bedroom (controlled use)"],
    avoid: ["Children’s play", "Entertainment zones"]
  },

  "Gandharva": {
    devtaName: "Gandharva",
    description: "Zone of creativity, art, and music.",
    optimal: ["Music room", "Art studio", "Decor display"],
    avoid: ["Toilets", "Heavy storage"]
  },

  "Bhringraj": {
    devtaName: "Bhringraj",
    description: "Zone of healing and rejuvenation.",
    optimal: ["Massage chair", "Healing corner", "Rest area"],
    avoid: ["Noise sources", "Electronics overload"]
  },

  "Marut": {
    devtaName: "Marut",
    description: "Zone of dynamic energy and movement.",
    optimal: ["Entry circulation", "Passageways"],
    avoid: ["Sleeping areas", "Heavy storage"]
  },

  // =========================
  // OUTER RING (32)
  // =========================
  "Dishah Shiva": {
    devtaName: "Dishah Shiva",
    description: "Guardian of directions and boundaries.",
    optimal: ["Compound wall", "Boundary definition"],
    avoid: ["Open cuts", "Broken edges"]
  },

  "Soma": {
    devtaName: "Soma",
    description: "Zone of wealth, calmness, and nourishment.",
    optimal: ["Pooja Room", "Cash locker", "Water storage"],
    avoid: ["Toilets", "Stove"]
  },

  "Sthana": {
    devtaName: "Sthana",
    description: "Zone of grounding and positional stability.",
    optimal: ["Heavy furniture", "Storage"],
    avoid: ["Frequent movement"]
  },

  "Bhallat": {
    devtaName: "Bhallat",
    description: "Sensitive zone linked to health disturbances.",
    optimal: ["Open space", "Light use"],
    avoid: ["Bedrooms", "Cooking"]
  },

  "Mukhya": {
    devtaName: "Mukhya",
    description: "Primary directional influence zone.",
    optimal: ["Main Door", "Entrance foyer"],
    avoid: ["Toilets", "Obstructions"]
  },

  "Bhujag": {
    devtaName: "Bhujag",
    description: "Zone of subterranean and grounding energies.",
    optimal: ["Underground tank (if needed)", "Foundation"],
    avoid: ["Fire elements"]
  },

  "Aaditi": {
    devtaName: "Aaditi",
    description: "Zone of expansion and positivity.",
    optimal: ["Windows", "Open lawns"],
    avoid: ["Heavy storage"]
  },

  "Diti": {
    devtaName: "Diti",
    description: "Zone of material expansion and vision.",
    optimal: ["Living Room", "Balcony", "Television"],
    avoid: ["Congestion", "Blocked spaces"]
  },

  "Shura": {
    devtaName: "Shura",
    description: "Zone of courage and assertiveness.",
    optimal: ["Office", "Decision desk"],
    avoid: ["Sleeping zones"]
  },

  "Apa": {
    devtaName: "Apa",
    description: "Zone of water and purification.",
    optimal: ["Bathroom", "Wash basin"],
    avoid: ["Fire appliances"]
  },

  "Apavatsa": {
    devtaName: "Apavatsa",
    description: "Zone of waste and disposal.",
    optimal: ["Drainage", "Waste outlet"],
    avoid: ["Living areas"]
  },

  "Savitri": {
    devtaName: "Savitri",
    description: "Zone of illumination and knowledge.",
    optimal: ["Study", "Reading corner"],
    avoid: ["Dark storage"]
  },

  "Indrajit": {
    devtaName: "Indrajit",
    description: "Zone of dominance and control.",
    optimal: ["Security room", "Control systems"],
    avoid: ["Soft leisure spaces"]
  },

  "Vivashvana": {
    devtaName: "Vivashvana",
    description: "Zone of solar influence and discipline.",
    optimal: ["Early activity zones"],
    avoid: ["Sleeping late-use rooms"]
  },

  "Mitra": {
    devtaName: "Mitra",
    description: "Zone of harmony and relationships.",
    optimal: ["Guest room", "Seating"],
    avoid: ["Conflict-prone uses"]
  },

  "Prithvidhara": {
    devtaName: "Prithvidhara",
    description: "Bearer of earth and load.",
    optimal: ["Heavy storage", "Foundation zones"],
    avoid: ["Water bodies"]
  },

  "Apah": {
    devtaName: "Apah",
    description: "Water continuity and flow zone.",
    optimal: ["Pipelines", "Water channels"],
    avoid: ["Electrical panels"]
  },

  "Aaryama": {
    devtaName: "Aaryama",
    description: "Zone of order, respect, and lineage.",
    optimal: ["Ancestral photos", "Pooja"],
    avoid: ["Disorder"]
  },

  "Savitar": {
    devtaName: "Savitar",
    description: "Zone of activation and movement.",
    optimal: ["Entry circulation"],
    avoid: ["Sleeping"]
  },

  "Vivasvat": {
    devtaName: "Vivasvat",
    description: "Zone of heat and intensity.",
    optimal: ["Sunlight access"],
    avoid: ["Water storage"]
  },

  "Jaya": {
    devtaName: "Jaya",
    description: "Zone of success and achievement.",
    optimal: ["Work desk", "Awards display"],
    avoid: ["Neglect"]
  },

  "Rudra": {
    devtaName: "Rudra",
    description: "Zone of transformation and release.",
    optimal: ["Bathroom", "Drainage"],
    avoid: ["Bedroom", "Safe"]
  },

  "Rajayakshma": {
    devtaName: "Rajayakshma",
    description: "Highly sensitive health-related zone.",
    optimal: ["Open space"],
    avoid: ["Bedrooms", "Long stay"]
  },

  "Asura": {
    devtaName: "Asura",
    description: "Zone of imbalance if overloaded.",
    optimal: ["Minimal use"],
    avoid: ["Pooja", "Sleeping"]
  },

  "Shosha": {
    devtaName: "Shosha",
    description: "Zone of depletion and dryness.",
    optimal: ["Ventilation"],
    avoid: ["Water storage"]
  },

  "Papayakshma": {
    devtaName: "Papayakshma",
    description: "Disease-prone sensitive zone.",
    optimal: ["Light circulation"],
    avoid: ["Bedrooms"]
  },

  "Roga": {
    devtaName: "Roga",
    description: "Health disturbance zone.",
    optimal: ["Open space"],
    avoid: ["Sleeping", "Cooking"]
  },

  "Naga": {
    devtaName: "Naga",
    description: "Subterranean energy flow zone.",
    optimal: ["Foundation balance"],
    avoid: ["Fire pits"]
  }
};
