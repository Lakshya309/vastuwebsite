// utils/calculateAreaDistribution.ts

type ZoneAreaData = {
  zone: string;
  area: number;
};

export const calculateAreaDistribution = (
  zoneAreas: ZoneAreaData[]
): { zone: string; areaPercent: number }[] => {
  if (!zoneAreas || zoneAreas.length === 0) {
    return [];
  }

  const totalArea = zoneAreas.reduce((sum, zone) => sum + zone.area, 0);

  if (totalArea === 0) {
    return zoneAreas.map(zone => ({ zone: zone.zone, areaPercent: 0 }));
  }

  const areaDistribution = zoneAreas.map(zone => ({
    zone: zone.zone,
    areaPercent: (zone.area / totalArea) * 100,
  }));

  return areaDistribution;
};
