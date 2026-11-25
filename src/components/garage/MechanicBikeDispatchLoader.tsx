import { useState, useEffect, useRef } from "react";
import { 
  Radio, 
  MapPin, 
  Zap, 
  Clock, 
  ShieldCheck, 
  Sparkles 
} from "lucide-react";

export interface MechanicBikeDispatchLoaderProps {
  onFinish?: () => void;
  duration?: number;
  userCoordinates?: { lat: number; lng: number };
  portalType?: "user" | "mechanic";
  mechanicName?: string;
}

export function MechanicBikeDispatchLoader({
  onFinish,
  duration = 2400,
  userCoordinates = { lat: 37.7749, lng: -122.4194 },
  portalType = "user",
  mechanicName = "Suresh",
}: MechanicBikeDispatchLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"riding" | "arrived" | "exiting">("riding");
  const isFinishedRef = useRef(false);

  // Remaining distance in km (from 2.4 km down to 0.0 km)
  const remainingDistance = Math.max(0, ((100 - progress) / 100) * 2.4).toFixed(1);

  // Dynamic status message based on travel progression
  const getStatusMessage = () => {
    if (portalType === "mechanic") {
      if (progress < 25) return "Initializing Live Area Radar & GPS telemetry...";
      if (progress < 60) return `Mechanic ${mechanicName} on Service Bike online with roadside tools...`;
      if (progress < 88) return "Scanning urban sectors for stranded driver SOS beacons...";
      return "SOS beacons synchronized! Opening Live Area Radar map...";
    }
    if (progress < 25) return "Scanning nearby garages & active mobile mechanics...";
    if (progress < 60) return "Mechanic Suresh dispatched on Rapid Service Bike...";
    if (progress < 88) return "Traveling via expressway with emergency roadside tools...";
    return "Mechanic arrived at your vehicle! Opening garages map...";
  };

  useEffect(() => {
    const startTime = Date.now();
    const intervalTime = 25; // 40 updates/sec

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct >= 90 && phase !== "arrived") {
        setPhase("arrived");
      }

      if (pct >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          setPhase("exiting");
          setTimeout(() => {
            if (!isFinishedRef.current) {
              isFinishedRef.current = true;
              if (onFinish) onFinish();
            }
          }, 300);
        }, 400);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [duration, onFinish, phase]);

  // Bike travels directly on the road across SVG from x = 60 to x = 550
  const bikeX = 60 + (progress / 100) * 490;

  return (
    <div
      className={`fixed inset-0 z-[99999] h-screen w-screen flex flex-col justify-between select-none overflow-hidden transition-all duration-300 ${
        phase === "exiting" ? "opacity-0 scale-[1.02] pointer-events-none" : "opacity-100 scale-100"
      } text-white`}
      style={{
        background: "radial-gradient(ellipse at 50% 30%, #0D1B36 0%, #081022 55%, #030712 100%)",
      }}
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[350px] rounded-full blur-[120px] bg-primary/20" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full blur-[100px] bg-cyan-500/15" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[100px] bg-amber-500/10" />
      </div>

      {/* 1. Full-Screen Top Header */}
      <header className="relative z-10 w-full px-4 sm:px-8 lg:px-12 py-3.5 sm:py-4.5 border-b border-border/40 bg-card/60 backdrop-blur-xl shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="size-10 sm:size-11 rounded-xl grad-primary flex items-center justify-center text-primary-foreground shadow-lg border border-white/20 shrink-0">
            <Radio className="size-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="text-sm sm:text-base font-bold tracking-wider uppercase font-heading text-white">
                MECH CONNECT AI
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                <span className="size-1.5 rounded-full bg-cyan-400 animate-ping" />
                {portalType === "mechanic" ? "MECHANIC RADAR" : "NEARBY GARAGES"}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-400 line-clamp-1">
              {portalType === "mechanic"
                ? "Connecting Live Area Radar & active driver breakdown SOS signals"
                : "Locating closest certified workshops & mobile mechanics"}
            </p>
          </div>
        </div>

        {/* Active Dispatch Badge & Coordinates */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium border border-border/40 bg-card/60 text-slate-400">
            <MapPin className="size-3.5 text-cyan-400" />
            <span>GPS: {userCoordinates.lat.toFixed(4)}°, {userCoordinates.lng.toFixed(4)}°</span>
          </div>

          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-cyan-500/15 border border-cyan-400/30 text-cyan-300">
            <Zap className="size-3.5 text-amber-300 fill-amber-300" />
            <span>{portalType === "mechanic" ? "RADAR ACTIVE" : "DISPATCH ACTIVE"}</span>
          </div>
        </div>
      </header>

      {/* 2. Main Full-Screen Cinematic Scene Canvas */}
      <main className="relative z-10 flex-1 min-h-0 w-full flex items-center justify-center p-3 sm:p-6 lg:p-8 overflow-hidden">
        <div className="relative w-full max-w-6xl xl:max-w-7xl aspect-[2.3/1] sm:aspect-[2.65/1] max-h-full rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-700/80 bg-[#070D1E] shadow-[0_25px_80px_rgba(0,0,0,0.85)] ring-1 ring-white/5 flex items-center justify-center">
          <svg className="size-full" viewBox="0 0 900 340" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0B162C" />
                <stop offset="50%" stopColor="#0F2042" />
                <stop offset="100%" stopColor="#142A58" />
              </linearGradient>

              <linearGradient id="roadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="25%" stopColor="#0F172A" />
                <stop offset="100%" stopColor="#080C16" />
              </linearGradient>

              <linearGradient id="toolChrome" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="40%" stopColor="#CBD5E1" />
                <stop offset="100%" stopColor="#64748B" />
              </linearGradient>

              <linearGradient id="bikePaint" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="50%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>

              <linearGradient id="carPaint" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="50%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>

              <linearGradient id="beamGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="rgba(254, 240, 138, 0.9)" />
                <stop offset="40%" stopColor="rgba(56, 189, 248, 0.35)" />
                <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
              </linearGradient>
            </defs>

            {/* Sky */}
            <rect x="0" y="0" width="900" height="240" fill="url(#skyGrad)" />

            {/* Distant City Silhouette */}
            <g fill="#0B132B" opacity="0.45">
              <rect x="30" y="115" width="40" height="125" />
              <rect x="75" y="85" width="50" height="155" />
              <rect x="135" y="135" width="35" height="105" />
              <rect x="180" y="100" width="60" height="140" />
              <rect x="250" y="75" width="45" height="165" />
              <rect x="305" y="130" width="40" height="110" />
              <rect x="355" y="90" width="55" height="150" />
              <rect x="420" y="65" width="70" height="175" />
              <rect x="500" y="110" width="45" height="130" />
              <rect x="555" y="80" width="55" height="160" />
              <rect x="620" y="125" width="40" height="115" />
              <rect x="670" y="85" width="60" height="155" />
              <rect x="740" y="105" width="50" height="135" />
              <rect x="800" y="70" width="60" height="170" />
            </g>

            {/* Skyline Window Lights */}
            <circle cx="100" cy="115" r="1.5" fill="#FDE047" opacity="0.8" />
            <circle cx="270" cy="95" r="1.5" fill="#38BDF8" opacity="0.9" />
            <circle cx="450" cy="85" r="1.5" fill="#FDE047" opacity="0.8" />
            <circle cx="700" cy="105" r="1.5" fill="#38BDF8" opacity="0.8" />
            <circle cx="830" cy="95" r="1.5" fill="#FDE047" opacity="0.9" />

            {/* Road (Y = 240 to 340) */}
            <rect x="0" y="240" width="900" height="100" fill="url(#roadGrad)" />
            <rect x="0" y="236" width="900" height="4" fill="#F59E0B" opacity="0.9" />
            <line x1="0" y1="240" x2="900" y2="240" stroke="#475569" strokeWidth="2" />

            {/* Animated Dashed Road Center-Line */}
            <line
              x1="0"
              y1="288"
              x2="900"
              y2="288"
              stroke="#F8FAFC"
              strokeWidth="3.5"
              strokeDasharray="35 35"
              style={{ strokeDashoffset: progress * -8 }}
            />
            <line x1="0" y1="332" x2="900" y2="332" stroke="#06B6D4" strokeWidth="1.5" opacity="0.4" />

            {/* User Stranded Vehicle at X = 670, Y = 240 */}
            <g transform="translate(670, 240)">
              {/* Emergency breakdown warning triangle */}
              <g transform="translate(-45, 0)">
                <polygon points="10,-20 20,0 0,0" fill="#EA580C" stroke="#FDE047" strokeWidth="1.5" />
                <polygon points="10,-14 15,-3 5,-3" fill="#1E293B" />
                <rect x="9" y="-12" width="2" height="5" fill="#FDE047" />
                <circle cx="10" cy="-5" r="0.8" fill="#FDE047" />
              </g>

              {/* Steam puffs from radiator */}
              <circle cx="152" cy="-52" r="5" fill="#E2E8F0" opacity="0.6" />
              <circle cx="148" cy="-64" r="7" fill="#E2E8F0" opacity="0.4" />

              {/* Ground Shadow */}
              <ellipse cx="95" cy="0" rx="95" ry="6" fill="#000000" opacity="0.75" />

              {/* Car Body */}
              <path
                d="M 5,-14 C 10,-32 30,-36 52,-38 L 74,-58 C 88,-70 132,-70 146,-58 L 162,-40 C 175,-38 182,-30 185,-14 L 182,-6 L 5,-6 Z"
                fill="url(#carPaint)"
                stroke="#475569"
                strokeWidth="1.5"
              />

              {/* Popped hood */}
              <path d="M 146,-40 L 185,-44 L 186,-36 L 144,-36 Z" fill="#334155" stroke="#64748B" strokeWidth="1" />

              {/* Windows */}
              <path d="M 58,-38 L 76,-55 C 82,-62 126,-62 142,-55 L 156,-38 Z" fill="#0F172A" stroke="#475569" strokeWidth="1" />
              <line x1="106" y1="-58" x2="106" y2="-38" stroke="#475569" strokeWidth="1.5" />

              {/* Wheels */}
              <g transform="translate(38, -16)">
                <circle cx="0" cy="0" r="16" fill="#0F172A" stroke="#334155" strokeWidth="3" />
                <circle cx="0" cy="0" r="10" fill="#64748B" stroke="#94A3B8" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="3" fill="#FFF" />
              </g>
              <g transform="translate(152, -16)">
                <circle cx="0" cy="0" r="16" fill="#0F172A" stroke="#334155" strokeWidth="3" />
                <circle cx="0" cy="0" r="10" fill="#64748B" stroke="#94A3B8" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="3" fill="#FFF" />
              </g>

              {/* Hazard lights flashing */}
              <circle cx="6" cy="-26" r="4.5" fill="#F59E0B" className="animate-pulse" />
              <circle cx="184" cy="-26" r="4.5" fill="#F59E0B" className="animate-pulse" />

              {/* Stranded driver */}
              <g transform="translate(-18, 0)">
                <line x1="-3" y1="-26" x2="-3" y2="0" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
                <line x1="3" y1="-26" x2="3" y2="0" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
                <path d="M -5,-50 L 5,-50 L 6,-26 L -6,-26 Z" fill="#2563EB" />
                <circle cx="0" cy="-56" r="5" fill="#F8FAFC" />
                <line x1="4" y1="-44" x2="10" y2="-36" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="11" cy="-35" r="4" fill="#38BDF8" opacity="0.6" className="animate-pulse" />
              </g>

              {/* Holographic GPS Pin */}
              <g transform="translate(95, -95)">
                <circle cx="0" cy="0" r="14" fill="none" stroke="#22D3EE" strokeWidth="1.8" className="animate-ping" />
                <path d="M 0,12 C -6,3 -6,0 -6,-5 C -6,-10 -2,-13 0,-13 C 2,-13 6,-10 6,-5 C 6,0 6,3 0,12 Z" fill="#06B6D4" stroke="#FFF" strokeWidth="1" />
                <circle cx="0" cy="-5" r="2.5" fill="#FFF" />
                <rect x="-46" y="-32" width="92" height="17" rx="8" fill="#0B132B" stroke="#22D3EE" strokeWidth="1.2" />
                <text x="0" y="-20" textAnchor="middle" fill="#38BDF8" fontSize="8" fontWeight="bold" fontFamily="monospace">
                  {portalType === "mechanic" ? "📍 DRIVER SOS" : "📍 YOUR CAR"}
                </text>
              </g>
            </g>

            {/* Mobile Mechanic Riding Bike at X = bikeX, Y = 240 */}
            <g transform={`translate(${bikeX}, 240)`}>
              <ellipse cx="44" cy="0" rx="52" ry="5" fill="#000000" opacity="0.75" />

              {/* Headlight beam */}
              <polygon points="88,-46 290,-30 320,0 88,-36" fill="url(#beamGrad)" opacity="0.85" />

              {/* Chrome exhaust */}
              <path d="M -5,-16 L -20,-16 C -24,-16 -28,-13 -32,-9" stroke="url(#toolChrome)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              {phase === "riding" && <circle cx="-38" cy="-9" r="3" fill="#94A3B8" opacity="0.6" />}

              {/* Rear Wheel */}
              <g transform="translate(0, -16)">
                <circle cx="0" cy="0" r="16" fill="#0F172A" stroke="#1E293B" strokeWidth="3" />
                <circle cx="0" cy="0" r="11" fill="#020617" stroke="#38BDF8" strokeWidth="1.2" />
                <g style={{ transformOrigin: "0 0", transform: `rotate(${progress * 25}deg)` }}>
                  <line x1="-10" y1="0" x2="10" y2="0" stroke="#94A3B8" strokeWidth="1.2" />
                  <line x1="0" y1="-10" x2="0" y2="10" stroke="#94A3B8" strokeWidth="1.2" />
                  <circle cx="0" cy="0" r="5" fill="#EAB308" />
                </g>
                <circle cx="0" cy="0" r="2" fill="#FFF" />
              </g>

              {/* Front Wheel */}
              <g transform="translate(88, -16)">
                <circle cx="0" cy="0" r="16" fill="#0F172A" stroke="#1E293B" strokeWidth="3" />
                <circle cx="0" cy="0" r="11" fill="#020617" stroke="#38BDF8" strokeWidth="1.2" />
                <g style={{ transformOrigin: "0 0", transform: `rotate(${progress * 25}deg)` }}>
                  <line x1="-10" y1="0" x2="10" y2="0" stroke="#94A3B8" strokeWidth="1.2" />
                  <line x1="0" y1="-10" x2="0" y2="10" stroke="#94A3B8" strokeWidth="1.2" />
                  <circle cx="0" cy="0" r="5" fill="#EAB308" />
                </g>
                <circle cx="0" cy="0" r="2" fill="#FFF" />
              </g>

              {/* Front Fork */}
              <line x1="88" y1="-16" x2="74" y2="-52" stroke="url(#toolChrome)" strokeWidth="3.5" strokeLinecap="round" />

              {/* Frame & Engine */}
              <rect x="32" y="-32" width="22" height="16" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="1" />
              <path d="M 0,-16 L 36,-36 L 74,-52 L 46,-20 Z" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

              {/* Fuel Tank */}
              <path d="M 34,-46 C 40,-58 60,-58 76,-52 L 72,-36 L 36,-36 Z" fill="url(#bikePaint)" stroke="#60A5FA" strokeWidth="1" />
              <path d="M 40,-48 L 66,-48 L 62,-43 L 37,-43 Z" fill="#22D3EE" opacity="0.9" />

              {/* Saddle */}
              <path d="M 10,-46 C 18,-46 28,-48 35,-40 L 16,-38 Z" fill="#020617" stroke="#334155" strokeWidth="1" />
              <circle cx="84" cy="-46" r="4.5" fill="#FEF08A" stroke="#FFF" strokeWidth="1" />
              <line x1="72" y1="-54" x2="66" y2="-62" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="66" cy="-63" r="2" fill="#22D3EE" />

              {/* Emergency Tool Box & Wrench */}
              <g transform="translate(-14, 0)">
                <rect x="-2" y="-52" width="28" height="18" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="1.2" />
                <rect x="1" y="-48" width="22" height="3" fill="#334155" />
                <rect x="9" y="-49" width="6" height="5" rx="0.5" fill="url(#toolChrome)" />

                {/* Chrome Wrench sticking out */}
                <g transform="translate(12, -60) rotate(30)">
                  <rect x="-1.5" y="-14" width="3" height="18" rx="1" fill="url(#toolChrome)" stroke="#64748B" strokeWidth="0.6" />
                  <circle cx="0" cy="-16" r="4.5" fill="url(#toolChrome)" stroke="#64748B" strokeWidth="0.6" />
                  <polygon points="-1.5,-18 1.5,-18 0,-14" fill="#1E293B" />
                </g>

                {/* Battery booster pack */}
                <rect x="0" y="-62" width="10" height="10" rx="1.5" fill="#DC2626" stroke="#EF4444" strokeWidth="0.8" />
              </g>

              {/* Mechanic Rider */}
              <g transform="translate(24, 0)">
                <path d="M 4,-44 L 14,-30 L 8,-18" fill="none" stroke="#1E293B" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 0,-64 L 20,-64 C 23,-56 20,-44 12,-40 L -2,-44 Z" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1.2" />
                <path d="M 0,-59 L 18,-59" stroke="#A3E635" strokeWidth="2.5" />

                {phase === "arrived" ? (
                  <g>
                    <path d="M 14,-62 L 22,-78 L 30,-80" fill="none" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
                    <text x="36" y="-79" fill="#34D399" fontSize="9" fontWeight="bold">👋</text>
                  </g>
                ) : (
                  <path d="M 16,-61 L 28,-54 L 34,-55" fill="none" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
                )}

                {/* Helmet */}
                <g transform="translate(12, -74)">
                  <circle cx="0" cy="0" r="9" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
                  <path d="M 2,-3 C 7,-3 8,3 7,5 L 2,5 Z" fill="#06B6D4" opacity="0.95" />
                </g>
              </g>

              {/* Status Pill Floating Above Bike */}
              <g transform="translate(42, -98)">
                <rect x="-42" y="-10" width="84" height="17" rx="8" fill="#0B132B" stroke="#38BDF8" strokeWidth="1.2" />
                <text x="0" y="2" textAnchor="middle" fill="#38BDF8" fontSize="7.5" fontWeight="bold" fontFamily="monospace">
                  {phase === "arrived" ? "✅ ARRIVED!" : portalType === "mechanic" ? "MECHANIC UNIT ⚡" : "RAPID BIKE ⚡"}
                </text>
              </g>
            </g>
          </svg>
        </div>
      </main>

      {/* 3. Bottom Telemetry & Progress Control Dock */}
      <footer className="relative z-10 w-full px-4 sm:px-8 lg:px-12 py-4 sm:py-6 border-t border-border/40 bg-card/60 backdrop-blur-xl shrink-0">
        <div className="max-w-6xl xl:max-w-7xl mx-auto space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="relative flex size-3">
                <span className="animate-ping absolute inline-flex size-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-3 bg-cyan-500" />
              </span>
              <span className="text-sm sm:text-base font-bold tracking-tight text-white">
                {getStatusMessage()}
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-mono font-bold px-3.5 py-1.5 rounded-full border text-cyan-300 bg-card/80 border-cyan-500/30">
                <Clock className="size-4 text-cyan-400" />
                <span>DISTANCE: {remainingDistance} KM</span>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs font-mono font-semibold px-3 py-1.5 rounded-full border text-emerald-400 bg-emerald-950/30 border-emerald-500/30">
                <ShieldCheck className="size-3.5" />
                <span>ETA: &lt; 4 MINS</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full h-3 sm:h-3.5 rounded-full border border-border/60 bg-muted/40 overflow-hidden relative p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 transition-all duration-75 relative shadow-[0_0_16px_rgba(6,182,212,0.9)]"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono px-1">
              <span className="flex items-center gap-2 text-slate-400">
                <Sparkles className="size-3.5 text-cyan-400" />
                <span>
                  {portalType === "mechanic"
                    ? "Live Area Radar Telemetry"
                    : "Fast-Response Mobile Workshop Dispatched"}
                </span>
              </span>
              <span className="font-bold text-sm text-cyan-400 font-mono">{progress}%</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default MechanicBikeDispatchLoader;
