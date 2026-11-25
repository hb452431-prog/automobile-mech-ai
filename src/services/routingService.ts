// Routing Service using OSRM with intelligent interpolated road fallback

const routeCache = new Map<string, RouteResult>();

export interface RouteResult {
  coordinates: Array<[number, number]>;
  distanceKm: number;
  distanceFormatted: string;
  durationMinutes: number;
  durationFormatted: string;
  isFallback: boolean;
}

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

export function calculateETA(distanceKm: number): string {
  // Average city driving speed 30 km/h + 2 min dispatch buffer
  const mins = Math.max(2, Math.round((distanceKm / 30) * 60) + 2);
  return `${mins} mins`;
}

const generateInterpolatedRoute = (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  pointsCount = 12
): Array<[number, number]> => {
  const points: Array<[number, number]> = [];
  for (let i = 0; i <= pointsCount; i++) {
    const t = i / pointsCount;
    const wobble = Math.sin(t * Math.PI) * 0.002;
    const lat = startLat + (endLat - startLat) * t + wobble;
    const lng = startLng + (endLng - startLng) * t;
    points.push([lat, lng]);
  }
  return points;
};

export const routingService = {
  getRoute: async (
    startLat?: number,
    startLng?: number,
    endLat?: number,
    endLng?: number
  ): Promise<RouteResult | null> => {
    if (
      startLat === undefined ||
      startLng === undefined ||
      endLat === undefined ||
      endLng === undefined
    ) {
      return null;
    }

    const cacheKey = `${startLat.toFixed(4)},${startLng.toFixed(4)}_${endLat.toFixed(4)},${endLng.toFixed(4)}`;
    if (routeCache.has(cacheKey)) {
      return routeCache.get(cacheKey)!;
    }

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OSRM HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates: Array<[number, number]> = route.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );
        const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
        const durationMinutes = Math.max(1, Math.round(route.duration / 60));

        const result: RouteResult = {
          coordinates,
          distanceKm,
          distanceFormatted: formatDistance(distanceKm),
          durationMinutes,
          durationFormatted: `${durationMinutes} mins`,
          isFallback: false,
        };

        routeCache.set(cacheKey, result);
        return result;
      } else {
        throw new Error("OSRM returned no valid route");
      }
    } catch (err: any) {
      const fallbackDistance = calculateDistanceKm(startLat, startLng, endLat, endLng);
      const fallbackETA = calculateETA(fallbackDistance);
      const coordinates = generateInterpolatedRoute(startLat, startLng, endLat, endLng);

      const fallbackResult: RouteResult = {
        coordinates,
        distanceKm: fallbackDistance,
        distanceFormatted: formatDistance(fallbackDistance),
        durationMinutes: parseInt(fallbackETA, 10) || 8,
        durationFormatted: fallbackETA,
        isFallback: true,
      };

      return fallbackResult;
    }
  },
};

export default routingService;
