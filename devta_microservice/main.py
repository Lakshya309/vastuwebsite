"""
Vastu Spatial Engine – Production Grade

Includes:
• 45 Devta Mandala (Traditional + Hybrid)
• 16 Direction Zones
• 8 Direction Zones

Rules:
• 45 Devtas NEVER break
• Zones are angular overlays only
"""

import math
import uvicorn
from typing import List, Optional, Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from shapely.geometry import Polygon, Point, MultiPolygon, box
from shapely.affinity import scale as shapely_scale

# ======================================================
# FASTAPI
# ======================================================

app = FastAPI(title="Vastu Spatial Engine", version="5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================================================
# MODELS
# ======================================================

class PointModel(BaseModel):
    x: float
    y: float

class Region(BaseModel):
    id: str
    name: str
    polygon: List[PointModel]
    ring: str
    startAngle: Optional[float] = None
    endAngle: Optional[float] = None
    source: str

class AnalysisRequest(BaseModel):
    boundary_normalized: List[PointModel]
    north_direction: float = Field(default=0.0)

class AnalysisResponse(BaseModel):
    devtas45: List[Region]
    zones16: List[Region]
    zones8: List[Region]

# ======================================================
# CONSTANTS
# ======================================================

CENTER_DEVTA = "Brahma"

MIDDLE_DEVTAS = [
    "Shikhi","Parjanya","Jayanta","Indra",
    "Surya","Satya","Bhrisha","Akasha",
    "Vayu","Pusha","Vitatha","Gruhakshat"
]

OUTER_DEVTAS = [
    # North-East (Ishanya quadrant)
    "Ishanya", "Parjanya", "Jayanta", "Indra",

    # East (Agneya quadrant)
    "Agni", "Yama", "Gandharva", "Bhringaraja",

    # South-East (Nairutya quadrant)
    "Pitru", "Diti", "Sugriva", "Pushpadanta",

    # South (Dakshina quadrant)
    "Varuna", "Asura", "Shosha", "Papa",

    # South-West (Nairutya continuation)
    "Roga", "Naga", "Mukhya", "Bhallata",

    # West (Paschima quadrant)
    "Soma", "Aditi", "Dhanada", "Kubera",

    # North-West (Vayavya quadrant)
    "Bhujanga", "Shankhini", "Pitra", "Rudra",

    # North (Uttara quadrant)  ← THIS WAS MISSING
    "Vayu", "Aryama", "Mitra", "Savita"
]


ZONE_NAMES_16 = [
    "NNE","NE","ENE","E","ESE","SE","SSE","S",
    "SSW","SW","WSW","W","WNW","NW","NNW","N"
]

ZONE_NAMES_8 = ["NE","E","SE","S","SW","W","NW","N"]

# ======================================================
# HELPERS
# ======================================================

def to_polygon(pts: List[PointModel]) -> Polygon:
    return Polygon([(p.x, p.y) for p in pts]).buffer(0)

def to_points(poly) -> List[PointModel]:
    if poly.is_empty:
        return []
    if isinstance(poly, MultiPolygon):
        poly = max(poly.geoms, key=lambda g: g.area)
    return [PointModel(x=x, y=y) for x, y in list(poly.exterior.coords)[:-1]]

def normalize_angle(a: float) -> float:
    return a % 360

def visual_center(poly: Polygon) -> Point:
    c = poly.centroid
    return c if poly.contains(c) else poly.representative_point()

# ======================================================
# GEOMETRY CORE
# ======================================================

def angular_wedge(boundary: Polygon, center: Point, a1, a2, r=2000):
    a1r = math.radians(90 - a1)
    a2r = math.radians(90 - a2)

    p1 = (center.x + r * math.cos(a1r), center.y + r * math.sin(a1r))
    p2 = (center.x + r * math.cos(a2r), center.y + r * math.sin(a2r))

    wedge = Polygon([(center.x, center.y), p1, p2])
    clipped = wedge.intersection(boundary)

    if clipped.is_empty:
        return None
    if isinstance(clipped, MultiPolygon):
        return max(clipped.geoms, key=lambda g: g.area)
    return clipped

def largest_inner_rectangle(poly: Polygon) -> Polygon:
    minx, miny, maxx, maxy = poly.bounds
    core = box(minx, miny, maxx, maxy).intersection(poly)

    if core.area < poly.area * 0.4:
        return shapely_scale(poly, 0.7, 0.7, origin=visual_center(poly))
    return core

# ======================================================
# 45 DEVTA ENGINE (UNTOUCHED LOGIC)
# ======================================================

def generate_45_devtas(poly: Polygon, north: float, tag="traditional"):
    devtas = []
    center = visual_center(poly)
    did = 1

    inner = shapely_scale(poly, 0.33, 0.33, origin=center)
    middle = shapely_scale(poly, 0.66, 0.66, origin=center)

    devtas.append(Region(
        id=f"d-{did}", name=CENTER_DEVTA,
        polygon=to_points(inner),
        ring="center", source=tag
    ))
    did += 1

    step_mid = 360 / 12
    for i, name in enumerate(MIDDLE_DEVTAS):
        w = angular_wedge(poly, center,
                          north+i*step_mid,
                          north+(i+1)*step_mid)
        if w:
            w = w.intersection(middle).difference(inner)
            if not w.is_empty:
                devtas.append(Region(
                    id=f"d-{did}", name=name,
                    polygon=to_points(w),
                    ring="middle",
                    startAngle=normalize_angle(north+i*step_mid),
                    endAngle=normalize_angle(north+(i+1)*step_mid),
                    source=tag
                ))
                did += 1

    step_out = 360 / 32
    for i, name in enumerate(OUTER_DEVTAS):
        w = angular_wedge(poly, center,
                          north+i*step_out,
                          north+(i+1)*step_out)
        if w:
            w = w.difference(middle)
            if not w.is_empty:
                devtas.append(Region(
                    id=f"d-{did}", name=name,
                    polygon=to_points(w),
                    ring="outer",
                    startAngle=normalize_angle(north+i*step_out),
                    endAngle=normalize_angle(north+(i+1)*step_out),
                    source=tag
                ))
                did += 1

    return devtas

# ======================================================
# 8 / 16 ZONE ENGINE (SAFE OVERLAY)
# ======================================================

def generate_zones(poly: Polygon, north: float, names: List[str], label: str):
    zones = []
    center = visual_center(poly)
    step = 360 / len(names)

    for i, name in enumerate(names):
        w = angular_wedge(poly, center,
                          north+i*step,
                          north+(i+1)*step)
        if w:
            zones.append(Region(
                id=f"{label}-{i+1}",
                name=name,
                polygon=to_points(w),
                ring=label,
                startAngle=normalize_angle(north+i*step),
                endAngle=normalize_angle(north+(i+1)*step),
                source="directional"
            ))
    return zones

# ======================================================
# MAIN PIPELINE
# ======================================================

def analyze_plot(req: AnalysisRequest) -> AnalysisResponse:
    outer = to_polygon(req.boundary_normalized)

    if len(req.boundary_normalized) <= 4:
        devtas = generate_45_devtas(outer, req.north_direction)
    else:
        core = largest_inner_rectangle(outer)
        devtas = generate_45_devtas(core, req.north_direction, "traditional-core")

    return AnalysisResponse(
        devtas45=devtas,
        zones16=generate_zones(outer, req.north_direction, ZONE_NAMES_16, "zone16"),
        zones8=generate_zones(outer, req.north_direction, ZONE_NAMES_8, "zone8"),
    )

# ======================================================
# API
# ======================================================

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(req: AnalysisRequest):
    return analyze_plot(req)

@app.get("/health")
def health():
    return {"status": "ok", "engine": "vastu-spatial-v5"}

# ======================================================
# RUN
# ======================================================

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
