// Geocode via Google Maps connector gateway (server-side would be ideal;
// for now uses the browser key which is authorized for Maps JS + Places New only).
// We instead call our own thin server fn.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const geocodeServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ address: z.string().min(3).max(300) }).parse(raw))
  .handler(async ({ data }) => {
    const lovKey = process.env.LOVABLE_API_KEY;
    const gKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!lovKey || !gKey) throw new Error("Google Maps connector not configured");
    const url = `https://connector-gateway.lovable.dev/google_maps/maps/api/geocode/json?address=${encodeURIComponent(data.address)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${lovKey}`, "X-Connection-Api-Key": gKey },
    });
    if (!res.ok) throw new Error(`Geocode failed [${res.status}]: ${await res.text()}`);
    const j = await res.json();
    const loc = j?.results?.[0]?.geometry?.location;
    if (!loc) return null;
    return { lat: loc.lat as number, lng: loc.lng as number };
  });

export async function geocodeAddress(address: string) {
  try { return await geocodeServer({ data: { address } }); }
  catch { return null; }
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
