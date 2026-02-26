// utils/calculateBoundaryDistribution.ts
import { Point } from "@/lib/floorPlanInterfaces";

type Zone = {
  zone: string;
  startAngle: number;
  endAngle: number;
};

type BoundaryEdge = {
  start: Point;
  end: Point;
  length: number;
};

export const calculateBoundaryDistribution = (
  boundary: Point[],
  centroid: Point,
  zones: Zone[]
): { zone: string; boundaryPercent: number }[] => {
  if (!boundary || boundary.length < 2 || !centroid || !zones || zones.length === 0) {
    return [];
  }

  const edges: BoundaryEdge[] = [];
  for (let i = 0; i < boundary.length; i++) {
    const p1 = boundary[i];
    const p2 = boundary[(i + 1) % boundary.length];
    const length = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    edges.push({ start: p1, end: p2, length });
  }

  const zoneLengths: { [key: string]: number } = zones.reduce((acc, zone) => {
    acc[zone.zone] = 0;
    return acc;
  }, {} as { [key: string]: number });

  edges.forEach(edge => {
    const midX = (edge.start.x + edge.end.x) / 2;
    const midY = (edge.start.y + edge.end.y) / 2;

    const angleRad = Math.atan2(midY - centroid.y, midX - centroid.x);
    let angleDeg = (angleRad * 180 / Math.PI + 360) % 360;

    const zone = zones.find(z => {
      if (z.startAngle < z.endAngle) {
        return angleDeg >= z.startAngle && angleDeg < z.endAngle;
      } else { // Zone crosses 0/360 boundary
        return angleDeg >= z.startAngle || angleDeg < z.endAngle;
      }
    });

    if (zone) {
      zoneLengths[zone.zone] += edge.length;
    }
  });

  const totalPerimeter = edges.reduce((sum, edge) => sum + edge.length, 0);

  if (totalPerimeter === 0) {
    return zones.map(zone => ({ zone: zone.zone, boundaryPercent: 0 }));
  }

  const boundaryDistribution = zones.map(zone => ({
    zone: zone.zone,
    boundaryPercent: (zoneLengths[zone.zone] / totalPerimeter) * 100,
  }));

  return boundaryDistribution;
};
