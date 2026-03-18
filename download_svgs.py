import urllib.request
import os

icons = {
    "dressingtable.svg": "sparkles.svg",
    "fridge.svg": "refrigerator.svg",
    "generator.svg": "battery-charging.svg",
    "waterelement.svg": "droplet.svg",
    "airelement.svg": "wind.svg",
    "fireelement.svg": "flame.svg",
    "earthelement.svg": "mountain.svg",
    "skyelement.svg": "cloud.svg",
    "bosssitting.svg": "briefcase.svg",
    "staffsitting.svg": "users.svg",
    "computer.svg": "monitor.svg",
    "documents.svg": "file-text.svg",
    "microwave.svg": "microwave.svg",
    "watertap.svg": "droplets.svg",
    "mirror.svg": "square.svg",
    "lift.svg": "arrow-up-down.svg",
}

base_url = "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/"
output_dir = r"d:\vastuwebsite\vastuwebsite\public\objects"

for out_name, in_name in icons.items():
    try:
        url = base_url + in_name
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            svg_data = response.read().decode('utf-8')
            
            # Make sure it renders on canvas correctly by fixing currentColor
            svg_data = svg_data.replace('stroke="currentColor"', 'stroke="#000000"')
            svg_data = svg_data.replace('stroke-width="2"', 'stroke-width="1.5"')
            
            out_path = os.path.join(output_dir, out_name)
            with open(out_path, "w", encoding='utf-8') as f:
                f.write(svg_data)
            print(f"Downloaded {in_name} -> {out_name}")
    except Exception as e:
        print(f"Failed to download {in_name}: {e}")
