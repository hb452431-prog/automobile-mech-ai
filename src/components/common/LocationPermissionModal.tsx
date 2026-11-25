import { useState } from "react";
import { 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  Search, 
  X, 
  Laptop, 
  Compass, 
  Wifi, 
  CheckCircle2 
} from "lucide-react";
import { geocodingService, type LocationSearchResult } from "@/services/geocodingService";
import type { DeviceInfo, LocationError } from "@/hooks/useLocation";
import { Button } from "@/components/ui/button";

export interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnable?: () => Promise<any> | void;
  onGrant?: () => Promise<any> | void;
  onRequestPermission?: () => Promise<any> | void;
  onUseIPLocation?: () => Promise<any> | void;
  onManualSelect?: (lat: number, lng: number, name: string) => void;
  onSelectManualLocation?: (loc: { lat: number; lng: number; name: string; address?: string }) => void;
  error?: LocationError | null;
  permission?: string;
  loading?: boolean;
  deviceInfo?: Partial<DeviceInfo>;
}

export function LocationPermissionModal({
  isOpen,
  onClose,
  onEnable,
  onGrant,
  onRequestPermission,
  onUseIPLocation,
  onManualSelect,
  onSelectManualLocation,
  error,
  permission = "prompt",
  loading = false,
  deviceInfo = {},
}: LocationPermissionModalProps) {
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activeTab, setActiveTab] = useState<"windows" | "mac" | "mobile">(
    deviceInfo?.isWindows ? "windows" : deviceInfo?.isMac ? "mac" : "windows"
  );

  if (!isOpen) return null;

  const popularHubs = [
    { name: "San Francisco, Downtown", lat: 37.7749, lng: -122.4194 },
    { name: "Bengaluru, Central Hub", lat: 12.9716, lng: 77.5946 },
    { name: "Mumbai, Commercial Plaza", lat: 19.076, lng: 72.8777 },
    { name: "New Delhi, Connaught Place", lat: 28.6139, lng: 77.209 },
    { name: "New York, Manhattan", lat: 40.7128, lng: -74.006 },
    { name: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
    { name: "London, Central City", lat: 51.5074, lng: -0.1278 },
    { name: "Tokyo, Shibuya", lat: 35.6762, lng: 139.6503 },
  ];

  const handleEnableClick = async () => {
    setIsActivating(true);
    const triggerFn = onEnable || onGrant || onRequestPermission;
    if (triggerFn) {
      try {
        await triggerFn();
        onClose();
      } catch {
        // Modal displays error state
      } finally {
        setIsActivating(false);
      }
    } else {
      setIsActivating(false);
      onClose();
    }
  };

  const handleIPLocationClick = async () => {
    setIsActivating(true);
    if (onUseIPLocation) {
      try {
        await onUseIPLocation();
        onClose();
      } catch {
      } finally {
        setIsActivating(false);
      }
    } else if (onRequestPermission) {
      try {
        await onRequestPermission();
        onClose();
      } catch {
      } finally {
        setIsActivating(false);
      }
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery || searchQuery.trim().length < 2) return;

    setIsSearching(true);
    try {
      const results = await geocodingService.searchLocation(searchQuery);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectHub = (hub: { lat: number; lng: number; name?: string; displayName?: string; address?: string }) => {
    const hubName = hub.name || hub.displayName || "Selected Location";
    if (onManualSelect) {
      onManualSelect(hub.lat, hub.lng, hubName);
    }
    if (onSelectManualLocation) {
      onSelectManualLocation({
        lat: hub.lat,
        lng: hub.lng,
        name: hubName,
        address: hub.address || hubName,
      });
    }
    onClose();
  };

  const isDenied = permission === "denied" || error?.type === "DENIED";
  const isUnavailable = permission === "unavailable" || error?.type === "UNAVAILABLE";
  const isTimeout = error?.type === "TIMEOUT" || permission === "timeout";
  const showLoading = loading || isActivating;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="card-elev max-w-lg w-full p-5 sm:p-7 shadow-2xl space-y-5 relative rounded-3xl border border-border/80 bg-card overflow-hidden max-h-[90dvh] overflow-y-auto">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 size-48 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
          title="Close"
        >
          <X className="size-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center space-y-2 pt-1">
          <div className="size-14 mx-auto rounded-2xl grad-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25 relative group">
            {showLoading ? (
              <Navigation className="size-7 animate-spin text-primary-foreground" />
            ) : isDenied || isUnavailable ? (
              <AlertTriangle className="size-7 text-warning animate-pulse" />
            ) : (
              <MapPin className="size-7 text-primary-foreground" />
            )}
            <span className="absolute -bottom-1 -right-1 size-3.5 bg-success border-2 border-background rounded-full" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-primary bg-primary/15 px-3 py-0.5 rounded-full border border-primary/30">
              GPS & System Location Setup
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {isDenied
                ? "Location Access Blocked"
                : isUnavailable
                ? "Operating System GPS Is Off"
                : isTimeout
                ? "GPS Signal Acquisition"
                : "Turn On Location Access"}
            </h2>
          </div>
        </div>

        {/* CASE: City Search & Manual Selection View */}
        {showManualSearch ? (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter city, area, or landmark..."
                className="w-full bg-muted/40 text-foreground px-3.5 py-2.5 rounded-xl border border-border/60 text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
              />
              <Button type="submit" disabled={isSearching} size="sm" className="grad-primary text-primary-foreground">
                <Search className="size-3.5 mr-1" />
                <span>{isSearching ? "Searching..." : "Search"}</span>
              </Button>
            </form>

            {/* Custom Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto border border-primary/30 rounded-xl p-2 bg-primary/5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary font-mono">
                  Search Results ({searchResults.length}):
                </p>
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectHub(item)}
                    className="w-full text-left p-2.5 rounded-lg bg-card hover:bg-muted border border-border/40 transition flex items-center justify-between group"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-foreground truncate">{item.shortName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{item.displayName}</p>
                    </div>
                    <span className="text-[10px] font-bold text-primary font-mono bg-primary/10 px-2 py-0.5 rounded border border-primary/20 shrink-0">
                      Select
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                Popular Garage Dispatch Hubs:
              </p>
              {popularHubs.map((hub) => (
                <button
                  key={hub.name}
                  type="button"
                  onClick={() => handleSelectHub(hub)}
                  className="w-full text-left p-2.5 rounded-xl bg-muted/30 hover:bg-muted/70 border border-border/60 transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="size-4 text-primary group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-xs font-bold text-foreground">{hub.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Lat: {hub.lat.toFixed(4)}, Lng: {hub.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-primary font-mono bg-card px-2 py-0.5 rounded border border-border/60">
                    Select
                  </span>
                </button>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setShowManualSearch(false)}
              className="w-full text-xs font-bold"
            >
              Back to GPS Setup
            </Button>
          </div>
        ) : (
          /* Main Permission Cases & Troubleshooting */
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center leading-relaxed">
              MECH CONNECT AI uses your coordinates to dispatch nearby certified mechanics, compute live arrival ETAs, and power roadside SOS rescue.
            </p>

            {/* Operating System Specific Guide */}
            {(isDenied || isUnavailable) && (
              <div className="bg-muted/30 rounded-2xl p-3.5 border border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-foreground font-mono flex items-center gap-1.5">
                    <Laptop className="size-3.5 text-primary" />
                    <span>How to Enable on Your OS:</span>
                  </span>

                  {/* OS Selector Tabs */}
                  <div className="flex bg-muted p-0.5 rounded-lg text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setActiveTab("windows")}
                      className={`px-2 py-0.5 rounded ${activeTab === "windows" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                    >
                      Windows
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("mac")}
                      className={`px-2 py-0.5 rounded ${activeTab === "mac" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                    >
                      Mac
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("mobile")}
                      className={`px-2 py-0.5 rounded ${activeTab === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                    >
                      Phone
                    </button>
                  </div>
                </div>

                {activeTab === "windows" && (
                  <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-muted-foreground">
                    <li>
                      Press <kbd className="px-1.5 py-0.5 bg-card border border-border/60 rounded text-[10px] font-mono text-foreground">Win + I</kbd> to open Windows Settings.
                    </li>
                    <li>
                      Click <strong>Privacy & security</strong> &rarr; <strong>Location</strong>.
                    </li>
                    <li>
                      Turn <strong className="text-success">ON</strong> <em>Location services</em> and <em>Let desktop apps access your location</em>.
                    </li>
                    <li>
                      In your browser, click the lock icon in the URL bar &rarr; Set Location to <strong>Allow</strong>.
                    </li>
                  </ol>
                )}

                {activeTab === "mac" && (
                  <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-muted-foreground">
                    <li>Open <strong>System Settings</strong> (Apple Menu &rarr; System Settings).</li>
                    <li>Click <strong>Privacy & Security</strong> &rarr; <strong>Location Services</strong>.</li>
                    <li>Turn <strong className="text-success">ON</strong> Location Services and check your browser.</li>
                  </ol>
                )}

                {activeTab === "mobile" && (
                  <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-muted-foreground">
                    <li>Swipe down notification shade / control center and turn <strong>ON Location / GPS</strong>.</li>
                    <li>In browser, tap the site settings lock icon &rarr; <strong>Allow Location</strong>.</li>
                  </ol>
                )}
              </div>
            )}

            {/* Action Buttons Hub */}
            <div className="space-y-2.5 pt-1">
              <Button
                type="button"
                onClick={handleEnableClick}
                disabled={showLoading}
                className="w-full grad-primary text-primary-foreground py-5 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
              >
                {showLoading ? (
                  <>
                    <Navigation className="size-4 animate-spin" />
                    <span>Detecting GPS Coordinates...</span>
                  </>
                ) : (
                  <>
                    <Compass className="size-4" />
                    <span>{isDenied || isUnavailable ? "Retry Hardware GPS" : "Enable Real GPS Location"}</span>
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={handleIPLocationClick}
                disabled={showLoading}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-success/15 hover:bg-success/25 text-success border border-success/30 flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
              >
                <Wifi className="size-4 text-success" />
                <span>Turn On via Network / IP Location (Instant Free)</span>
              </button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowManualSearch(true)}
                className="w-full text-xs font-bold"
              >
                <Search className="size-3.5 mr-1.5" />
                <span>Search City or Select Garage Hub</span>
              </Button>
            </div>
          </div>
        )}

        {/* Footer Security Note */}
        <p className="text-[11px] text-muted-foreground text-center font-mono">
          🔒 Secure SSL Geolocation • Coordinates are strictly used for nearest workshop dispatch and roadside rescue.
        </p>
      </div>
    </div>
  );
}

export default LocationPermissionModal;
