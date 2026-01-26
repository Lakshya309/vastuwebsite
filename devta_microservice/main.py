# # """
# # Vastu Purusha Mandala – 45 Devtas
# # Hybrid Engine (Client-Safe)

# # Modes:
# # 1. Rectangle (≤4 vertices) → Pure Traditional
# # 2. L / Concave (>4 vertices) →
# #    - Traditional Mandala inside max inner rectangle
# #    - Irregular Devtas ONLY for leftover concave regions
# # """

# # import math
# # import uvicorn
# # from typing import List, Optional

# # from fastapi import FastAPI, HTTPException
# # from fastapi.middleware.cors import CORSMiddleware
# # from pydantic import BaseModel, Field

# # from shapely.geometry import Polygon, Point, MultiPolygon, box
# # from shapely.affinity import scale as shapely_scale
# # from shapely.ops import unary_union

# # # ======================================================
# # # FASTAPI
# # # ======================================================

# # app = FastAPI(title="Vastu Devta Engine", version="3.0")

# # app.add_middleware(
# #     CORSMiddleware,
# #     allow_origins=["*"],
# #     allow_methods=["*"],
# #     allow_headers=["*"],
# # )

# # # ======================================================
# # # MODELS
# # # ======================================================

# # class PointModel(BaseModel):
# #     x: float
# #     y: float

# # class DevtaRegion(BaseModel):
# #     id: str
# #     name: str
# #     polygon: List[PointModel]
# #     ring: str
# #     startAngle: Optional[float] = None
# #     endAngle: Optional[float] = None
# #     source: str  # "traditional" | "irregular"

# # class AnalysisRequest(BaseModel):
# #     boundary_normalized: List[PointModel]
# #     north_direction: float = Field(default=0.0)

# # class DevtaAnalysisResponse(BaseModel):
# #     devtaRegions: List[DevtaRegion]

# # # ======================================================
# # # CONSTANTS
# # # ======================================================

# # CENTER_DEVTA = "Brahma"

# # MIDDLE_DEVTAS = [
# #     "Shikhi","Parjanya","Jayanta","Indra",
# #     "Surya","Satya","Bhrisha","Akash",
# #     "Vayu","Pusha","Vitatha","Gruhakshat"
# # ]

# # OUTER_DEVTAS = [f"Outer-{i+1}" for i in range(32)]

# # # ======================================================
# # # HELPERS
# # # ======================================================

# # def to_polygon(pts: List[PointModel]) -> Polygon:
# #     poly = Polygon([(p.x, p.y) for p in pts])
# #     return poly.buffer(0)

# # def to_points(poly) -> List[PointModel]:
# #     if poly.is_empty:
# #         return []
# #     if isinstance(poly, MultiPolygon):
# #         poly = max(poly.geoms, key=lambda p: p.area)
# #     return [PointModel(x=x, y=y) for x, y in list(poly.exterior.coords)[:-1]]

# # def normalize_angle(a: float) -> float:
# #     return a % 360

# # def visual_center(poly: Polygon) -> Point:
# #     c = poly.centroid
# #     return c if poly.contains(c) else poly.representative_point()

# # # ======================================================
# # # CORE RECTANGLE EXTRACTION (VERY IMPORTANT)
# # # ======================================================

# # def largest_inner_rectangle(poly: Polygon) -> Polygon:
# #     """
# #     Conservative but robust:
# #     Uses plot bounding box clipped inside polygon.
# #     """
# #     minx, miny, maxx, maxy = poly.bounds
# #     candidate = box(minx, miny, maxx, maxy)

# #     core = candidate.intersection(poly)
# #     if core.area < poly.area * 0.4:
# #         # Fallback: scaled polygon
# #         center = visual_center(poly)
# #         return shapely_scale(poly, 0.7, 0.7, origin=center)

# #     return core

# # # ======================================================
# # # ANGULAR FAN (IRREGULAR ENGINE)
# # # ======================================================

# # def angular_fan(boundary: Polygon, center: Point, a1, a2, r=1000):
# #     a1r = math.radians(90 - a1)
# #     a2r = math.radians(90 - a2)

# #     p1 = (center.x + r * math.cos(a1r), center.y + r * math.sin(a1r))
# #     p2 = (center.x + r * math.cos(a2r), center.y + r * math.sin(a2r))

# #     wedge = Polygon([(center.x, center.y), p1, p2])
# #     clipped = wedge.intersection(boundary)

# #     if clipped.is_empty:
# #         return None
# #     if isinstance(clipped, MultiPolygon):
# #         return max(clipped.geoms, key=lambda g: g.area)
# #     return clipped

# # # ======================================================
# # # TRADITIONAL MANDALA
# # # ======================================================

# # def generate_traditional(poly: Polygon, north: float, tag="traditional"):
# #     devtas = []
# #     did = 1
# #     center = visual_center(poly)

# #     inner = shapely_scale(poly, 0.33, 0.33, origin=center)
# #     middle = shapely_scale(poly, 0.66, 0.66, origin=center)

# #     devtas.append(DevtaRegion(
# #         id=f"d-{did}", name=CENTER_DEVTA,
# #         polygon=to_points(inner),
# #         ring="center", source=tag
# #     ))
# #     did += 1

# #     step = 360 / 32
# #     for i in range(32):
# #         w = angular_fan(poly, center, north + i*step, north + (i+1)*step)
# #         if not w: continue
# #         w = w.difference(middle)
# #         if w.is_empty: continue

# #         devtas.append(DevtaRegion(
# #             id=f"d-{did}", name=OUTER_DEVTAS[i],
# #             polygon=to_points(w),
# #             ring="outer",
# #             startAngle=normalize_angle(north+i*step),
# #             endAngle=normalize_angle(north+(i+1)*step),
# #             source=tag
# #         ))
# #         did += 1

# #     return devtas

# # # ======================================================
# # # IRREGULAR RESIDUAL ENGINE
# # # ======================================================

# # def generate_irregular(poly: Polygon, north: float):
# #     devtas = []
# #     center = visual_center(poly)
# #     step = 360 / 32
# #     did = 1000

# #     for i in range(32):
# #         w = angular_fan(poly, center, north+i*step, north+(i+1)*step)
# #         if not w: continue

# #         devtas.append(DevtaRegion(
# #             id=f"r-{did}",
# #             name=f"Residual-{i+1}",
# #             polygon=to_points(w),
# #             ring="residual",
# #             startAngle=normalize_angle(north+i*step),
# #             endAngle=normalize_angle(north+(i+1)*step),
# #             source="irregular"
# #         ))
# #         did += 1

# #     return devtas

# # # ======================================================
# # # MAIN HYBRID PIPELINE
# # # ======================================================

# # def generate_hybrid(req: AnalysisRequest) -> List[DevtaRegion]:
# #     outer = to_polygon(req.boundary_normalized)

# #     if len(req.boundary_normalized) <= 4:
# #         return generate_traditional(outer, req.north_direction)

# #     core = largest_inner_rectangle(outer)
# #     residual = outer.difference(core)

# #     devtas = []
# #     devtas += generate_traditional(core, req.north_direction, tag="traditional-core")

# #     if not residual.is_empty:
# #         if isinstance(residual, MultiPolygon):
# #             for r in residual.geoms:
# #                 devtas += generate_irregular(r, req.north_direction)
# #         else:
# #             devtas += generate_irregular(residual, req.north_direction)

# #     return devtas

# # # ======================================================
# # # API
# # # ======================================================

# # @app.post("/analyze_devtas", response_model=DevtaAnalysisResponse)
# # async def analyze(req: AnalysisRequest):
# #     return DevtaAnalysisResponse(devtaRegions=generate_hybrid(req))

# # @app.get("/health")
# # def health():
# #     return {"status": "ok", "engine": "hybrid-rectangular-core"}

# # # ======================================================
# # # RUN
# # # ======================================================

# # if __name__ == "__main__":
# #     uvicorn.run(app, host="0.0.0.0", port=5000)
# """
# Vastu Purusha Mandala – 45 Devtas
# Hybrid Engine (Production Grade)

# • Rectangle plots → Pure Traditional Mandala
# • Concave plots → Traditional Core + Irregular Residuals
# • Fully Named Devtas (Center + 12 Middle + 32 Outer)
# """

# import math
# import uvicorn
# from typing import List, Optional

# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel, Field

# from shapely.geometry import Polygon, Point, MultiPolygon, box
# from shapely.affinity import scale as shapely_scale

# # ======================================================
# # FASTAPI
# # ======================================================

# app = FastAPI(title="Vastu Devta Engine", version="4.0")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ======================================================
# # MODELS
# # ======================================================

# class PointModel(BaseModel):
#     x: float
#     y: float

# class DevtaRegion(BaseModel):
#     id: str
#     name: str
#     polygon: List[PointModel]
#     ring: str
#     startAngle: Optional[float] = None
#     endAngle: Optional[float] = None
#     source: str

# class AnalysisRequest(BaseModel):
#     boundary_normalized: List[PointModel]
#     north_direction: float = Field(default=0.0)

# class DevtaAnalysisResponse(BaseModel):
#     devtaRegions: List[DevtaRegion]

# # ======================================================
# # DEVTA CONSTANTS
# # ======================================================

# CENTER_DEVTA = "Brahma"

# MIDDLE_DEVTAS = [
#     "Shikhi","Parjanya","Jayanta","Indra",
#     "Surya","Satya","Bhrisha","Akasha",
#     "Vayu","Pusha","Vitatha","Gruhakshat"
# ]

# OUTER_DEVTAS = [
#     "Ishanya","Parjanya","Jayanta","Indra",
#     "Agni","Yama","Gandharva","Bhringraj",
#     "Pitru","Diti","Sugriva","Pushpadanta",
#     "Varuna","Asura","Shosha","Papa",
#     "Roga","Naga","Mukhya","Bhallata",
#     "Soma","Aditi","Dhanada","Kubera",
#     "Bhujanga","Aditi2","Shankhini","Pitra",
#     "Rudra","Shambhu","Aditi3","Brahma2"
# ]

# # ======================================================
# # HELPERS
# # ======================================================

# def to_polygon(pts: List[PointModel]) -> Polygon:
#     return Polygon([(p.x, p.y) for p in pts]).buffer(0)

# def to_points(poly) -> List[PointModel]:
#     if poly.is_empty:
#         return []
#     if isinstance(poly, MultiPolygon):
#         poly = max(poly.geoms, key=lambda g: g.area)
#     return [PointModel(x=x, y=y) for x, y in list(poly.exterior.coords)[:-1]]

# def normalize_angle(a: float) -> float:
#     return a % 360

# def visual_center(poly: Polygon) -> Point:
#     c = poly.centroid
#     return c if poly.contains(c) else poly.representative_point()

# # ======================================================
# # GEOMETRY
# # ======================================================

# def angular_fan(boundary: Polygon, center: Point, a1, a2, r=1000):
#     a1r = math.radians(90 - a1)
#     a2r = math.radians(90 - a2)

#     p1 = (center.x + r * math.cos(a1r), center.y + r * math.sin(a1r))
#     p2 = (center.x + r * math.cos(a2r), center.y + r * math.sin(a2r))

#     wedge = Polygon([(center.x, center.y), p1, p2])
#     clipped = wedge.intersection(boundary)

#     if clipped.is_empty:
#         return None
#     if isinstance(clipped, MultiPolygon):
#         return max(clipped.geoms, key=lambda g: g.area)
#     return clipped

# def largest_inner_rectangle(poly: Polygon) -> Polygon:
#     minx, miny, maxx, maxy = poly.bounds
#     core = box(minx, miny, maxx, maxy).intersection(poly)

#     if core.area < poly.area * 0.4:
#         center = visual_center(poly)
#         return shapely_scale(poly, 0.7, 0.7, origin=center)

#     return core

# # ======================================================
# # TRADITIONAL MANDALA (45 DEVTA ENGINE)
# # ======================================================

# def generate_traditional(poly: Polygon, north: float, tag="traditional"):
#     devtas = []
#     center = visual_center(poly)
#     did = 1

#     inner = shapely_scale(poly, 0.33, 0.33, origin=center)
#     middle = shapely_scale(poly, 0.66, 0.66, origin=center)

#     # Center
#     devtas.append(DevtaRegion(
#         id=f"d-{did}", name=CENTER_DEVTA,
#         polygon=to_points(inner),
#         ring="center", source=tag
#     ))
#     did += 1

#     # Middle ring (12)
#     step_mid = 360 / 12
#     for i, name in enumerate(MIDDLE_DEVTAS):
#         w = angular_fan(poly, center,
#                         north + i * step_mid,
#                         north + (i + 1) * step_mid)
#         if not w:
#             continue
#         w = w.intersection(middle).difference(inner)
#         if w.is_empty:
#             continue

#         devtas.append(DevtaRegion(
#             id=f"d-{did}", name=name,
#             polygon=to_points(w),
#             ring="middle",
#             startAngle=normalize_angle(north + i * step_mid),
#             endAngle=normalize_angle(north + (i + 1) * step_mid),
#             source=tag
#         ))
#         did += 1

#     # Outer ring (32)
#     step_out = 360 / 32
#     for i, name in enumerate(OUTER_DEVTAS):
#         w = angular_fan(poly, center,
#                         north + i * step_out,
#                         north + (i + 1) * step_out)
#         if not w:
#             continue
#         w = w.difference(middle)
#         if w.is_empty:
#             continue

#         devtas.append(DevtaRegion(
#             id=f"d-{did}", name=name,
#             polygon=to_points(w),
#             ring="outer",
#             startAngle=normalize_angle(north + i * step_out),
#             endAngle=normalize_angle(north + (i + 1) * step_out),
#             source=tag
#         ))
#         did += 1

#     return devtas

# # ======================================================
# # IRREGULAR RESIDUAL DEVTA ENGINE
# # ======================================================

# def generate_irregular(poly: Polygon, north: float):
#     devtas = []
#     center = visual_center(poly)
#     step = 360 / 32
#     did = 2000

#     for i, name in enumerate(OUTER_DEVTAS):
#         w = angular_fan(poly, center,
#                         north + i * step,
#                         north + (i + 1) * step)
#         if not w:
#             continue

#         devtas.append(DevtaRegion(
#             id=f"r-{did}",
#             name=name,
#             polygon=to_points(w),
#             ring="residual",
#             startAngle=normalize_angle(north + i * step),
#             endAngle=normalize_angle(north + (i + 1) * step),
#             source="irregular"
#         ))
#         did += 1

#     return devtas

# # ======================================================
# # MAIN PIPELINE
# # ======================================================

# def generate_hybrid(req: AnalysisRequest) -> List[DevtaRegion]:
#     outer = to_polygon(req.boundary_normalized)

#     if len(req.boundary_normalized) <= 4:
#         return generate_traditional(outer, req.north_direction)

#     core = largest_inner_rectangle(outer)
#     residual = outer.difference(core)

#     devtas = generate_traditional(core, req.north_direction, "traditional-core")

#     if not residual.is_empty:
#         if isinstance(residual, MultiPolygon):
#             for r in residual.geoms:
#                 devtas += generate_irregular(r, req.north_direction)
#         else:
#             devtas += generate_irregular(residual, req.north_direction)

#     return devtas

# # ======================================================
# # API
# # ======================================================

# @app.post("/analyze_devtas", response_model=DevtaAnalysisResponse)
# async def analyze(req: AnalysisRequest):
#     return DevtaAnalysisResponse(devtaRegions=generate_hybrid(req))

# @app.get("/health")
# def health():
#     return {"status": "ok", "engine": "hybrid-vastu-45"}

# # ======================================================
# # RUN
# # ======================================================

# if __name__ == "__main__":
#     uvicorn.run(app, host="0.0.0.0", port=5000)
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
    "Ishanya","Parjanya","Jayanta","Indra",
    "Agni","Yama","Gandharva","Bhringraj",
    "Pitru","Diti","Sugriva","Pushpadanta",
    "Varuna","Asura","Shosha","Papa",
    "Roga","Naga","Mukhya","Bhallata",
    "Soma","Aditi","Dhanada","Kubera",
    "Bhujanga","Shankhini","Pitra","Rudra",
    "Shambhu","Aditi2","Aditi3","Brahma2"
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
