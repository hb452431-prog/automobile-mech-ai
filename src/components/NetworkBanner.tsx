import { useState, useEffect } from "react";
import { Wifi, WifiOff, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function NetworkBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [simulatedSlow, setSimulatedSlow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (dismissed && isOnline && !simulatedSlow) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
      {(!isOnline || simulatedSlow) && (
        <div className="card-elev flex max-w-sm items-center gap-3 rounded-xl border border-warning/40 bg-card p-3 shadow-lg">
          <div className="grid size-8 place-items-center rounded-lg bg-warning/20 text-warning">
            <WifiOff className="size-4" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-semibold text-foreground">
              {!isOnline ? "Offline Mode Active" : "Low Connectivity Mode (2G/Edge)"}
            </p>
            <p className="text-muted-foreground">
              Emergency SOS and cached local garages remain operational.
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => {
              setSimulatedSlow(false);
              setDismissed(true);
            }}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Floating Simulation Pill */}
      <button
        onClick={() => setSimulatedSlow((prev) => !prev)}
        className="card-elev inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium backdrop-blur-md transition hover:border-primary/50"
        title="Toggle Roadside Network Simulation"
      >
        <span className="relative flex size-2">
          <span
            className={`absolute inline-flex size-full animate-ping rounded-full ${
              simulatedSlow ? "bg-amber-400 opacity-75" : "bg-emerald-400 opacity-75"
            }`}
          />
          <span
            className={`relative inline-flex size-2 rounded-full ${
              simulatedSlow ? "bg-amber-500" : "bg-emerald-500"
            }`}
          />
        </span>
        <span className="text-muted-foreground">
          {simulatedSlow ? "2G Simulated" : "Live GPS Ready"}
        </span>
      </button>
    </div>
  );
}
