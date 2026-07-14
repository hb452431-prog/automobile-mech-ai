import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MapPin, Navigation, Phone, Route as RouteIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { distanceKm } from "@/lib/geocode";
import type { Tables } from "@/integrations/supabase/types";

type Mech = Tables<"mechanics">;

declare global { interface Window { google?: any; initNearbyMap?: () => void; } }

const RADIUS_KM = 1;

export const Route = createFileRoute("/customer/nearby")({ component: NearbyPage });

function NearbyPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const mapDiv = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const meMarkerRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const dirRendererRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);

  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [mechs, setMechs] = useState<Mech[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [routing, setRouting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  // Load mechanics
  useEffect(() => {
    supabase.from("mechanics").select("*").not("latitude", "is", null).then(({ data }) => {
      if (data) setMechs(data as Mech[]);
    });
  }, []);

  // Load Google Maps
  useEffect(() => {
    if (window.google?.maps) { setMapReady(true); return; }
    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const trackId = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
    if (!key) return;
    window.initNearbyMap = () => setMapReady(true);
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&libraries=routes&callback=initNearbyMap${trackId ? `&channel=${trackId}` : ""}`;
    s.async = true;
    document.head.appendChild(s);
  }, []);

  // Geolocation watch
  useEffect(() => {
    if (!navigator.geolocation) { setLocError("Geolocation not supported"); return; }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (p) => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocError(null); },
      (err) => setLocError(err.message || "Location permission denied"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => { if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapReady || !mapDiv.current || mapRef.current || !pos) return;
    mapRef.current = new window.google.maps.Map(mapDiv.current, {
      center: pos, zoom: 15, disableDefaultUI: true, zoomControl: true, gestureHandling: "greedy",
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1a2332" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#d1d5db" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#334155" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b1220" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
      ],
    });
  }, [mapReady, pos]);

  // Me marker + follow
  useEffect(() => {
    if (!mapRef.current || !pos) return;
    if (!meMarkerRef.current) {
      meMarkerRef.current = new window.google.maps.Marker({
        position: pos, map: mapRef.current, title: "You",
        icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: "#dc2626", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3 },
        zIndex: 999,
      });
    } else {
      meMarkerRef.current.setPosition(pos);
    }
  }, [pos, mapReady]);

  const nearby = useMemo(() => {
    if (!pos) return [];
    return mechs
      .map((m) => ({ m, dist: distanceKm(pos, { lat: m.latitude!, lng: m.longitude! }) }))
      .filter((x) => x.dist <= RADIUS_KM)
      .sort((a, b) => a.dist - b.dist);
  }, [mechs, pos]);

  // Garage markers
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;
    Object.values(markersRef.current).forEach((m: any) => m.setMap(null));
    markersRef.current = {};
    nearby.forEach(({ m }) => {
      const marker = new window.google.maps.Marker({
        position: { lat: m.latitude!, lng: m.longitude! }, map: mapRef.current, title: m.garage_name,
        icon: {
          path: "M12 2C7 2 3 6 3 11c0 7 9 13 9 13s9-6 9-13c0-5-4-9-9-9z",
          fillColor: "#dc2626", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2, scale: 1.6,
          anchor: new window.google.maps.Point(12, 24),
        },
      });
      marker.addListener("click", () => setSelectedId(m.id));
      markersRef.current[m.id] = marker;
    });
  }, [nearby]);

  const clearRoute = () => {
    if (dirRendererRef.current) { dirRendererRef.current.setMap(null); dirRendererRef.current = null; }
    setRouteInfo(null);
  };

  const drawDirections = async (m: Mech) => {
    if (!pos || !window.google?.maps) return;
    setRouting(true); clearRoute();
    try {
      const svc = new window.google.maps.DirectionsService();
      const res: any = await new Promise((resolve, reject) =>
        svc.route({
          origin: pos, destination: { lat: m.latitude!, lng: m.longitude! },
          travelMode: window.google.maps.TravelMode.DRIVING,
        }, (r: any, status: string) => status === "OK" ? resolve(r) : reject(new Error(status))),
      );
      const renderer = new window.google.maps.DirectionsRenderer({
        map: mapRef.current, directions: res, suppressMarkers: true,
        polylineOptions: { strokeColor: "#dc2626", strokeWeight: 5, strokeOpacity: 0.9 },
      });
      dirRendererRef.current = renderer;
      const leg = res.routes[0].legs[0];
      setRouteInfo({ distance: leg.distance.text, duration: leg.duration.text });
    } catch (e: any) {
      toast.error("Could not fetch directions: " + e.message);
    } finally { setRouting(false); }
  };

  const startNav = (m: Mech) => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${pos?.lat},${pos?.lng}&destination=${m.latitude},${m.longitude}&travelmode=driving&dir_action=navigate`;
    window.open(url, "_blank");
  };

  const selected = nearby.find((n) => n.m.id === selectedId)?.m;

  // Pan to selected
  useEffect(() => {
    if (selectedId && markersRef.current[selectedId] && mapRef.current) {
      mapRef.current.panTo(markersRef.current[selectedId].getPosition());
    }
  }, [selectedId]);

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center gap-2 p-3">
        <Button asChild size="icon" variant="secondary" className="rounded-full shadow-lg">
          <Link to="/customer/home"><ArrowLeft className="size-5" /></Link>
        </Button>
        <div className="flex-1 rounded-full bg-card/95 px-4 py-2 shadow-lg backdrop-blur">
          <p className="text-sm font-semibold">Nearby Garages</p>
          <p className="text-[11px] text-muted-foreground">Within {RADIUS_KM} km · {nearby.length} found</p>
        </div>
      </div>

      {/* Map */}
      <div ref={mapDiv} className="flex-1 bg-muted" />

      {!pos && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-background/80">
          <div className="rounded-2xl border border-border/60 bg-card p-6 text-center card-elev">
            {locError ? (
              <>
                <p className="font-semibold text-destructive">Location needed</p>
                <p className="mt-1 text-sm text-muted-foreground">{locError}</p>
                <p className="mt-2 text-xs text-muted-foreground">Enable location permission and reload.</p>
              </>
            ) : (
              <>
                <Loader2 className="mx-auto size-6 animate-spin text-primary" />
                <p className="mt-2 text-sm text-muted-foreground">Getting your location…</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Route info banner */}
      {routeInfo && (
        <div className="absolute left-1/2 top-20 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full bg-primary px-4 py-2 text-primary-foreground shadow-lg">
          <RouteIcon className="size-4" />
          <span className="text-sm font-semibold">{routeInfo.distance} · {routeInfo.duration}</span>
          <button onClick={clearRoute} className="ml-1"><X className="size-4" /></button>
        </div>
      )}

      {/* Bottom sheet */}
      <div className="absolute inset-x-0 bottom-0 z-20 max-h-[55vh] overflow-y-auto rounded-t-3xl border-t border-border/60 bg-card/95 p-4 shadow-2xl backdrop-blur">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        {selected ? (
          <GarageDetail m={selected} dist={nearby.find(n => n.m.id === selected.id)!.dist} onBack={() => { setSelectedId(null); clearRoute(); }} onDirections={() => drawDirections(selected)} onNav={() => startNav(selected)} routing={routing} />
        ) : nearby.length === 0 ? (
          <div className="py-8 text-center">
            <MapPin className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-2 font-semibold">No registered garages within {RADIUS_KM} km</p>
            <p className="text-sm text-muted-foreground">Try again from a different location.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {nearby.map(({ m, dist }) => (
              <button key={m.id} onClick={() => setSelectedId(m.id)} className="w-full rounded-xl border border-border/60 bg-background p-3 text-left transition hover:border-primary/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{m.garage_name}</h3>
                    <p className="truncate text-xs text-muted-foreground">{m.full_name} · {m.address}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(m.services ?? []).slice(0, 3).map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge className="grad-primary text-primary-foreground">{(dist * 1000).toFixed(0)} m</Badge>
                    <p className="mt-1 text-[10px] uppercase text-muted-foreground">{m.availability_status}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GarageDetail({ m, dist, onBack, onDirections, onNav, routing }: { m: Mech; dist: number; onBack: () => void; onDirections: () => void; onNav: () => void; routing: boolean }) {
  return (
    <div>
      <button onClick={onBack} className="mb-2 flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="size-3" /> Back to list</button>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">{m.garage_name}</h2>
          <p className="text-sm text-muted-foreground">{m.full_name}</p>
        </div>
        <Badge className="grad-primary text-primary-foreground">{(dist * 1000).toFixed(0)} m</Badge>
      </div>
      <p className="mt-2 text-sm">{m.address}, {m.city}</p>
      <p className="text-xs text-muted-foreground">{m.working_hours} · <span className="uppercase">{m.availability_status}</span></p>
      <div className="mt-2 flex flex-wrap gap-1">
        {(m.services ?? []).map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Button asChild variant="secondary" size="sm"><a href={`tel:${m.phone}`}><Phone className="mr-1 size-4" />Call</a></Button>
        <Button onClick={onDirections} disabled={routing} variant="secondary" size="sm">
          {routing ? <Loader2 className="mr-1 size-4 animate-spin" /> : <RouteIcon className="mr-1 size-4" />}Route
        </Button>
        <Button onClick={onNav} size="sm" className="grad-primary text-primary-foreground"><Navigation className="mr-1 size-4" />Navigate</Button>
      </div>
    </div>
  );
}
