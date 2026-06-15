// lib/objectIcons.ts

const makeSvg = (innerContent: string, viewBox: string = "0 0 24 24"): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${innerContent}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const OBJECT_ICONS: Record<string, string> = {
    // Existing residential objects
    "Stove": "/objects/stove.svg",
    "Toilet": "/objects/toilet.svg",
    "Bed": "/objects/bed.svg",
    "Wardrobe": "/objects/wardrobe.svg",
    "Sofa": "/objects/sofa.svg",
    "Pooja": "/objects/pooja.png",
    "Staircase": "/objects/stairs.svg",
    "Dining Room": "/objects/dining.svg",
    "Overhead Tank": "/objects/overheadtank.png",
    "Underground Tank": "/objects/undergroundtank.png",
    "Kitchen": "/objects/stove.svg",
    "Septic Tank": "/objects/septictank.svg",
    "Family Lounge": "/objects/familylounge.svg",
    "Study Table": "/objects/studytable.svg",
    "Store Room": "/objects/storeroom.svg",
    "Servent Room": "/objects/serventroom.svg",
    "Guest Room": "/objects/guestroom.svg",
    "Bar": "/objects/bar.svg",
    "Music System": "/objects/musicsystem.svg",
    "Parking": "/objects/parking.svg",
    "Main Gate": "/objects/maingate.svg",
    "Swimming Pool": "/objects/swimmingpool.svg",
    "Well": "/objects/well.svg",
    "Tv": "/objects/tv.svg",
    "Tubes": "/objects/tubes.svg",
    "Dustbin": "/objects/dustbin.svg",
    "Safe": "/objects/safe.svg",
    "Heater": "/objects/heater.svg",
    "Washing Machine": "/objects/washingmachine.svg",
    "Ac": "/objects/ac.svg",
    "Inverter": "/objects/inverter.svg",
    "Pots": "/objects/pots.svg",
    "Sick Person Bed": "/objects/sickpersonbed.svg",
    "Aquarium": "/objects/aquarium.svg",
    "Iron Almira": "/objects/ironalmira.svg",
    "Gym": "/objects/gym.svg",
    "Meditation": "/objects/meditation.svg",
    "Pets": "/objects/pets.svg",
    "Swing": "/objects/swing.svg",
    "Plants": "/objects/plants.svg",
    "Shoerack": "/objects/shoerack.svg",
    "Material": "/objects/material.svg",
    "Finish": "/objects/finish.svg",
    "Master Bedroom": "/objects/bed.svg",
    "Children Bedroom": "/objects/bed.svg",
    "Lift": "/objects/lift.svg",
    "Cupbaord": "/objects/wardrobe.svg",
    "Dressing Table": "/objects/dressingtable.svg",
    "Footwear Rank": "/objects/shoerack.svg",
    "Fridge": "/objects/fridge.svg",
    "Locker": "/objects/safe.svg",
    "Generator": "/objects/generator.svg",
    "Borewell": "/objects/well.svg",
    "Waste Material": "/objects/dustbin.svg",
    "Water Element": "/objects/waterelement.svg",
    "Air Element": "/objects/airelement.svg",
    "Fire Element": "/objects/fireelement.svg",
    "Earth Element": "/objects/earthelement.svg",
    "Sky Element": "/objects/skyelement.svg",
    "Boss Sitting": "/objects/bosssitting.svg",
    "Staff Sitting": "/objects/staffsitting.svg",
    "Computer": "/objects/computer.svg",
    "Important Paper": "/objects/documents.svg",
    "Sofa Set": "/objects/sofa.svg",
    "Microwave": "/objects/microwave.svg",
    "Water Tap": "/objects/watertap.svg",
    "Mirror": "/objects/mirror.svg",
    "Raw Material": "/objects/material.svg",
    "Finish Goods": "/objects/finish.svg",
    "Lift For Goods": "/objects/lift.svg",
    "Main Entry": "/objects/maingate.svg",
    "Inveter": "/objects/inverter.svg",
    "Water Heater": "/objects/heater.svg",
    "Air Conditioner": "/objects/ac.svg",

    // New Commercial Kitchen specific objects
    "Dosa Bhatti": makeSvg(`<rect x="4" y="5" width="16" height="12" rx="2"/><circle cx="9" cy="11" r="2"/><circle cx="15" cy="11" r="2"/><path d="M6 19h12"/>`),
    "Idli Steamer": makeSvg(`<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M12 3v3"/><circle cx="12" cy="12" r="3"/>`),
    "Wet Grinder": makeSvg(`<circle cx="10" cy="12" r="5"/><circle cx="10" cy="12" r="2"/><rect x="16" y="8" width="3" height="8"/>`),
    "Tilted Grinder": makeSvg(`<circle cx="10" cy="14" r="5"/><line x1="10" y1="9" x2="15" y2="4"/><circle cx="15" cy="4" r="1.5"/><rect x="15" y="10" width="4" height="8" rx="1"/>`),
    "Hot Bain Marie": makeSvg(`<rect x="3" y="7" width="18" height="10"/><line x1="8" y1="7" x2="8" y2="17"/><line x1="14" y1="7" x2="14" y2="17"/>`),
    "Indian Range": makeSvg(`<rect x="4" y="5" width="16" height="12"/><circle cx="8" cy="10" r="1.5"/><circle cx="12" cy="10" r="1.5"/><circle cx="16" cy="10" r="1.5"/>`),
    "Deep Freezer": makeSvg(`<rect x="4" y="6" width="16" height="12" rx="1"/><line x1="12" y1="6" x2="12" y2="18"/>`),
    "Storage Rack": makeSvg(`<rect x="5" y="4" width="14" height="16"/><line x1="5" y1="9" x2="19" y2="9"/><line x1="5" y1="14" x2="19" y2="14"/>`),
    "Sink Unit": makeSvg(`<rect x="4" y="6" width="16" height="8"/><circle cx="9" cy="10" r="2"/><circle cx="15" cy="10" r="2"/>`),
    "Coffee Station": makeSvg(`<path d="M6 7h10v7H6z"/><path d="M16 9h2a2 2 0 010 4h-2"/><path d="M8 18h6"/>`),
    "Dish Rack": makeSvg(`<rect x="4" y="5" width="16" height="14"/><line x1="8" y1="5" x2="8" y2="19"/><line x1="12" y1="5" x2="12" y2="19"/><line x1="16" y1="5" x2="16" y2="19"/>`),
    "Pulveriser": makeSvg(`<path d="M4 4h16l-3 6H7L4 4z"/><rect x="8" y="10" width="8" height="8" rx="1"/><circle cx="12" cy="14" r="2"/>`),
    "Coconut Scraper": makeSvg(`<path d="M5 12h14"/><circle cx="12" cy="12" r="3"/><path d="M12 9V5"/><path d="M10 5h4"/>`),
    "Stock Pot": makeSvg(`<path d="M4 10h16v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8z"/><path d="M7 6v4"/><path d="M17 6v4"/><path d="M3 10c0-2 2-4 9-4s9 2 9 4"/>`),
    "Work Table": makeSvg(`<rect x="3" y="6" width="18" height="6" rx="1"/><line x1="5" y1="12" x2="5" y2="19"/><line x1="19" y1="12" x2="19" y2="19"/><line x1="9" y1="12" x2="9" y2="19"/><line x1="15" y1="12" x2="15" y2="19"/>`),
    "U/C Chiller": makeSvg(`<rect x="4" y="6" width="16" height="14" rx="1"/><line x1="4" y1="13" x2="20" y2="13"/><circle cx="8" cy="9.5" r="1"/><circle cx="16" cy="16.5" r="1"/>`),
    "Chiller": makeSvg(`<rect x="5" y="3" width="14" height="18" rx="2"/><line x1="5" y1="12" x2="19" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/><circle cx="8" cy="7.5" r="1"/><circle cx="16" cy="16.5" r="1"/>`),
    "Pot Wash": makeSvg(`<rect x="4" y="6" width="16" height="10" rx="1"/><path d="M12 2v4"/><circle cx="12" cy="11" r="2"/><path d="M9 16c1 2 5 2 6 0"/>`),
    "Pickup Counter": makeSvg(`<path d="M3 18h18"/><path d="M5 18V9a2 2 0 012-2h10a2 2 0 012 2v9"/><path d="M12 7V4"/><circle cx="12" cy="4" r="1"/>`),
    "Serving Counter": makeSvg(`<path d="M3 18h18"/><path d="M4 18V8h16v10"/><path d="M8 5h8"/>`),
    "Masala Trolley": makeSvg(`<rect x="5" y="5" width="14" height="11" rx="1"/><line x1="5" y1="10" x2="19" y2="10"/><circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/><line x1="19" y1="5" x2="21" y2="7"/>`),
    "Batter Table": makeSvg(`<rect x="3" y="6" width="18" height="6" rx="1"/><path d="M9 12c0 2 1.5 3.5 3 3.5s3-1.5 3-3.5"/><line x1="5" y1="12" x2="5" y2="19"/><line x1="19" y1="12" x2="19" y2="19"/>`),
    "Pot Rack": makeSvg(`<rect x="5" y="4" width="14" height="16"/><line x1="5" y1="9" x2="19" y2="9"/><line x1="5" y1="14" x2="19" y2="14"/><circle cx="9" cy="6.5" r="1.5"/><circle cx="15" cy="11.5" r="1.5"/>`),

    // Factory & Industrial
    "Heavy Machinery": makeSvg(`<path d="M3 21h18V10l-4-4-4 4-4-4-6 4z"/><circle cx="12" cy="14" r="3"/><path d="M12 11v6"/><path d="M9.5 14h5"/>`),
    "Small Machinery": makeSvg(`<rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M12 9v6"/><path d="M9 12h6"/>`),
    "Production Line": makeSvg(`<path d="M3 15h18a2 2 0 012 2v0a2 2 0 01-2 2H3a2 2 0 01-2-2v0a2 2 0 012-2z"/><rect x="6" y="8" width="4" height="4" rx="0.5"/><rect x="14" y="8" width="4" height="4" rx="0.5"/><circle cx="5" cy="17" r="1"/><circle cx="12" cy="17" r="1"/><circle cx="19" cy="17" r="1"/>`),
    "Transformer": makeSvg(`<path d="M5 21l7-18 7 18"/><path d="M2 17h20"/><path d="M4 11h16"/><circle cx="12" cy="11" r="2"/>`),
    "Air Compressor": makeSvg(`<circle cx="12" cy="14" r="6"/><rect x="9" y="4" width="6" height="4" rx="1"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="12" x2="15" y2="10"/>`),
    "Boiler": makeSvg(`<rect x="6" y="6" width="12" height="14" rx="6"/><path d="M12 2v4"/><path d="M9 10h6"/><path d="M9 14h6"/>`),
    "Furnace": makeSvg(`<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 11c0-2.5 2-4.5 4-4.5s4 2 4 4.5-4 5.5-4 5.5S8 13.5 8 11z"/><path d="M10 12c0-1.5 1-2.5 2-2.5s2 1 2 2.5"/>`),
    "Raw Material Storage": makeSvg(`<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/><line x1="6" y1="7.5" x2="9" y2="7.5"/><line x1="15" y1="7.5" x2="18" y2="7.5"/>`),
    "Finished Goods Storage": makeSvg(`<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>`),
    "Warehouse Rack": makeSvg(`<rect x="4" y="3" width="16" height="18"/><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/>`),
    "Loading Dock": makeSvg(`<rect x="3" y="4" width="14" height="10" rx="1"/><circle cx="6" cy="17" r="2"/><circle cx="14" cy="17" r="2"/><path d="M17 9h4l2 3v2h-6"/>`),
    "Dispatch Area": makeSvg(`<rect x="4" y="6" width="10" height="10" rx="1"/><path d="M14 10h8m0 0l-3-3m3 3l-3 3"/>`),
    "Receiving Area": makeSvg(`<rect x="10" y="6" width="10" height="10" rx="1"/><path d="M10 11H2m0 0l3-3m-3 3l3 3"/>`),

    // Retail & Shop
    "Cash Counter": makeSvg(`<rect x="4" y="12" width="16" height="8" rx="1"/><rect x="6" y="4" width="12" height="8" rx="1"/><circle cx="14" cy="16" r="1.5"/><line x1="6" y1="8" x2="18" y2="8"/>`),
    "Billing Desk": makeSvg(`<path d="M6 3h12a2 2 0 012 2v16H4V5a2 2 0 012-2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="12" y2="15"/>`),
    "Display Shelf": makeSvg(`<rect x="4" y="3" width="16" height="18" rx="1"/><line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="13" x2="20" y2="13"/><line x1="4" y1="17" x2="20" y2="17"/>`),
    "Product Display": makeSvg(`<path d="M6 20h12v-8H6z"/><path d="M12 2v10"/><path d="M10 4h4"/>`),
    "Trial Room": makeSvg(`<path d="M4 4h16v16H4z"/><path d="M4 8c4 0 4 4 8 4s4-4 8-4"/><circle cx="12" cy="16" r="1.5"/>`),

    // Office
    "Reception": makeSvg(`<circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M3 21h18"/>`),
    "Manager Cabin": makeSvg(`<rect x="4" y="14" width="16" height="6" rx="1"/><circle cx="12" cy="7" r="3"/><path d="M8 14v-2a4 4 0 018 0v2"/>`),
    "Meeting Room": makeSvg(`<ellipse cx="12" cy="12" rx="7" ry="4"/><circle cx="12" cy="6" r="1.5"/><circle cx="7" cy="12" r="1.5"/><circle cx="17" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/>`),
    "Workstations": makeSvg(`<rect x="3" y="13" width="7" height="7" rx="1"/><rect x="14" y="13" width="7" height="7" rx="1"/><circle cx="6.5" cy="7" r="2"/><circle cx="17.5" cy="7" r="2"/><path d="M4 10a2 2 0 014 0v3M15 10a2 2 0 014 0v3"/>`),
    "Server Room": makeSvg(`<rect x="5" y="3" width="14" height="18" rx="1"/><line x1="5" y1="9" x2="19" y2="9"/><line x1="5" y1="15" x2="19" y2="15"/><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/>`),
    "HR Cabin": makeSvg(`<circle cx="9" cy="7" r="3"/><path d="M5 15v-1a3 3 0 013-3h2a3 3 0 013 3v1"/><rect x="14" y="8" width="6" height="8" rx="1"/>`),

    // Food Business
    "Cold Storage": makeSvg(`<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 8v8M8 12h8M9 9l6 6M15 9l-6 6"/>`),
    "Prep Area": makeSvg(`<rect x="4" y="6" width="16" height="12" rx="1"/><path d="M7 14V8h2l4 4h4v2"/>`),
    "Wash Area": makeSvg(`<rect x="4" y="6" width="16" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4"/>`),
    "Cooking Area": makeSvg(`<path d="M12 2c2 3 5 4 5 7a5 5 0 01-10 0c0-3 3-4 5-7z"/><path d="M6 20h12"/>`),

    // Healthcare
    "Pharmacy": makeSvg(`<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 7v10M7 12h10"/>`),
    "Consultation Room": makeSvg(`<rect x="3" y="12" width="18" height="8" rx="1"/><circle cx="12" cy="6" r="3"/><path d="M8 12v-2a4 4 0 018 0v2"/>`),
    "Waiting Area": makeSvg(`<rect x="4" y="10" width="6" height="8" rx="1"/><rect x="14" y="10" width="6" height="8" rx="1"/><path d="M2 18h20"/>`),
    "Lab": makeSvg(`<path d="M9 3h6M10 3v5l-4 9a2 2 0 002 3h8a2 2 0 002-3l-4-9V3"/>`),

    // Universal Commercial
    "Security Cabin": makeSvg(`<rect x="6" y="6" width="12" height="14" rx="1"/><path d="M6 11h12"/><line x1="9" y1="6" x2="9" y2="20"/><line x1="15" y1="6" x2="15" y2="20"/>`),
    "Exit": makeSvg(`<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>`),
    "Entrance": makeSvg(`<path d="M5 20V5a2 2 0 012-2h10a2 2 0 012 2v15M3 20h18"/>`),
    "Electrical Panel": makeSvg(`<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M13 7l-4 5h5l-4 5"/>`),
    "Dg Set": makeSvg(`<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="12" r="3"/><path d="M16 9h2v6h-2z"/>`),
};

export const getObjectIcon = (type: string): string => {
    if (!type) return "/objects/generic.svg";

    // Try exact match
    if (OBJECT_ICONS[type]) return OBJECT_ICONS[type];

    // Try title casing for the lookup
    const titleCase = type.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    if (OBJECT_ICONS[titleCase]) return OBJECT_ICONS[titleCase];

    // Fallback to generic
    return "/objects/generic.svg";
};
