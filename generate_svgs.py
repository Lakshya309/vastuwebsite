import os

all_objects = [
    "TOILET", "DINING ROOM", "SEPTIC TANK", "FAMILY LOUNGE", "STUDY TABLE",
    "STORE ROOM", "SERVENT ROOM", "GUEST ROOM", "BAR", "STAIRCASE", "POOJA",
    "KITCHEN", "MUSIC SYSTEM", "PARKING", "OVERHEAD TANK", "UNDERGROUND TANK",
    "MAIN GATE", "SWIMMING POOL", "WELL", "TV", "TUBES", "DUSTBIN", "SAFE",
    "HEATER", "WASHING MACHINE", "AC", "INVERTER", "POTS", "SICK PERSON BED",
    "AQUARIUM", "IRON ALMIRA", "GYM", "MEDITATION", "PETS", "SWING", "PLANTS",
    "SHOERACK", "MATERIAL", "FINISH"
]

existing_icons = {
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
}

missing = [obj for obj in all_objects if obj.title() not in existing_icons and obj.title() != "Pooja" and obj.title() != "Staircase" and obj.title() != "Toilet" and obj.title() != "Overhead Tank" and obj.title() != "Underground Tank" and obj.title() != "Dining Room" and obj.title() != "Kitchen" ]
# Be more precise
mapped_keys = [k.upper() for k in existing_icons.keys()]
# Some mappings are manual: Toilet, Dining Room, Staircase, Pooja, Kitchen, Overhead Tank, Underground Tank. Wait, in original TSX:

def get_type_label(obj_str):
    return " ".join([w.capitalize() for w in obj_str.split()])

missing = [obj for obj in all_objects if get_type_label(obj) not in existing_icons]

colors = ["#f87171", "#fb923c", "#fbbf24", "#a3e635", "#4ade80", "#34d399", "#2dd4bf", "#38bdf8", "#60a5fa", "#818cf8", "#a78bfa", "#c084fc", "#e879f9", "#f472b6", "#fb7185"]

svg_template = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="20" fill="{color}" />
  <text x="50" y="55" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">{abbr}</text>
</svg>"""

out_dir = r"c:/Users/lakshya/Desktop/projects/vastuwebsite/vastuwebsite/public/objects"
os.makedirs(out_dir, exist_ok=True)

new_mappings = []

for i, obj in enumerate(missing):
    type_label = get_type_label(obj)
    abbr = "".join([w[0] for w in obj.split()][:2]).upper()
    color = colors[i % len(colors)]
    filename = obj.lower().replace(" ", "") + ".svg"
    filepath = os.path.join(out_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(svg_template.format(color=color, abbr=abbr))
    new_mappings.append(f'      "{type_label}": "/objects/{filename}",')

print("Generated files:")
print("\n".join(new_mappings))
