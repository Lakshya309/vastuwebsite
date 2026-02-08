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
from typing import List, Optional, Literal, Tuple # Added Tuple for type hints

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from shapely.geometry import Polygon, Point, MultiPolygon, box
from shapely.affinity import scale as shapely_scale

from vastu_rules import get_vastu_score_impact, get_vastu_verdict, Direction, VASTU_RULES # Import rules

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

class PlacedObject(BaseModel):
    id: str
    object_type: str
    boundary_normalized: List[PointModel] # Added back for area-based analysis
    centroid: PointModel
    rotation: Optional[float] = None

class AnalyzedObjectResult(BaseModel):
    object_id: str
    object_type: str
    devta_region: Optional[str] = None
    zone16_direction: Optional[Direction] = None
    score_impact: int
    verdict: Literal["EXCELLENT", "GOOD", "BAD", "CRITICAL"]
    message: str # A message explaining the verdict/impact

class VastuAnalysisResult(BaseModel):
    analyzed_objects: List[AnalyzedObjectResult]
    total_score: int
    overall_percentage: float
    overall_verdict: Literal["EXCELLENT", "GOOD", "BAD", "CRITICAL"]

class AnalysisRequest(BaseModel):
    boundary_normalized: List[PointModel]
    north_direction: float = Field(default=0.0)

class ObjectAnalysisRequest(AnalysisRequest):
    placed_objects: List[PlacedObject]

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

    # North (Uttara quadrant)
    "Vayu", "Aryama", "Mitra", "Savita"
]


ZONE_NAMES_16: List[Direction] = [
    "NNE","NE","ENE","E","ESE","SE","SSE","S",
    "SSW","SW","WSW","W","WNW","NW","NNW","N"
]

ZONE_NAMES_8 = ["NE","E","SE","S","SW","W","NW","N"]

# ======================================================
# HELPERS
# ======================================================

def to_polygon(pts: List[PointModel]) -> Polygon:
    if not pts:
        return Polygon() # Return an empty polygon if no points
    return Polygon([(p.x, p.y) for p in pts]).buffer(0)

def to_points(poly) -> List[PointModel]:
    if poly.is_empty:
        return []
    if isinstance(poly, MultiPolygon):
        poly = max(poly.geoms, key=lambda g: g.area) # Take the largest polygon from MultiPolygon
    if poly.exterior: # Check if exterior exists before accessing coords
        return [PointModel(x=x, y=y) for x, y in list(poly.exterior.coords)[:-1]]
    return []

def normalize_angle(a: float) -> float:
    return a % 360

def visual_center(poly: Polygon) -> Point:
    c = poly.centroid
    return c if poly.contains(c) else poly.representative_point()

def get_angle_from_point(center: Point, p: PointModel) -> float:
    """Calculates the angle in degrees (0-360, North=0/360) for a point relative to a center."""
    # Standard Cartesian (positive x to the right, positive y up)
    # North is +Y, East is +X, South is -Y, West is -X
    # For Vastu, North is 0 degrees, and angles increase clockwise.
    # So, atan2(y, x) would give: +X=0, +Y=90, -X=180, -Y=270 (counter-clockwise)
    # We want: +Y=0, +X=90, -Y=180, -X=270 (clockwise)
    
    # Calculate angle relative to positive X-axis (standard math)
    dx = p.x - center.x
    dy = p.y - center.y
    angle_rad = math.atan2(dy, dx) # -pi to pi radians
    
    # Convert to degrees and normalize to 0-360
    angle_deg_from_pos_x = math.degrees(angle_rad)
    if angle_deg_from_pos_x < 0:
        angle_deg_from_pos_x += 360
        
    # Convert from (0=East, counter-clockwise) to (0=North, clockwise)
    # North (0) is +Y. East (90) is +X. South (180) is -Y. West (270) is -X.
    # If standard math angle is 0 (East), Vastu angle is 90.
    # If standard math angle is 90 (North), Vastu angle is 0.
    # Vastu_angle = (90 - standard_math_angle + 360) % 360
    vastu_angle = (90 - angle_deg_from_pos_x + 360) % 360
    
    return vastu_angle


def get_zone_from_angle(angle: float, north_offset: float, zones_names: List[Direction]) -> Optional[Direction]:
    """
    Determines the 16-zone direction name for a given angle, considering the north offset.
    The zones are assumed to be evenly spaced.
    """
    num_zones = len(zones_names)
    if num_zones == 0:
        return None

    # Adjust angle based on north offset (North direction of the plot)
    # The 'north' of the plot is at 0 degrees for calculation, so we rotate the angle.
    # If north_offset is 30 degrees, it means the plot's north is actually 30 degrees clockwise from true North.
    # So, to find where an angle 'falls' relative to the plot's orientation, we subtract the offset.
    # Vastu angles are clockwise from North.
    # If an object is at 45 degrees true, and plot north is 30 degrees, its angle relative to plot north is 15 degrees.
    adjusted_angle = (angle - north_offset + 360) % 360

    step = 360 / num_zones
    # Zones are ordered NNE, NE, ENE, E... N
    # NNE starts at 11.25 degrees and ends at 33.75 degrees (assuming N is centered at 0/360)
    # More generally, the center of N is 0. The center of NNE is 22.5.
    # Let's define the start angle of each zone:
    # N: -11.25 to 11.25
    # NNE: 11.25 to 33.75
    # NE: 33.75 to 56.25

    # Assuming the first zone in `zones_names` (NNE) starts after N's first half.
    # The `generate_zones` function correctly creates wedges.
    # A simpler approach is to align `adjusted_angle` to the start of NNE.
    
    # Calculate the angle where the first zone (NNE) begins
    # N is usually centered at 0 (or 360).
    # 16 zones, each 22.5 degrees.
    # NNE is 1st zone after N. N is from 348.75 to 11.25.
    # NNE is from 11.25 to 33.75
    # The `generate_zones` actually gives startAngle and endAngle for each region
    # So the startAngle for NNE is at `north+0*step`, and for NE it's `north+1*step`

    for i in range(num_zones):
        # The angle `a1` from `generate_zones` is `north+i*step`.
        # This angle marks the start of the current zone.
        # So the zone extends from `start_zone_angle` to `start_zone_angle + step`.
        start_zone_angle = (i * step)
        end_zone_angle = ((i + 1) * step)

        # If the zone does not cross 0/360
        if start_zone_angle <= adjusted_angle < end_zone_angle:
            return zones_names[i]
        
    return None # Should not happen if angles are properly normalized

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

def generate_zones(poly: Polygon, north: float, names: List[Direction], label: str): # Use Direction Literal
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
# OBJECT ANALYSIS
# ======================================================

def analyze_objects(req: ObjectAnalysisRequest) -> VastuAnalysisResult:
    outer_polygon = to_polygon(req.boundary_normalized)
    
    # 1. Generate Devta and 16-Zone regions
    if outer_polygon.is_empty:
        return VastuAnalysisResult(
            analyzed_objects=[],
            total_score=0,
            overall_percentage=100.0,
            overall_verdict="GOOD"
        )

    # Use the original devta generation logic, which user wants untouched
    if len(req.boundary_normalized) <= 4:
        devtas45_regions = generate_45_devtas(outer_polygon, req.north_direction)
    else:
        core_polygon = largest_inner_rectangle(outer_polygon)
        devtas45_regions = generate_45_devtas(core_polygon, req.north_direction, "traditional-core")
    
    zones16_regions = generate_zones(outer_polygon, req.north_direction, ZONE_NAMES_16, "zone16")

    analyzed_objects: List[AnalyzedObjectResult] = []
    total_score = 0
    
    # Calculate max and min possible scores across all rules, needed for percentage
    max_rule_score = 0
    min_rule_score = 0
    
    # Iterate through all possible rule scores to find the global min and max
    # This is a more robust way to find the min/max score an individual object can get
    has_rules = False
    for obj_type_rules in VASTU_RULES.values():
        for score in obj_type_rules.values():
            if score > max_rule_score:
                max_rule_score = score
            if score < min_rule_score:
                min_rule_score = score
            has_rules = True

    # If no rules are defined, default max/min to sensible values or handle
    if not has_rules:
        max_rule_score = 100 # Default if no rules provide scores
        min_rule_score = -100

    if not req.placed_objects:
        return VastuAnalysisResult(
            analyzed_objects=[],
            total_score=0,
            overall_percentage=100.0,
            overall_verdict="GOOD"
        )

    for obj in req.placed_objects:
        obj_polygon = to_polygon(obj.boundary_normalized)
        
        # Skip if object polygon is invalid or empty
        if obj_polygon.is_empty:
            analyzed_objects.append(AnalyzedObjectResult(
                object_id=obj.id,
                object_type=obj.object_type,
                devta_region=None,
                zone16_direction=None,
                score_impact=0,
                verdict="CRITICAL", # An object with no valid geometry is critical
                message="Object has no valid geometry or is outside plot boundary."
            ))
            continue

        # Determine Devta Region by largest intersection
        devta_name: Optional[str] = None
        max_devta_intersection_area = 0
        for devta_region in devtas45_regions:
            region_poly = to_polygon(devta_region.polygon)
            # Ensure the region polygon is valid before intersection
            if not region_poly.is_empty and obj_polygon.intersects(region_poly):
                intersection = obj_polygon.intersection(region_poly)
                if not intersection.is_empty and intersection.area > max_devta_intersection_area:
                    max_devta_intersection_area = intersection.area
                    devta_name = devta_region.name
        
        # Determine 16-Zone Direction by largest intersection
        zone16_direction: Optional[Direction] = None
        max_zone16_intersection_area = 0
        for zone_region in zones16_regions:
            region_poly = to_polygon(zone_region.polygon)
            # Ensure the region polygon is valid before intersection
            if not region_poly.is_empty and obj_polygon.intersects(region_poly):
                intersection = obj_polygon.intersection(region_poly)
                if not intersection.is_empty and intersection.area > max_zone16_intersection_area:
                    max_zone16_intersection_area = intersection.area
                    zone16_direction = zone_region.name # This is already a Direction Literal
        
        score_impact = 0
        verdict: Literal["EXCELLENT", "GOOD", "BAD", "CRITICAL"] = "GOOD"
        message = "Placement analyzed."

        if zone16_direction:
            score_impact = get_vastu_score_impact(obj.object_type, zone16_direction)
            verdict = get_vastu_verdict(score_impact)
            
            if score_impact > 0:
                message = f"Good placement for {obj.object_type} in {zone16_direction}."
            elif score_impact < 0:
                message = f"Problematic placement for {obj.object_type} in {zone16_direction}."
            else:
                message = f"Neutral placement for {obj.object_type} in {zone16_direction}."
        else:
            # If no zone is determined by intersection, use centroid fallback (or consider it an issue)
            # This is a fallback to ensure we always get a zone if possible
            plot_center_point = visual_center(outer_polygon)
            obj_angle = get_angle_from_point(plot_center_point, obj.centroid)
            fallback_zone16_direction = get_zone_from_angle(obj_angle, req.north_direction, ZONE_NAMES_16)
            
            if fallback_zone16_direction:
                zone16_direction = fallback_zone16_direction
                score_impact = get_vastu_score_impact(obj.object_type, zone16_direction)
                verdict = get_vastu_verdict(score_impact)
                message = f"Zone determined by centroid fallback for {obj.object_type} in {zone16_direction}."
            else:
                # Still no zone, mark as critical or neutral if no impact
                message = "Could not determine any zone direction for placement. Defaulting to neutral (0 impact)."
                verdict = "BAD" # Or CRITICAL if no zone means serious issue
                score_impact = 0


        analyzed_objects.append(AnalyzedObjectResult(
            object_id=obj.id,
            object_type=obj.object_type,
            devta_region=devta_name,
            zone16_direction=zone16_direction,
            score_impact=score_impact,
            verdict=verdict,
            message=message
        ))
        total_score += score_impact
    
    # Calculate overall percentage
    num_objects_with_rules = len(req.placed_objects) # Count only objects with rules applied
    
    overall_percentage = 0.0
    if num_objects_with_rules > 0:
        min_overall_score = min_rule_score * num_objects_with_rules
        max_overall_score = max_rule_score * num_objects_with_rules

        if (max_overall_score - min_overall_score) > 0:
            # Scale current total_score from [min_overall_score, max_overall_score] to [0, 100]
            scaled_score = total_score - min_overall_score
            scaled_range = max_overall_score - min_overall_score
            overall_percentage = (scaled_score / scaled_range) * 100.0
        else:
            # All scores are identical (e.g., all 0 or all 10)
            overall_percentage = 100.0 if total_score >= 0 else 0.0
    else:
         overall_percentage = 100.0 # No objects analyzed, perfect score

    # Clamp percentage to 0-100 range
    overall_percentage = max(0.0, min(100.0, overall_percentage))

    # Determine overall verdict
    overall_verdict: Literal["EXCELLENT", "GOOD", "BAD", "CRITICAL"] = "GOOD"
    if overall_percentage >= 90:
        overall_verdict = "EXCELLENT"
    elif overall_percentage >= 60:
        overall_verdict = "GOOD"
    elif overall_percentage >= 30:
        overall_verdict = "BAD"
    else:
        overall_verdict = "CRITICAL"


    return VastuAnalysisResult(
        analyzed_objects=analyzed_objects,
        total_score=total_score,
        overall_percentage=round(overall_percentage, 2),
        overall_verdict=overall_verdict
    )


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

@app.post("/analyze_objects", response_model=VastuAnalysisResult)
async def analyze_objects_endpoint(req: ObjectAnalysisRequest):
    return analyze_objects(req)


@app.get("/health")
def health():
    return {"status": "ok", "engine": "vastu-spatial-v5"}

# ======================================================
# RUN
# ======================================================

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)