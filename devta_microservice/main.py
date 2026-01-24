from flask import Flask, request, jsonify
from shapely.geometry import Polygon, Point
from typing import List, Dict, Any
import math

app = Flask(__name__)

# --- Helper functions (from geometry.ts, adapted to Python) ---
class Point:
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

    def to_dict(self):
        return {"x": self.x, "y": self.y}

def calculate_centroid(polygon_points: List[Point]) -> Point:
    if not polygon_points:
        return Point(0, 0)
    
    x_coords = [p.x for p in polygon_points]
    y_coords = [p.y for p in polygon_points]
    
    return Point(sum(x_coords) / len(polygon_points), sum(y_coords) / len(polygon_points))

def polygon_area(polygon_points: List[Point]) -> float:
    if len(polygon_points) < 3:
        return 0.0
    
    polygon = Polygon([(p.x, p.y) for p in polygon_points])
    return polygon.area

def point_in_polygon(point: Point, polygon_points: List[Point]) -> bool:
    if len(polygon_points) < 3:
        return False
    
    poly_shape = Polygon([(p.x, p.y) for p in polygon_points])
    p_shape = Point(point.x, point.y)
    return poly_shape.contains(p_shape)

def scale_polygon(polygon_points: List[Point], centroid: Point, scale_factor: float) -> List[Point]:
    scaled_points = []
    for p in polygon_points:
        scaled_x = centroid.x + (p.x - centroid.x) * scale_factor
        scaled_y = centroid.y + (p.y - centroid.y) * scale_factor
        scaled_points.append(Point(scaled_x, scaled_y))
    return scaled_points

def ray_polygon_intersection(angle_deg: float, polygon_points: List[Point], origin: Point) -> Point:
    # Convert angle to radians
    angle_rad = math.radians(angle_deg)
    
    # Define a ray from origin extending far out
    # A sufficiently large number for the ray length
    ray_length = 10000 
    
    ray_end_x = origin.x + ray_length * math.cos(angle_rad)
    ray_end_y = origin.y + ray_length * math.sin(angle_rad)
    
    ray = Polygon([(origin.x, origin.y), (ray_end_x, ray_end_y)])
    poly_shape = Polygon([(p.x, p.y) for p in polygon_points])
    
    intersection = ray.intersection(poly_shape)
    
    if intersection.is_empty:
        return None
    
    # Shapely's intersection can return a MultiPoint, LineString, or Point
    if intersection.geom_type == 'Point':
        return Point(intersection.x, intersection.y)
    elif intersection.geom_type == 'MultiPoint':
        # Return the point furthest from the origin, or closest along the ray
        closest_point = None
        min_dist = float('inf')
        for p in intersection.geoms:
            dist = math.sqrt((p.x - origin.x)**2 + (p.y - origin.y)**2)
            if dist < min_dist:
                min_dist = dist
                closest_point = Point(p.x, p.y)
        return closest_point
    elif intersection.geom_type == 'LineString':
        # Return the start point of the LineString segment that intersects
        # This is a simplification; a more robust solution might consider direction.
        return Point(intersection.coords[0][0], intersection.coords[0][1])
    
    return None

# Devta names and their properties (simplified for now)
# These would ideally come from a configuration or database
BRAHMA_DEVTA_NAME = "Brahma"
MIDDLE_RING_DEVTA_NAMES = [f"Middle {i+1}" for i in range(12)]
OUTER_RING_DEVTA_NAMES = [f"Outer {i+1}" for i in range(32)]

@app.route('/analyze_devtas', methods=['POST'])
def analyze_devtas():
    data = request.json
    boundary_normalized_data = data.get('boundary_normalized')
    north_direction = data.get('north_direction', 0)

    if not boundary_normalized_data:
        return jsonify({"error": "Missing boundary_normalized"}), 400

    boundary_points = [Point(p['x'], p['y']) for p in boundary_normalized_data]

    # Placeholder for actual 45 Devtas generation logic
    # This is where the complex geometry for L, U, C shapes would be handled
    devta_regions = generate_45_devtas_logic(boundary_points, north_direction)

    return jsonify({"devta_regions": [dr.to_dict() for dr in devta_regions]})

class DevtaRegion:
    def __init__(self, id: str, name: str, polygon: List[Point], ring: str):
        self.id = id
        self.name = name
        self.polygon = polygon
        self.ring = ring

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "polygon": [p.to_dict() for p in self.polygon],
            "ring": self.ring
        }

def generate_45_devtas_logic(boundary: List[Point], north_direction: float) -> List[DevtaRegion]:
    # Placeholder for the actual Vastu Purusha Mandala generation
    # This function would be similar to the generate45Devtas function from the removed devtaAnalysis.ts
    # It needs to handle the concentric rings, angular divisions, and special shapes.

    if len(boundary) < 3:
        return []

    devta_regions: List[DevtaRegion] = []
    
    centroid = calculate_centroid(boundary)

    # Simplified example: just create a Brahma devta and some dummy outer devtas
    # In a real implementation, this would involve precise geometric calculations
    # using polygon offsetting, angular divisions, and handling of complex plot shapes.

    # Brahma (center)
    brahma_polygon_scaled = scale_polygon(boundary, centroid, 0.1) # very small center
    devta_regions.append(DevtaRegion(
        id="brahma",
        name=BRAHMA_DEVTA_NAME,
        polygon=brahma_polygon_scaled,
        ring="center"
    ))

    # Example: create some "outer" devtas based on angular divisions
    num_outer_devtas = 32 # or 45 based on your specific Vastu Mandala
    angle_step = 360 / num_outer_devtas
    
    for i in range(num_outer_devtas):
        start_angle = (i * angle_step + north_direction) % 360
        end_angle = ((i + 1) * angle_step + north_direction) % 360

        # This is a highly simplified polygon for a sector
        # Actual implementation requires polygon offsetting between concentric rings
        # and clipping these rings by angular sectors.
        outer_p1 = ray_polygon_intersection(start_angle, boundary, centroid)
        outer_p2 = ray_polygon_intersection(end_angle, boundary, centroid)
        
        # To make a valid polygon, we need points on an inner ring as well
        # For this placeholder, we'll just use a small inner polygon for demonstration
        inner_boundary = scale_polygon(boundary, centroid, 0.5)
        inner_p1 = ray_polygon_intersection(start_angle, inner_boundary, centroid)
        inner_p2 = ray_polygon_intersection(end_angle, inner_boundary, centroid)


        if outer_p1 and outer_p2 and inner_p1 and inner_p2:
            # A very crude representation of a sector for illustration
            sector_polygon_points = [outer_p1, outer_p2, inner_p2, inner_p1, outer_p1]
            devta_regions.append(DevtaRegion(
                id=f"outer-{i}",
                name=OUTER_RING_DEVTA_NAMES[i % len(OUTER_RING_DEVTA_NAMES)],
                polygon=sector_polygon_points,
                ring="outer"
            ))

    return devta_regions

if __name__ == '__main__':
    app.run(debug=True, port=5000)