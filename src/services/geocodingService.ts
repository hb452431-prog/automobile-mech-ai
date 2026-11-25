// Geocoding Service using OpenStreetMap Nominatim with in-memory caching

const cache = new Map<string, any[]>();

export interface LocationSearchResult {
  id: number;
  displayName: string;
  shortName: string;
  lat: number;
  lng: number;
  type?: string;
}

export const geocodingService = {
  searchLocation: async (query: string): Promise<LocationSearchResult[]> => {
    if (!query || query.trim().length < 2) return [];

    const cleanQuery = query.trim().toLowerCase();
    if (cache.has(cleanQuery)) {
      return cache.get(cleanQuery)!;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        cleanQuery
      )}&limit=5&addressdetails=1`;

      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Nominatim error: ${res.status}`);
      }

      const data = await res.json();
      const results: LocationSearchResult[] = (data || []).map((item: any) => ({
        id: item.place_id,
        displayName: item.display_name,
        shortName: item.name || item.display_name.split(",")[0],
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type,
      }));

      cache.set(cleanQuery, results);
      return results;
    } catch (err: any) {
      console.warn("Geocoding search failed, providing fallback:", err.message);
      return [];
    }
  },
};

export default geocodingService;
