// lib/objectIcons.ts

export const OBJECT_ICONS: Record<string, string> = {
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
