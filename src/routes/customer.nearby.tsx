import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Loader2, 
  MapPin, 
  Navigation, 
  Phone, 
  Route as RouteIcon, 
  X, 
  Star, 
  Calendar, 
  Clock, 
  Compass,
  Radio,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MechMap, type MapGarageItem } from "@/components/map/MechMap";
import { MechanicBikeDispatchLoader } from "@/components/garage/MechanicBikeDispatchLoader";
import { LocationStatusBar } from "@/components/common/LocationStatusBar";
import { LocationPermissionModal } from "@/components/common/LocationPermissionModal";
import { useLocation } from "@/hooks/useLocation";
import { generateGaragesNearLocation, type DemoGarage } from "@/data/demoGarages";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { routingService, calculateDistanceKm, formatDistance, calculateETA } from "@/services/routingService";
import type { Tables } from "@/integrations/supabase/types";

type Mech = Tables<"mechanics">;

export const Route = createFileRoute("/customer/nearby")({ component: NearbyPage });

function NearbyPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [showBikeDispatchLoader, setShowBikeDispatchLoader] = useState(true);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [dbMechs, setDbMechs] = useState<Mech[]>([]);
  const [selectedGarage, setSelectedGarage] = useState<MapGarageItem | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<[number, number]> | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [routing, setRouting] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "closest" | "247">("all");

  const {
    location: userLocation,
    accuracy,
    loading: isLocating,
    error: locationError,
    permission,
    tracking,
    isManual,
    deviceInfo,
    requestLocation,
    fetchIPLocation,
    turnOnLocation,
    setManualLocation,
  } = useLocation({ autoRequest: true, enableHighAccuracy: true, allowIPFallback: true, watch: true });

  const effectiveCenter = useMemo(() => {
    if (userLocation && typeof userLocation.lat === "number" && typeof userLocation.lng === "number") {
      return { lat: userLocation.lat, lng: userLocation.lng };
    }
    return { lat: 37.7749, lng: -122.4194 };
  }, [userLocation]);

  // Guest access allowed for exploring local map and live tracking
  // useEffect(() => {
  //   if (!authLoading && !user) navigate({ to: "/auth" });
  // }, [user, authLoading, navigate]);

  // Load registered mechanics from Supabase safely
  useEffect(() => {
    supabase
      .from("mechanics")
      .select("*")
      .not("latitude", "is", null)
      .then(({ data }) => {
        if (data && data.length > 0) setDbMechs(data as Mech[]);
      })
      .catch(() => {});
  }, []);

  // Dynamically generate nearby garages around user's GPS / IP location anywhere in the world!
  const allGarages: MapGarageItem[] = useMemo(() => {
    const lat = effectiveCenter.lat;
    const lng = effectiveCenter.lng;

    // 1. Dynamic localized demo garages (1 to 5 km radius)
    const localDemoGarages = generateGaragesNearLocation(lat, lng, 8).map((g) => ({
      id: g.id,
      name: g.name,
      mechanicName: g.mechanicName,
      owner: g.mechanicName,
      phone: g.phone,
      address: g.address,
      services: g.services,
      rating: g.rating,
      reviewsCount: g.reviewsCount,
      available: g.available,
      isOpen247: g.services.some((s) => s.toLowerCase().includes("24/7")),
      distanceKm: g.distanceKm,
      distance: g.distance,
      lat: g.lat,
      lng: g.lng,
      hourlyRate: 85,
    }));

    // 2. Database mechanics
    const fromDb: MapGarageItem[] = dbMechs.map((m) => {
      const mLat = m.latitude || lat;
      const mLng = m.longitude || lng;
      const dist = calculateDistanceKm(lat, lng, mLat, mLng);
      return {
        id: m.id,
        name: m.garage_name,
        mechanicName: m.full_name,
        owner: m.full_name,
        phone: m.phone,
        address: `${m.address}, ${m.city}`,
        services: m.services ?? ["General Automotive Repair"],
        rating: 4.9,
        reviewsCount: 120,
        available: m.availability_status === "open",
        isOpen247: false,
        distanceKm: dist,
        distance: formatDistance(dist),
        lat: mLat,
        lng: mLng,
        hourlyRate: 95,
      };
    });

    const combined = [...fromDb, ...localDemoGarages];
    return combined.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  }, [effectiveCenter, dbMechs]);

  // Filter garages
  const filteredGarages = useMemo(() => {
    if (filterType === "closest") {
      return allGarages.filter((g) => (g.distanceKm || 999) <= 3.5);
    }
    if (filterType === "247") {
      return allGarages.filter(
        (g) =>
          g.isOpen247 ||
          (Array.isArray(g.services) &&
            g.services.some((s) => s.toLowerCase().includes("24/7") || s.toLowerCase().includes("emergency")))
      );
    }
    return allGarages;
  }, [allGarages, filterType]);

  const clearRoute = () => {
    setRouteCoordinates(null);
    setRouteInfo(null);
  };

  const drawDirections = async (garage: MapGarageItem) => {
    const startLat = effectiveCenter.lat;
    const startLng = effectiveCenter.lng;

    setRouting(true);
    clearRoute();
    setSelectedGarage(garage);

    try {
      const routeData = await routingService.getRoute(startLat, startLng, garage.lat, garage.lng);
      if (routeData && routeData.coordinates.length > 0) {
        setRouteCoordinates(routeData.coordinates);
        setRouteInfo({
          distance: routeData.distanceFormatted,
          duration: routeData.durationFormatted,
        });
        toast.success(`Route calculated: ${routeData.distanceFormatted} (${routeData.durationFormatted})`);
      } else {
        const distKm = calculateDistanceKm(startLat, startLng, garage.lat, garage.lng);
        setRouteCoordinates([
          [startLat, startLng],
          [garage.lat, garage.lng],
        ]);
        setRouteInfo({
          distance: formatDistance(distKm),
          duration: calculateETA(distKm),
        });
      }
    } catch {
      const distKm = calculateDistanceKm(startLat, startLng, garage.lat, garage.lng);
      setRouteCoordinates([
        [startLat, startLng],
        [garage.lat, garage.lng],
      ]);
      setRouteInfo({
        distance: formatDistance(distKm),
        duration: calculateETA(distKm),
      });
    } finally {
      setRouting(false);
    }
  };

  // Whenever user's live GPS/IP location updates, automatically focus on the closest garage in their area!
  useEffect(() => {
    if (allGarages.length > 0) {
      const closest = allGarages[0];
      if (!selectedGarage || (selectedGarage.distanceKm && selectedGarage.distanceKm > 50)) {
        setSelectedGarage(closest);
        drawDirections(closest);
      }
    }
  }, [allGarages]);

  const startNav = (garage: MapGarageItem) => {
    const origin = `${effectiveCenter.lat},${effectiveCenter.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${garage.lat},${garage.lng}&travelmode=driving`;
    window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden select-none">
      {/* 1. Animated Mechanic Bike Dispatch Loader on Entrance */}
      {showBikeDispatchLoader && (
        <MechanicBikeDispatchLoader
          onFinish={() => setShowBikeDispatchLoader(false)}
          userCoordinates={effectiveCenter}
          portalType="user"
          mechanicName="Suresh"
        />
      )}

      {/* 2. Top Header & Navigation Bar */}
      <div className="absolute left-0 right-0 top-0 z-20 flex flex-col gap-2 p-3 pointer-events-none">
        <div className="flex items-center justify-between gap-3 pointer-events-auto">
          <div className="flex items-center gap-2">
            <Button asChild size="icon" variant="secondary" className="rounded-full shadow-lg">
              <Link to="/dashboard">
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
            <div className="rounded-2xl border border-border/60 bg-card/95 px-4 py-2 shadow-lg backdrop-blur-md">
              <p className="text-sm font-bold text-foreground">Find Nearby Garages</p>
              <p className="text-[11px] text-muted-foreground">
                {filteredGarages.length} verified workshops on live OpenStreetMap radar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Re-run Dispatch Bike Animation */}
            <button
              type="button"
              onClick={() => setShowBikeDispatchLoader(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl grad-primary text-primary-foreground font-bold text-xs shadow-md active:scale-95 transition cursor-pointer"
              title="Re-run Live Bike Dispatch Animation"
            >
              <span>🏍️</span>
              <span className="font-extrabold tracking-wide">LIVE BIKE DISPATCH</span>
            </button>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 rounded-2xl border border-border/60 bg-card/95 p-1 shadow-lg backdrop-blur-md text-xs font-semibold">
              <button
                onClick={() => setFilterType("all")}
                className={`rounded-xl px-2.5 py-1.5 transition ${
                  filterType === "all" ? "grad-primary text-primary-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({allGarages.length})
              </button>
              <button
                onClick={() => setFilterType("closest")}
                className={`rounded-xl px-2.5 py-1.5 transition ${
                  filterType === "closest" ? "grad-primary text-primary-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                &lt; 3.5 km
              </button>
              <button
                onClick={() => setFilterType("247")}
                className={`rounded-xl px-2.5 py-1.5 transition ${
                  filterType === "247" ? "bg-destructive text-destructive-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                24/7 Roadside
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Location Status Bar */}
        <div className="pointer-events-auto max-w-2xl">
          <LocationStatusBar
            location={userLocation}
            accuracy={accuracy}
            loading={isLocating}
            error={locationError}
            permission={permission}
            tracking={tracking}
            isManual={isManual}
            onRefreshLocation={turnOnLocation}
            onRequestPermission={() => setShowPermissionModal(true)}
            onOpenHubModal={() => setShowPermissionModal(true)}
          />
        </div>
      </div>

      {/* 3. Route Info HUD Overlay */}
      {routeInfo && (
        <div className="absolute left-1/2 top-28 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full bg-primary px-5 py-2.5 text-primary-foreground shadow-2xl animate-in fade-in">
          <RouteIcon className="size-4.5 animate-pulse" />
          <span className="text-sm font-black font-mono tracking-wide">
            {routeInfo.distance} · {routeInfo.duration} Drive
          </span>
          <button
            onClick={clearRoute}
            title="Clear Route"
            className="ml-2 rounded-full p-1 hover:bg-primary-foreground/20 transition-colors cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* 4. Master Interactive Leaflet OpenStreetMap Container */}
      <div className="size-full">
        <MechMap
          userLocation={userLocation ? { lat: userLocation.lat, lng: userLocation.lng, accuracy: accuracy || 15 } : effectiveCenter}
          garages={filteredGarages}
          selectedGarage={selectedGarage}
          onSelectGarage={(g) => drawDirections(g)}
          onRequestHelp={(g) => navigate({ to: `/sos?garage=${encodeURIComponent(g.name)}` as any })}
          routeCoordinates={routeCoordinates}
          showRoute={!!routeCoordinates}
          activeRouteInfo={routeInfo ? { distance: routeInfo.distance, eta: routeInfo.duration } : null}
          onLocate={() => turnOnLocation()}
          height="100%"
        />
      </div>

      {/* 5. Bottom Sheet Garage Details & List */}
      <div className="absolute inset-x-0 bottom-0 z-20 max-h-[46vh] overflow-y-auto rounded-t-3xl border-t border-border/60 bg-card/95 p-5 shadow-2xl backdrop-blur-md">
        <div className="mx-auto mb-3.5 h-1.5 w-12 rounded-full bg-muted-foreground/30" />

        {selectedGarage ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedGarage(null);
                  clearRoute();
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ArrowLeft className="size-3.5" /> Back to all {filteredGarages.length} workshops
              </button>
              <Badge variant="outline" className="border-success/40 bg-success/15 text-success font-semibold text-xs">
                {selectedGarage.available ? "Open Now" : "Closed"}
              </Badge>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">{selectedGarage.name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Lead Technician: <strong className="text-foreground">{selectedGarage.mechanicName || selectedGarage.owner}</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <MapPin className="size-3 text-primary" /> {selectedGarage.address}
                </p>
              </div>

              <div className="text-right">
                <div className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-500 border border-amber-500/20">
                  <Star className="size-3.5 fill-current" />
                  <span>{selectedGarage.rating || 4.9}</span>
                  <span className="text-muted-foreground font-normal">({selectedGarage.reviewsCount || 100}+)</span>
                </div>
                <p className="text-xs font-mono font-bold text-primary mt-1">
                  {selectedGarage.distance} away
                </p>
              </div>
            </div>

            {/* Specialties & Services */}
            <div className="flex flex-wrap gap-1.5">
              {(Array.isArray(selectedGarage.services)
                ? selectedGarage.services
                : [selectedGarage.services || "General Automotive"]
              ).map((s, idx) => (
                <Badge key={idx} variant="secondary" className="text-[11px] font-medium">
                  {s}
                </Badge>
              ))}
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              <Button asChild variant="outline" size="sm" className="h-10 text-xs font-semibold">
                <a href={`tel:${selectedGarage.phone}`}>
                  <Phone className="mr-1.5 size-4 text-success" /> Call Workshop
                </a>
              </Button>

              <Button
                onClick={() => drawDirections(selectedGarage)}
                disabled={routing}
                variant="outline"
                size="sm"
                className="h-10 text-xs font-semibold"
              >
                {routing ? <Loader2 className="mr-1.5 size-4 animate-spin text-primary" /> : <RouteIcon className="mr-1.5 size-4 text-primary" />}
                Route on Map
              </Button>

              <Button
                onClick={() => startNav(selectedGarage)}
                size="sm"
                variant="secondary"
                className="h-10 text-xs font-semibold"
              >
                <Navigation className="mr-1.5 size-4 text-primary" /> Turn-by-Turn
              </Button>

              <Button
                asChild
                size="sm"
                className="h-10 grad-primary text-primary-foreground font-bold shadow-md text-xs"
              >
                <Link to={`/mechanics?selected=${selectedGarage.id}&book=true`}>
                  <Calendar className="mr-1.5 size-4" /> Book Slot
                </Link>
              </Button>
            </div>
          </div>
        ) : filteredGarages.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <MapPin className="mx-auto size-8 opacity-40" />
            <p className="mt-2 font-bold text-foreground">No garages found matching filter</p>
            <p className="text-xs mt-1">Try switching to &ldquo;All&rdquo; filter or changing city.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pb-1">
              <span>Select any garage to preview location, draw route, or book</span>
              <span>Sorted by distance</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filteredGarages.map((garage) => (
                <div
                  key={garage.id}
                  onClick={() => {
                    setSelectedGarage(garage);
                    drawDirections(garage);
                  }}
                  className="cursor-pointer rounded-2xl border border-border/60 bg-background/80 p-3.5 transition hover:border-primary/60 hover:bg-muted/30 active:scale-[0.99] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-foreground truncate">{garage.name}</h3>
                      <span className="shrink-0 text-xs font-bold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                        {garage.distance}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {garage.mechanicName || garage.owner} · {garage.address}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {(Array.isArray(garage.services) ? garage.services : [garage.services || "General"])
                        .slice(0, 2)
                        .map((s, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px] py-0">
                            {s}
                          </Badge>
                        ))}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                    <span className="flex items-center gap-1 font-bold text-amber-500">
                      ★ {garage.rating || 4.9}
                    </span>
                    <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
                      View on Map &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. Location Permission Modal */}
      {showPermissionModal && (
        <LocationPermissionModal
          isOpen={showPermissionModal}
          onClose={() => setShowPermissionModal(false)}
          onEnable={async () => {
            await turnOnLocation();
            setShowPermissionModal(false);
          }}
          onUseIPLocation={async () => {
            await fetchIPLocation();
            setShowPermissionModal(false);
          }}
          permission={permission}
          error={locationError}
          deviceInfo={deviceInfo}
          loading={isLocating}
          onManualSelect={(lat, lng, name) => {
            setManualLocation(lat, lng, name);
            setShowPermissionModal(false);
          }}
        />
      )}
    </div>
  );
}
