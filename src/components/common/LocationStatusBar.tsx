import { MapPin, Navigation, RotateCcw, AlertTriangle, Wifi, Globe, Compass } from "lucide-react";
import type { UserLocation, LocationError } from "@/hooks/useLocation";

export interface LocationStatusBarProps {
  location?: UserLocation | null;
  accuracy?: number | null;
  loading?: boolean;
  error?: LocationError | null;
  permission?: string;
  tracking?: boolean;
  isManual?: boolean;
  onRequestPermission?: () => void;
  onRefreshLocation?: () => void;
  onLocate?: () => void;
  onOpenManualModal?: () => void;
  onOpenHubModal?: () => void;
  onUseIPLocation?: () => void;
  className?: string;
}

export function LocationStatusBar({
  location,
  accuracy,
  loading = false,
  error = null,
  permission = "unknown",
  tracking = false,
  isManual = false,
  onRequestPermission,
  onRefreshLocation,
  onLocate,
  onOpenManualModal,
  onOpenHubModal,
  className = "",
}: LocationStatusBarProps) {
  const triggerEnable = onRefreshLocation || onRequestPermission || onLocate;
  const triggerHubModal = onOpenManualModal || onOpenHubModal;

  const isGPS = location && location.source === "gps";
  const isIP = location && (location.source === "ip" || location.isIPFallback);
  const isManualHub = location && (location.isManual || isManual || location.source === "manual");
  const isDenied = permission === "denied" || error?.type === "DENIED";
  const isUnavailable = permission === "unavailable" || error?.type === "UNAVAILABLE";
  const isTimeout = error?.type === "TIMEOUT" || permission === "timeout";

  return (
    <div
      className={`card-elev flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/90 p-3 sm:p-3.5 text-xs backdrop-blur-md ${className}`}
    >
      {/* Left: Location indicator */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`grid size-8 place-items-center rounded-xl font-bold shrink-0 ${
            loading
              ? "bg-primary/15 text-primary"
              : isDenied || isUnavailable
              ? "bg-warning/20 text-warning"
              : isGPS
              ? "bg-success/20 text-success"
              : isIP
              ? "bg-cyan-500/20 text-cyan-400"
              : "bg-primary/15 text-primary"
          }`}
        >
          {loading ? (
            <Navigation className="size-4 animate-spin" />
          ) : isDenied || isUnavailable ? (
            <AlertTriangle className="size-4" />
          ) : isGPS ? (
            <MapPin className="size-4" />
          ) : isIP ? (
            <Wifi className="size-4" />
          ) : (
            <Globe className="size-4" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-foreground truncate max-w-[220px] sm:max-w-xs">
              {location?.name ||
                location?.address ||
                (location
                  ? `Coordinates: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                  : "Location Not Set")}
            </span>

            {isGPS && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-success/15 text-success border border-success/30">
                ±{accuracy || 10}m GPS Locked
              </span>
            )}

            {isIP && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                Network / City IP
              </span>
            )}

            {isManualHub && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/15 text-primary border border-primary/30">
                Selected Hub
              </span>
            )}

            {tracking && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/20 text-primary">
                ● Live Watch
              </span>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground truncate">
            {loading
              ? "Acquiring GPS / Network fix..."
              : isDenied
              ? "OS/Browser location blocked • Using IP or manual hub"
              : isUnavailable
              ? "Device GPS toggle is off • Using IP or manual hub"
              : isTimeout
              ? "GPS signal weak • Click Retry or change city"
              : isGPS
              ? `Live Hardware GPS • Lat ${location?.lat?.toFixed(4)}, Lng ${location?.lng?.toFixed(4)}`
              : isIP
              ? `Connected via Network Area • Lat ${location?.lat?.toFixed(4)}, Lng ${location?.lng?.toFixed(4)}`
              : `Active Dispatch Location • Lat ${location?.lat?.toFixed(3) || "37.774"}, Lng ${location?.lng?.toFixed(3) || "-122.419"}`}
          </p>
        </div>
      </div>

      {/* Right: Quick Location Actions */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end shrink-0">
        {triggerEnable && (!location || isDenied || isUnavailable) && (
          <button
            type="button"
            onClick={triggerEnable}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider grad-primary text-primary-foreground transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
          >
            {loading ? <Navigation className="size-3.5 animate-spin" /> : <Compass className="size-3.5" />}
            <span>{loading ? "Locating..." : "Turn On Location"}</span>
          </button>
        )}

        {triggerEnable && location && !isGPS && (
          <button
            type="button"
            onClick={triggerEnable}
            disabled={loading}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-success/15 hover:bg-success/25 text-success border border-success/30 transition flex items-center gap-1 cursor-pointer"
            title="Attempt hardware GPS fix"
          >
            <MapPin className="size-3.5" />
            <span className="hidden sm:inline">Use Hardware GPS</span>
          </button>
        )}

        {triggerHubModal && (
          <button
            type="button"
            onClick={triggerHubModal}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-foreground hover:bg-muted border border-border/60 transition cursor-pointer"
          >
            Change City
          </button>
        )}

        {triggerEnable && isGPS && (
          <button
            type="button"
            onClick={triggerEnable}
            disabled={loading}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition cursor-pointer"
            title="Recalibrate GPS"
          >
            <RotateCcw className={`size-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          </button>
        )}
      </div>
    </div>
  );
}

export default LocationStatusBar;
