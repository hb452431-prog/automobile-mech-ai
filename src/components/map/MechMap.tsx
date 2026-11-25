import { useEffect, useRef, useState } from "react";
import { Search, Navigation, Globe, X, Loader2, Compass, AlertTriangle, Star, Wrench, PhoneCall } from "lucide-react";
import { geocodingService, type LocationSearchResult } from "@/services/geocodingService";

export interface MapGarageItem {
  id: string;
  name: string;
  mechanicName?: string;
  owner?: string;
  phone?: string;
  address?: string;
  services?: string[] | string;
  rating?: number;
  reviewsCount?: number;
  reviewCount?: number;
  available?: boolean;
  isOpen247?: boolean;
  distance?: string;
  distanceKm?: number;
  lat: number;
  lng: number;
  hourlyRate?: number;
}

export interface MechMapProps {
  userLocation?: { lat: number; lng: number; address?: string; accuracy?: number; heading?: number } | null;
  garages?: MapGarageItem[];
  selectedGarage?: MapGarageItem | null;
  onSelectGarage?: (garage: MapGarageItem) => void;
  onRequestHelp?: (garage: MapGarageItem) => void;
  mechanicLocation?: { lat: number; lng: number } | null;
  mechanicInfo?: { name?: string; mechanicName?: string; garageName?: string; phone?: string; vehicle?: string } | null;
  routeCoordinates?: Array<[number, number]> | null;
  showRoute?: boolean;
  activeRouteInfo?: { distance?: string; eta?: string } | null;
  enableTrackingAnimation?: boolean;
  onLocate?: () => void;
  onSelectLocation?: (lat: number, lng: number, name: string) => void;
  isLocating?: boolean;
  locationError?: string | null;
  height?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  className?: string;
}

declare global {
  interface Window {
    L?: any;
  }
}

export function MechMap({
  userLocation = null,
  garages = [],
  selectedGarage = null,
  onSelectGarage,
  onRequestHelp,
  mechanicLocation = null,
  mechanicInfo = null,
  routeCoordinates = null,
  showRoute = false,
  activeRouteInfo = null,
  onLocate,
  onSelectLocation,
  isLocating: externalIsLocating,
  locationError: externalLocationError,
  height = "460px",
  initialCenter = [37.7749, -122.4194],
  initialZoom = 13,
  className = "",
}: MechMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const movingVehicleMarkerRef = useRef<any>(null);
  const hasAutoCenteredRef = useRef(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [routeStepIndex, setRouteStepIndex] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [internalIsLocating, setInternalIsLocating] = useState(false);
  const [internalLocationError, setInternalLocationError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<any>(null);

  const isLocating = externalIsLocating !== undefined ? externalIsLocating : internalIsLocating;
  const locationError = externalLocationError !== undefined ? externalLocationError : internalLocationError;

  // Keyframes for Google Maps Blue Pulse
  useEffect(() => {
    if (typeof document === "undefined") return;
    const styleId = "gmap-blue-dot-keyframes";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        @keyframes gmapRadarPulse {
          0% { transform: scale(0.35); opacity: 0.95; }
          70% { transform: scale(1.65); opacity: 0; }
          100% { transform: scale(1.65); opacity: 0; }
        }
        @keyframes vehicleTrackingPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.8)); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // 1. Dynamically load Leaflet assets on the client
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    // Load Leaflet CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapInstanceRef.current) return;
    const L = window.L;
    if (!L) return;

    const center = userLocation ? [userLocation.lat, userLocation.lng] : initialCenter;
    const map = L.map(mapContainerRef.current, {
      center,
      zoom: initialZoom,
      zoomControl: false,
    });

    // OpenStreetMap Free Tile Layer with required attribution
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add zoom control in bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {}
    }, 250);

    const onResize = () => {
      try {
        map.invalidateSize();
      } catch {}
    };
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [leafletLoaded]);

  // 3. Render Markers & Routes
  useEffect(() => {
    const L = window.L;
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const routeLayer = routeLayerRef.current;
    if (!L || !map || !markersLayer || !routeLayer) return;

    markersLayer.clearLayers();
    routeLayer.clearLayers();

    // A. User Marker - Authentic Google Maps Blue Dot with Radiating Pulse & Accuracy Ring
    if (userLocation && typeof userLocation.lat === "number" && typeof userLocation.lng === "number") {
      const accuracyRadius = Math.min(Math.max((userLocation as any).accuracy || 35, 15), 500);

      const accuracyCircle = L.circle([userLocation.lat, userLocation.lng], {
        radius: accuracyRadius,
        color: "#1a73e8",
        fillColor: "#4285f4",
        fillOpacity: 0.12,
        weight: 1,
      });
      markersLayer.addLayer(accuracyCircle);

      const userIcon = L.divIcon({
        className: "custom-user-marker",
        html: `
          <div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center;">
            <!-- Google Maps Radar Pulse Aura -->
            <div style="position:absolute; width:42px; height:42px; border-radius:50%; background:rgba(66, 133, 244, 0.38); animation:gmapRadarPulse 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;"></div>
            <!-- Outer soft glow circle -->
            <div style="position:absolute; width:26px; height:26px; border-radius:50%; background:rgba(66, 133, 244, 0.28);"></div>
            <!-- Core Google Maps solid blue GPS dot with white border & shadow -->
            <div style="position:relative; z-index:10; width:16px; height:16px; border-radius:50%; background:#1a73e8; border:2.5px solid #ffffff; box-shadow:0 1px 4px rgba(0,0,0,0.55);"></div>
            <!-- Live GPS label badge -->
            <span style="position:absolute; bottom:-16px; background:#0f172a; color:#ffffff; font-size:9px; font-weight:800; font-family:monospace; padding:1px 6px; border-radius:999px; border:1px solid rgba(255,255,255,0.3); box-shadow:0 2px 4px rgba(0,0,0,0.4); white-space:nowrap;">
              YOU (GPS ±${Math.round(accuracyRadius)}m)
            </span>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -22],
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 2000 });
      userMarker.bindPopup(`
        <div style="font-family:sans-serif; min-width:190px; padding:4px;">
          <div style="display:flex; align-items:center; gap:6px;">
            <div style="width:10px; height:10px; border-radius:50%; background:#1a73e8;"></div>
            <strong style="color:#1a73e8; font-size:13px;">Your Current Location</strong>
          </div>
          <p style="margin:4px 0 0; font-size:11px; color:#475569;">GPS live lock active. Tracking nearby certified garages.</p>
          <div style="margin-top:6px; font-size:10px; color:#64748b; font-family:monospace; background:#f1f5f9; padding:4px 6px; border-radius:4px;">
            ${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)} · ±${Math.round(accuracyRadius)}m accuracy
          </div>
        </div>
      `);
      markersLayer.addLayer(userMarker);
    }

    // Expose global action handlers for popup buttons
    (window as any).__mechMapSelect = (id: string) => {
      const g = garages.find((x) => x.id === id);
      if (g && onSelectGarage) onSelectGarage(g);
    };
    (window as any).__mechMapRequest = (id: string) => {
      const g = garages.find((x) => x.id === id);
      if (g && onRequestHelp) onRequestHelp(g);
    };

    // B. Garage Markers
    garages.forEach((garage) => {
      if (typeof garage.lat !== "number" || typeof garage.lng !== "number") return;
      const isSelected = selectedGarage?.id === garage.id;
      const size = isSelected ? 40 : 32;
      const bg = isSelected ? "#f97316" : "#0f172a";
      const border = isSelected ? "#fed7aa" : "#38bdf8";
      const rating = garage.rating || 4.8;

      const garageIcon = L.divIcon({
        className: "custom-garage-marker",
        html: `
          <div style="position:relative; width:${size}px; height:${size}px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
            <div style="width:${size}px; height:${size}px; border-radius:50%; background:${bg}; border:2.5px solid ${border}; box-shadow:0 4px 12px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; color:#ffffff; font-size:14px;">
              🔧
            </div>
            <span style="position:absolute; top:-5px; right:-5px; background:#f59e0b; color:#0f172a; font-size:8px; font-weight:900; font-family:monospace; padding:1px 4px; border-radius:999px; border:1px solid #ffffff;">
              ★${rating}
            </span>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2 - 4],
      });

      const marker = L.marker([garage.lat, garage.lng], { icon: garageIcon });
      const servicesText = Array.isArray(garage.services) ? garage.services.join(" • ") : garage.services || "General Automotive Repair";

      marker.bindPopup(`
        <div style="font-family:sans-serif; min-width:210px; padding:4px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="font-size:13px; color:#0f172a;">${garage.name}</strong>
            <span style="background:#fef3c7; color:#b45309; font-size:10px; font-weight:bold; padding:2px 6px; border-radius:4px;">★ ${rating}</span>
          </div>
          <p style="margin:4px 0 0; font-size:11px; color:#64748b;">${garage.address || "Certified Partner Workshop"}</p>
          <div style="margin:6px 0; background:#f8fafc; padding:6px; border-radius:6px; border:1px solid #e2e8f0; font-size:11px; color:#334155;">
            <span style="font-size:9px; text-transform:uppercase; font-weight:bold; color:#94a3b8; display:block;">Services:</span>
            ${servicesText}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
            <span style="font-size:10px; font-weight:bold; color:#2563eb;">📍 ${garage.distance || `${garage.distanceKm || 1.8} km away`}</span>
            <span style="font-size:10px; font-weight:bold; color:#16a34a;">● ${garage.isOpen247 ? "24/7 Open" : "Open Now"}</span>
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px;">
            <button
              type="button"
              onclick="window.__mechMapSelect && window.__mechMapSelect('${garage.id}')"
              style="padding: 6px 8px; background: #f1f5f9; color: #0f172a; font-size: 11px; font-weight: bold; border-radius: 6px; border: 1px solid #cbd5e1; cursor: pointer;"
            >
              View Details
            </button>
            <button
              type="button"
              onclick="window.__mechMapRequest && window.__mechMapRequest('${garage.id}')"
              style="padding: 6px 8px; background: linear-gradient(135deg, #ea580c, #c2410c); color: #ffffff; font-size: 11px; font-weight: bold; border-radius: 6px; border: none; cursor: pointer;"
            >
              Request Help
            </button>
          </div>
        </div>
      `);

      marker.on("click", () => {
        if (onSelectGarage) onSelectGarage(garage);
      });

      markersLayer.addLayer(marker);
    });

    // C. Assigned Mechanic Mobile Unit Marker
    if (mechanicLocation && typeof mechanicLocation.lat === "number" && typeof mechanicLocation.lng === "number") {
      const mechIcon = L.divIcon({
        className: "custom-mechanic-marker",
        html: `
          <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
            <span style="position:absolute; width:100%; height:100%; border-radius:50%; background:rgba(234, 88, 12, 0.45); animation:ping 1.4s infinite;"></span>
            <div style="position:relative; z-index:10; width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg, #ea580c, #c2410c); border:3px solid #fed7aa; box-shadow:0 0 16px rgba(234,88,12,0.8); display:flex; align-items:center; justify-content:center; color:#ffffff; font-size:16px;">
              🚐
            </div>
            <span style="position:absolute; bottom:-16px; background:#7c2d12; color:#fed7aa; font-size:9px; font-weight:900; font-family:monospace; padding:1px 5px; border-radius:999px; border:1px solid rgba(254,215,170,0.5); white-space:nowrap;">
              ${mechanicInfo?.name || mechanicInfo?.mechanicName || "MOBILE UNIT"}
            </span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -22],
      });

      const mechMarker = L.marker([mechanicLocation.lat, mechanicLocation.lng], { icon: mechIcon });
      mechMarker.bindPopup(`
        <div style="font-family:sans-serif; min-width:180px; padding:4px;">
          <strong style="color:#ea580c; font-size:13px;">🚐 Mobile Rescue Unit</strong>
          <p style="margin:3px 0 0; font-size:11px; font-weight:bold;">${mechanicInfo?.garageName || "RapidRescue 24/7 Mobile Workshop"}</p>
          <p style="margin:2px 0 0; font-size:11px; color:#64748b;">Tech: ${mechanicInfo?.mechanicName || "Dave Miller"}</p>
          ${activeRouteInfo?.eta ? `<p style="margin:6px 0 0; font-size:11px; font-weight:bold; color:#16a34a; background:#f0fdf4; padding:4px; border-radius:4px;">ETA: ~${activeRouteInfo.eta}</p>` : ""}
        </div>
      `);
      markersLayer.addLayer(mechMarker);
    }

    // D. Route Polyline
    if (showRoute && routeCoordinates && routeCoordinates.length >= 2) {
      // Glow background line
      L.polyline(routeCoordinates, {
        color: "#ea580c",
        weight: 8,
        opacity: 0.35,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(routeLayer);

      // Foreground dashed line
      L.polyline(routeCoordinates, {
        color: "#2563eb",
        weight: 5,
        opacity: 0.9,
        dashArray: "8, 8",
        lineCap: "round",
        lineJoin: "round",
      }).addTo(routeLayer);

      // Fit bounds smoothly to show entire route
      try {
        map.fitBounds(routeCoordinates, { padding: [50, 50], maxZoom: 16, animate: true });
      } catch {}
    } else if (selectedGarage) {
      map.flyTo([selectedGarage.lat, selectedGarage.lng], 15, { duration: 1.2 });
    } else if (userLocation && !hasAutoCenteredRef.current) {
      hasAutoCenteredRef.current = true;
      map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1.2 });
    }
  }, [leafletLoaded, userLocation, garages, selectedGarage, mechanicLocation, mechanicInfo, routeCoordinates, showRoute, activeRouteInfo]);

  // Live vehicle position tracking animation along routeCoordinates
  useEffect(() => {
    if (!showRoute || !routeCoordinates || routeCoordinates.length < 2 || !window.L || !routeLayerRef.current) {
      if (movingVehicleMarkerRef.current && routeLayerRef.current) {
        try {
          routeLayerRef.current.removeLayer(movingVehicleMarkerRef.current);
        } catch {}
        movingVehicleMarkerRef.current = null;
      }
      return;
    }

    const L = window.L;
    const pts = routeCoordinates;
    let step = 0;

    const vehicleIcon = L.divIcon({
      className: "custom-tracking-vehicle",
      html: `
        <div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center; animation:vehicleTrackingPulse 1.8s infinite;">
          <div style="width:32px; height:32px; border-radius:50%; background:#ea580c; border:2px solid #ffffff; box-shadow:0 0 14px rgba(234,88,12,0.95); display:flex; align-items:center; justify-content:center; font-size:15px; color:#ffffff;">
            🚐
          </div>
          <span style="position:absolute; top:-14px; background:#ea580c; color:#ffffff; font-size:8px; font-weight:900; font-family:monospace; padding:1px 5px; border-radius:999px; border:1px solid #ffffff; white-space:nowrap;">
            LIVE TRACKING
          </span>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const marker = L.marker(pts[0], { icon: vehicleIcon, zIndexOffset: 3000 });
    marker.addTo(routeLayerRef.current);
    movingVehicleMarkerRef.current = marker;

    const interval = setInterval(() => {
      step = (step + 1) % pts.length;
      marker.setLatLng(pts[step]);
    }, 1200);

    return () => {
      clearInterval(interval);
      if (movingVehicleMarkerRef.current && routeLayerRef.current) {
        try {
          routeLayerRef.current.removeLayer(movingVehicleMarkerRef.current);
        } catch {}
        movingVehicleMarkerRef.current = null;
      }
    };
  }, [showRoute, routeCoordinates]);

  // Debounced geocoding search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await geocodingService.searchLocation(searchQuery);
        setSuggestions(results);
        setShowDropdown(true);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const handleSelectSuggestion = (item: LocationSearchResult) => {
    setSearchQuery(item.shortName || item.displayName);
    setShowDropdown(false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([item.lat, item.lng], 14, { duration: 1.2 });
    }
    if (onSelectLocation) {
      onSelectLocation(item.lat, item.lng, item.displayName);
    }
  };

  const handleTriggerLocate = () => {
    if (onLocate) {
      onLocate();
      return;
    }
    if (navigator.geolocation) {
      setInternalIsLocating(true);
      setInternalLocationError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setInternalIsLocating(false);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([pos.coords.latitude, pos.coords.longitude], 14, { duration: 1.2 });
          }
        },
        (err) => {
          setInternalIsLocating(false);
          setInternalLocationError(err.message || "Location permission denied");
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const handleResetWorld = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([20, 0], 2, { duration: 1.4 });
    }
  };

  return (
    <div
      className={`card-elev relative w-full overflow-hidden rounded-2xl border border-border/60 bg-card ${className}`}
      style={{ height }}
    >
      {/* Floating Search & Map Controls */}
      <div className="pointer-events-none absolute left-3 right-3 top-3 z-[1000] flex flex-col gap-2">
        <div className="pointer-events-auto flex w-full max-w-md items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <div className="card-elev flex items-center rounded-xl border border-border/60 bg-background/90 px-3 py-2 text-xs backdrop-blur-md transition focus-within:ring-2 focus-within:ring-primary">
              <Search className="mr-2 size-3.5 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                placeholder="Search city, address, or landmark..."
                className="w-full bg-transparent text-xs text-foreground placeholder-muted-foreground outline-none"
              />
              {isSearching && <Loader2 className="size-3.5 animate-spin text-primary shrink-0" />}
              {searchQuery && !isSearching && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSuggestions([]);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div className="card-elev absolute left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-border/60 bg-background/95 py-1 backdrop-blur-md z-[1001]">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="flex w-full items-start gap-2 border-b border-border/40 px-3 py-2 text-left text-xs transition hover:bg-muted last:border-b-0"
                  >
                    <Compass className="mt-0.5 size-3.5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">{item.shortName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{item.displayName}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* GPS Locate Button */}
          <button
            type="button"
            onClick={handleTriggerLocate}
            disabled={isLocating}
            title="Locate me (GPS)"
            className="card-elev flex size-9 items-center justify-center rounded-xl border border-border/60 bg-background/90 text-primary backdrop-blur-md transition hover:bg-background active:scale-95 shrink-0"
          >
            {isLocating ? <Loader2 className="size-4 animate-spin" /> : <Navigation className="size-4" />}
          </button>

          {/* Reset World View */}
          <button
            type="button"
            onClick={handleResetWorld}
            title="Reset map view"
            className="card-elev hidden sm:flex size-9 items-center justify-center rounded-xl border border-border/60 bg-background/90 text-muted-foreground backdrop-blur-md transition hover:text-foreground active:scale-95 shrink-0"
          >
            <Globe className="size-4" />
          </button>
        </div>

        {/* Location Error Warning Pill */}
        {locationError && (
          <div className="pointer-events-auto flex max-w-md items-center justify-between rounded-xl border border-warning/40 bg-warning/15 px-3 py-2 text-xs text-warning backdrop-blur-md">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="size-4 shrink-0" />
              <span className="text-[11px] font-medium">{locationError}</span>
            </div>
            <button
              type="button"
              onClick={handleTriggerLocate}
              className="rounded-lg bg-warning px-2 py-0.5 text-[10px] font-bold uppercase text-slate-950"
            >
              Retry
            </button>
          </div>
        )}

        {/* Active Route HUD Badge with Google Maps Launcher */}
        {activeRouteInfo && (
          <div className="card-elev pointer-events-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/95 p-3 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/20 text-primary font-bold text-lg">
                🚐
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-success animate-ping" />
                  <span className="text-xs font-bold text-foreground">Live Roadside Tracking</span>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono">
                  Dist: <strong className="text-foreground">{activeRouteInfo.distance}</strong> · ETA: <strong className="text-primary">{activeRouteInfo.eta}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!userLocation) return;
                const destLat = selectedGarage ? selectedGarage.lat : mechanicLocation ? mechanicLocation.lat : userLocation.lat;
                const destLng = selectedGarage ? selectedGarage.lng : mechanicLocation ? mechanicLocation.lng : userLocation.lng;
                window.open(
                  `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destLat},${destLng}&travelmode=driving`,
                  "_blank"
                );
              }}
              className="flex items-center gap-1 rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition cursor-pointer shrink-0"
              title="Launch native navigation in Google Maps"
            >
              <span>Google Maps ↗</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Google Maps Style "Recenter My Location" Button (Bottom Right) */}
      <div className="pointer-events-none absolute bottom-5 right-3 z-[1000] flex flex-col items-end gap-2">
        {userLocation && (
          <div className="pointer-events-auto hidden sm:flex items-center gap-1.5 rounded-full border border-border/60 bg-card/95 px-3 py-1 text-[11px] font-semibold text-primary shadow-xl backdrop-blur-md">
            <span className="size-2 rounded-full bg-primary animate-ping" />
            <span>GPS Locked (±{Math.round((userLocation as any).accuracy || 15)}m)</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            if (userLocation && mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 15, { animate: true, duration: 1 });
            }
            if (onLocate) onLocate();
            else handleTriggerLocate();
          }}
          title="Recenter Map to Your Current GPS Location"
          className="pointer-events-auto flex size-11 items-center justify-center rounded-full border border-border/60 bg-card/95 text-foreground shadow-2xl backdrop-blur-md transition hover:bg-muted hover:text-primary active:scale-95 cursor-pointer"
        >
          <Navigation className={`size-5 ${isLocating ? "animate-spin text-primary" : "text-primary fill-primary/25"}`} />
        </button>
      </div>

      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="size-full z-0" />
    </div>
  );
}

export default MechMap;
