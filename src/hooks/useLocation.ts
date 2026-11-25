import { useState, useEffect, useCallback, useRef } from "react";
import { ipLocationService } from "@/services/ipLocationService";

const LOCATION_STORAGE_KEY = "mech_connect_active_location";

export interface DeviceInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWindows: boolean;
  isMac: boolean;
  isLinux: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isEdge: boolean;
  isFirefox: boolean;
  isSecureContext: boolean;
  osName: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number;
  isManual?: boolean;
  isIPFallback?: boolean;
  source?: "gps" | "network" | "ip" | "manual";
  address?: string;
  name?: string;
}

export interface LocationError {
  type: "DENIED" | "UNAVAILABLE" | "TIMEOUT" | "UNSUPPORTED" | "UNKNOWN";
  code: number;
  message: string;
  actionable?: string;
  osInstructions?: string;
  raw?: string;
}

/**
 * Detect client device, operating system, and browser environment
 */
export const getDeviceInfo = (): DeviceInfo => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      isWindows: false,
      isMac: false,
      isLinux: false,
      isSafari: false,
      isChrome: false,
      isEdge: false,
      isFirefox: false,
      isSecureContext: true,
      osName: "Desktop",
    };
  }

  const ua = navigator.userAgent || "";
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || "";

  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isMobile = isIOS || isAndroid || /Mobi|Tablet|iPad/.test(ua);

  const isWindows = /Win/i.test(platform) || /Windows/i.test(ua);
  const isMac = (/Mac/i.test(platform) || /Macintosh/i.test(ua)) && !isIOS;
  const isLinux = /Linux/i.test(platform) && !isAndroid;

  const isEdge = /Edg\//.test(ua);
  const isChrome = /Chrome\//.test(ua) && !isEdge;
  const isSafari = /Safari\//.test(ua) && !isChrome && !isEdge;
  const isFirefox = /Firefox\//.test(ua);

  const isSecureContext = typeof window.isSecureContext === "boolean" ? window.isSecureContext : true;

  let osName = "Desktop";
  if (isWindows) osName = "Windows";
  else if (isMac) osName = "macOS";
  else if (isIOS) osName = "iOS";
  else if (isAndroid) osName = "Android";
  else if (isLinux) osName = "Linux";

  return {
    isMobile,
    isIOS,
    isAndroid,
    isWindows,
    isMac,
    isLinux,
    isSafari,
    isChrome,
    isEdge,
    isFirefox,
    isSecureContext,
    osName,
  };
};

export const DEFAULT_FALLBACK_LOCATION: UserLocation = {
  lat: 37.7749,
  lng: -122.4194,
  accuracy: 15,
  name: "San Francisco, CA (Default Hub)",
  address: "Market St & 7th St, San Francisco, CA",
  isManual: true,
  source: "manual",
};

export interface UseLocationOptions {
  autoRequest?: boolean;
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
  allowIPFallback?: boolean;
}

/**
 * useLocation - Robust Multi-Platform Location Hook for Driver & Mechanic Portals
 */
export function useLocation({
  autoRequest = false,
  enableHighAccuracy = true,
  timeout = 10000,
  maximumAge = 0,
  watch = false,
  allowIPFallback = true,
}: UseLocationOptions = {}) {
  // Initialize from sessionStorage if available
  const [location, setLocation] = useState<UserLocation | null>(() => {
    if (typeof sessionStorage !== "undefined") {
      try {
        const saved = sessionStorage.getItem(LOCATION_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.lat === "number" && typeof parsed.lng === "number") {
            return parsed;
          }
        }
      } catch {}
    }
    return null;
  });

  const [accuracy, setAccuracy] = useState<number | null>(location?.accuracy || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LocationError | null>(null);
  const [permission, setPermission] = useState<
    "unknown" | "prompt" | "granted" | "denied" | "unavailable" | "unsupported" | "timeout" | "ip-fallback"
  >("unknown");
  const [tracking, setTracking] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const hasGpsFixRef = useRef(false);
  const deviceInfo = useRef(getDeviceInfo()).current;

  const supported = typeof navigator !== "undefined" && "geolocation" in navigator;

  // Persist location updates to session storage
  const saveLocationState = useCallback((loc: UserLocation) => {
    if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
      try {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(loc));
        }
      } catch {}
    }
  }, []);

  // Initialize permission state
  useEffect(() => {
    isMountedRef.current = true;

    if (!supported) {
      setPermission("unsupported");
      setError({
        type: "UNSUPPORTED",
        code: 0,
        message: "Location services are not supported by this browser.",
        actionable: "Please enter your location manually or use a modern browser.",
      });
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      try {
        navigator.permissions
          .query({ name: "geolocation" as any })
          .then((status) => {
            if (!isMountedRef.current) return;
            setPermission(status.state as any);

            status.onchange = () => {
              if (!isMountedRef.current) return;
              setPermission(status.state as any);
              if (status.state === "granted") {
                requestLocation();
              }
            };
          })
          .catch(() => {
            setPermission("prompt");
          });
      } catch {
        setPermission("prompt");
      }
    } else {
      setPermission("prompt");
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [supported]);

  const handleSuccess = useCallback(
    (pos: GeolocationPosition, source: "gps" | "network" = "gps") => {
      if (!isMountedRef.current) return;
      hasGpsFixRef.current = true;

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const acc = Math.round(pos.coords.accuracy || 10);

      const coords: UserLocation = {
        lat,
        lng,
        accuracy: acc,
        altitude: pos.coords.altitude,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
        timestamp: pos.timestamp,
        isManual: false,
        isIPFallback: false,
        source,
        address: `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        name: source === "gps" ? `GPS Location (±${acc}m)` : `Network Location (±${acc}m)`,
      };

      setLocation(coords);
      setAccuracy(acc);
      setLoading(false);
      setError(null);
      setPermission("granted");
      saveLocationState(coords);
    },
    [saveLocationState]
  );

  const handleError = useCallback(
    (err: GeolocationPositionError): LocationError => {
      if (!isMountedRef.current) {
        return { type: "UNKNOWN", code: err.code || 0, message: err.message };
      }

      setLoading(false);

      let errorType: LocationError["type"] = "UNKNOWN";
      let message = "Unable to determine your GPS location.";
      let actionable = "Please check your device settings or enter location manually.";
      let osInstructions = "";

      if (err.code === 1) {
        errorType = "DENIED";
        setPermission("denied");
        message = "Location access is blocked by your browser or operating system.";

        if (deviceInfo.isWindows) {
          actionable =
            '1. Click the lock/settings icon in the browser address bar and set Location to "Allow".\n2. Open Windows Settings → Privacy & Security → Location → Turn ON "Location services" and "Let desktop apps access your location".';
          osInstructions = "Windows Settings: Win + I → Privacy & security → Location → Turn ON Location services.";
        } else if (deviceInfo.isMac) {
          actionable =
            "1. Click the site settings icon in the address bar → Allow Location.\n2. Open System Settings → Privacy & Security → Location Services → Turn ON for your browser.";
          osInstructions = "macOS: Apple Menu → System Settings → Privacy & Security → Location Services.";
        } else if (deviceInfo.isIOS) {
          actionable = 'Open iOS Settings → Safari (or Chrome) → Location → set to "Allow", then tap Try Again.';
          osInstructions = "iOS Settings → Privacy & Security → Location Services → Safari Websites → While Using the App.";
        } else if (deviceInfo.isAndroid) {
          actionable =
            'Tap the lock icon in Chrome address bar → Site Settings → Location → set to "Allow", and ensure phone GPS toggle is ON.';
          osInstructions = "Android: Pull down notification shade → Turn on Location.";
        } else {
          actionable = "Click the site lock/settings icon in your browser address bar and enable Location access.";
          osInstructions = "Check browser and system location permissions.";
        }
      } else if (err.code === 2) {
        errorType = "UNAVAILABLE";
        setPermission("unavailable");
        message = "Operating system Location Services appear to be turned off.";

        if (deviceInfo.isWindows) {
          actionable = 'Open Windows Settings (Win + I) → Privacy & Security → Location → Turn ON "Location services".';
          osInstructions = 'Press Win + I → Privacy & Security → Location → Turn ON "Location services".';
        } else if (deviceInfo.isMac) {
          actionable = "Open System Settings → Privacy & Security → Location Services → Turn ON Location Services.";
          osInstructions = "Apple Menu → System Settings → Privacy & Security → Location Services.";
        } else if (deviceInfo.isMobile) {
          actionable = "Please pull down your device quick settings menu and turn ON Location / GPS.";
          osInstructions = "Turn ON device Location toggle in settings.";
        } else {
          actionable = "Please enable GPS / Location Services in your computer system settings and tap Retry.";
          osInstructions = "Enable operating system location services.";
        }
      } else if (err.code === 3) {
        errorType = "TIMEOUT";
        setPermission("timeout");
        message = "GPS signal acquisition timed out.";
        actionable = "We couldn’t get a clear satellite GPS fix. Connected via network/IP location or tap Retry.";
        osInstructions = "Try moving to an area with clearer signal or use WiFi network location.";
      }

      const errObj: LocationError = {
        type: errorType,
        code: err.code || 0,
        message,
        actionable,
        osInstructions,
        raw: err.message,
      };

      setError(errObj);
      return errObj;
    },
    [deviceInfo]
  );

  const fetchIPLocation = useCallback(async (): Promise<UserLocation | null> => {
    if (!isMountedRef.current) return null;
    setLoading(true);

    try {
      const ipData = await ipLocationService.getIPLocation();
      if (!isMountedRef.current) return null;

      if (ipData && typeof ipData.lat === "number" && typeof ipData.lng === "number") {
        const coords: UserLocation = {
          lat: ipData.lat,
          lng: ipData.lng,
          accuracy: ipData.accuracy || 3000,
          timestamp: Date.now(),
          isManual: false,
          isIPFallback: true,
          source: "ip",
          address: ipData.address || `${ipData.city || "Detected Region"}, ${ipData.region || ""}`,
          name: `${ipData.city || "Detected City"} (${ipData.region || ipData.country || "Network"})`,
        };

        setLocation(coords);
        setAccuracy(coords.accuracy || 3000);
        setLoading(false);
        setPermission("ip-fallback");
        saveLocationState(coords);
        return coords;
      }
    } catch {}

    if (isMountedRef.current) {
      setLoading(false);
    }
    return null;
  }, [saveLocationState]);

  const requestLocation = useCallback(
    async (customOptions: Partial<UseLocationOptions> = {}): Promise<any> => {
      if (!supported) {
        const ipResult = await fetchIPLocation();
        if (ipResult) return ipResult;

        const unsuppErr: LocationError = {
          type: "UNSUPPORTED",
          code: 0,
          message: "Geolocation is not supported by your browser.",
          actionable: "Please use a modern browser or set your location manually.",
        };
        setError(unsuppErr);
        setPermission("unsupported");
        return Promise.reject(new Error("Geolocation unsupported"));
      }

      setLoading(true);
      setError(null);

      const isHigh = customOptions.enableHighAccuracy ?? enableHighAccuracy;
      const reqTimeout = customOptions.timeout ?? timeout;
      const reqMaxAge = customOptions.maximumAge ?? maximumAge;
      const shouldFallbackIP = customOptions.allowIPFallback ?? allowIPFallback;

      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            handleSuccess(pos, isHigh ? "gps" : "network");
            resolve(pos);
          },
          (err) => {
            if (isHigh && (err.code === 3 || err.code === 2)) {
              navigator.geolocation.getCurrentPosition(
                (fallbackPos) => {
                  handleSuccess(fallbackPos, "network");
                  resolve(fallbackPos);
                },
                async (fallbackErr) => {
                  handleError(fallbackErr);

                  if (shouldFallbackIP) {
                    const ipResult = await fetchIPLocation();
                    if (ipResult) {
                      resolve({
                        coords: {
                          latitude: ipResult.lat,
                          longitude: ipResult.lng,
                          accuracy: ipResult.accuracy,
                        },
                      });
                      return;
                    }
                  }
                  reject(fallbackErr);
                },
                { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
              );
            } else {
              handleError(err);

              if (shouldFallbackIP && (err.code === 1 || err.code === 2 || err.code === 3)) {
                fetchIPLocation()
                  .then((ipResult) => {
                    if (ipResult) {
                      resolve({
                        coords: {
                          latitude: ipResult.lat,
                          longitude: ipResult.lng,
                          accuracy: ipResult.accuracy,
                        },
                      });
                    } else {
                      reject(err);
                    }
                  })
                  .catch(() => reject(err));
              } else {
                reject(err);
              }
            }
          },
          {
            enableHighAccuracy: isHigh,
            timeout: reqTimeout,
            maximumAge: reqMaxAge,
          }
        );
      });
    },
    [supported, enableHighAccuracy, timeout, maximumAge, allowIPFallback, handleSuccess, handleError, fetchIPLocation]
  );

  const turnOnLocation = useCallback(async () => {
    try {
      return await requestLocation({ enableHighAccuracy: true, timeout: 8000, allowIPFallback: true });
    } catch {
      return await fetchIPLocation();
    }
  }, [requestLocation, fetchIPLocation]);

  const startWatching = useCallback(
    (customOptions: Partial<UseLocationOptions> = {}) => {
      if (!supported) return;

      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      const opts = {
        enableHighAccuracy: customOptions.enableHighAccuracy ?? true,
        timeout: customOptions.timeout ?? 15000,
        maximumAge: customOptions.maximumAge ?? 5000,
      };

      setTracking(true);
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          handleSuccess(pos, "gps");
        },
        () => {},
        opts
      );
    },
    [supported, handleSuccess]
  );

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
  }, []);

  const setManualLocation = useCallback(
    (arg1: any, arg2?: any, arg3?: any) => {
      let lat: number, lng: number, name: string, address: string;

      if (arg1 && typeof arg1 === "object") {
        lat = Number(arg1.lat);
        lng = Number(arg1.lng);
        name = arg1.name || arg1.address || "";
        address = arg1.address || arg1.name || "";
      } else {
        lat = Number(arg1);
        lng = Number(arg2);
        name = arg3 || "";
        address = arg3 || "";
      }

      if (isNaN(lat) || isNaN(lng)) return;

      const manualCoords: UserLocation = {
        lat,
        lng,
        accuracy: 50,
        timestamp: Date.now(),
        isManual: true,
        isIPFallback: false,
        source: "manual",
        address: address || `Selected Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        name: name || `Selected Hub (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      };
      setLocation(manualCoords);
      setAccuracy(50);
      setError(null);
      setPermission("granted");
      saveLocationState(manualCoords);
    },
    [saveLocationState]
  );

  const useFallbackLocation = useCallback(() => {
    setLocation(DEFAULT_FALLBACK_LOCATION);
    setAccuracy(DEFAULT_FALLBACK_LOCATION.accuracy || 15);
    setError(null);
    saveLocationState(DEFAULT_FALLBACK_LOCATION);
  }, [saveLocationState]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    // Fast parallel IP pre-fetch (<300ms) so user immediately sees their real city & nearby garages
    if (allowIPFallback) {
      ipLocationService
        .getIPLocation()
        .then((ipRes) => {
          if (!isMountedRef.current || hasGpsFixRef.current) return;
          if (ipRes && typeof ipRes.lat === "number" && typeof ipRes.lng === "number") {
            setLocation((prev) => {
              if (!prev || prev.isIPFallback || prev.isManual) {
                return {
                  lat: ipRes.lat,
                  lng: ipRes.lng,
                  accuracy: ipRes.accuracy || 2500,
                  source: "ip",
                  isIPFallback: true,
                  address: ipRes.address,
                  name: `${ipRes.city}, ${ipRes.country}`,
                };
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }

    if (autoRequest) {
      requestLocation({ allowIPFallback: true }).catch(() => {});
    }

    if (watch) {
      startWatching();
    }

    return () => {
      stopWatching();
    };
  }, [autoRequest, watch, requestLocation, startWatching, stopWatching, allowIPFallback]);

  return {
    location,
    accuracy,
    loading,
    error,
    permission,
    supported,
    tracking,
    deviceInfo,
    requestLocation,
    fetchIPLocation,
    turnOnLocation,
    startWatching,
    stopWatching,
    retry: turnOnLocation,
    setManualLocation,
    useFallbackLocation,
    clearError,
  };
}

export default useLocation;
