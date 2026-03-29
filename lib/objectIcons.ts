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
    
    // New additions from vastu_rules.json
    "Master Bedroom": "/objects/bed.svg",
    "Children Bedroom": "/objects/bed.svg",
    "Lift": "/objects/lift.svg",
    "Cupbaord": "/objects/wardrobe.svg", // matching JSON typo
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
    "Inveter": "/objects/inverter.svg", // matching JSON typo
    "Water Heater": "/objects/heater.svg",
    "Air Conditioner": "/objects/ac.svg",
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
