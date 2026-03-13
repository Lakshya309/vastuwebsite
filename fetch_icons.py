import os
import requests
import json
import time

objects_query_map = {
    "Septic Tank": "septic",
    "Family Lounge": "sofa",
    "Study Table": "desk",
    "Store Room": "box",
    "Servent Room": "broom",
    "Guest Room": "bed",
    "Bar": "cocktail",
    "Music System": "speaker",
    "Parking": "parking",
    "Main Gate": "gate",
    "Swimming Pool": "pool",
    "Well": "water well",
    "Tv": "television",
    "Tubes": "tube light",
    "Dustbin": "trash can",
    "Safe": "safe vault",
    "Heater": "heater",
    "Washing Machine": "washing machine",
    "Ac": "air conditioner",
    "Inverter": "battery",
    "Pots": "flower pot",
    "Sick Person Bed": "hospital bed",
    "Aquarium": "aquarium",
    "Iron Almira": "wardrobe",
    "Gym": "dumbbell",
    "Meditation": "meditation",
    "Pets": "dog",
    "Swing": "swing",
    "Plants": "plant",
    "Shoerack": "shoe",
    "Material": "brick",
    "Finish": "paint brush"
}

out_dir = r"c:/Users/lakshya/Desktop/projects/vastuwebsite/vastuwebsite/public/objects"
os.makedirs(out_dir, exist_ok=True)

for obj_name, query in objects_query_map.items():
    filename = obj_name.lower().replace(" ", "") + ".svg"
    filepath = os.path.join(out_dir, filename)
    
    url = f"https://api.iconify.design/search?query={query}&limit=3"
    print(f"Searching for {obj_name} ({query})...")
    try:
        res = requests.get(url)
        data = res.json()
        icons = data.get("icons", [])
        if not icons:
            # try first word if 2 words
            url2 = f"https://api.iconify.design/search?query={query.split()[0]}&limit=3"
            res2 = requests.get(url2)
            data2 = res2.json()
            icons = data2.get("icons", [])
        
        if icons:
            # prefer mdi or lucide if possible, otherwise just take the first
            icon_id = icons[0]
            for ic in icons:
                if ic.startswith('mdi:') or ic.startswith('lucide:'):
                    icon_id = ic
                    break
                    
            prefix, name = icon_id.split(":")
            svg_url = f"https://api.iconify.design/{prefix}/{name}.svg"
            print(f"  Found {icon_id}, downloading...")
            svg_res = requests.get(svg_url)
            svg_content = svg_res.text
            
            # Make sure it's black and visible
            svg_content = svg_content.replace('currentColor', '#000000')
            if 'fill="' not in svg_content and 'stroke="' not in svg_content:
                svg_content = svg_content.replace('<svg ', '<svg fill="#000000" ')
                
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(svg_content)
        else:
            print(f"  No icon found for {query}")
    except Exception as e:
        print(f"Error fetching {obj_name}: {e}")
        
    time.sleep(0.3)

print("Done downloading icons!")
