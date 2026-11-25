import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { 
  Wrench, 
  MapPin, 
  Bot, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Car, 
  Clock, 
  AlertCircle, 
  Radio, 
  DollarSign, 
  Cpu, 
  Activity, 
  Star, 
  CheckCircle2 
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MechMap, type MapGarageItem } from "@/components/map/MechMap";
import { useLocation } from "@/hooks/useLocation";
import { calculateDistanceKm } from "@/services/routingService";
import { MOCK_MECHANICS, MOCK_REVIEWS } from "@/services/mockData";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const [activeFilter, setActiveFilter] = useState<"all" | "ev" | "mobile" | "247">("all");
  const [selectedMech, setSelectedMech] = useState(MOCK_MECHANICS[0]);

  const { location: userLocation, accuracy, turnOnLocation } = useLocation({
    autoRequest: true,
    enableHighAccuracy: true,
    allowIPFallback: true,
    watch: true,
  });

  const filteredMechanics = useMemo(() => {
    return MOCK_MECHANICS.filter((mech) => {
      if (activeFilter === "ev") {
        return mech.specialties.some(
          (s) =>
            s.toLowerCase().includes("ev") ||
            s.toLowerCase().includes("tesla") ||
            s.toLowerCase().includes("hybrid")
        );
      }
      if (activeFilter === "mobile") return mech.isMobileUnit;
      if (activeFilter === "247") return mech.isOpen247;
      return true;
    });
  }, [activeFilter]);

  const mapGarages: MapGarageItem[] = useMemo(() => {
    const lat = userLocation?.lat ?? 37.7749;
    const lng = userLocation?.lng ?? -122.4194;

    const offsets = [
      { dLat: 0.007, dLng: 0.008, area: "Commercial Sector 1" },
      { dLat: -0.011, dLng: 0.013, area: "Expressway Ring Road" },
      { dLat: 0.014, dLng: -0.012, area: "City Center Hub" },
      { dLat: -0.016, dLng: -0.015, area: "Tech Park Crossing" },
      { dLat: 0.021, dLng: 0.019, area: "Industrial District" },
      { dLat: -0.023, dLng: 0.006, area: "Transit Station" },
    ];

    return filteredMechanics.map((m, idx) => {
      const off = offsets[idx % offsets.length];
      const mLat = userLocation ? lat + off.dLat : m.lat;
      const mLng = userLocation ? lng + off.dLng : m.lng;
      const d = userLocation ? calculateDistanceKm(lat, lng, mLat, mLng) : m.distanceKm;

      return {
        id: m.id,
        name: m.name,
        mechanicName: m.owner.split("(")[0].trim(),
        owner: m.owner,
        phone: m.phone,
        address: userLocation ? `${off.area} (Nearby)` : m.address,
        services: m.specialties,
        rating: m.rating,
        reviewCount: m.reviewCount,
        reviewsCount: m.reviewCount,
        available: true,
        isOpen247: m.isOpen247,
        distanceKm: Number(d.toFixed(1)),
        distance: `${Number(d.toFixed(1))} km away`,
        lat: mLat,
        lng: mLng,
        hourlyRate: m.hourlyRate,
      };
    });
  }, [filteredMechanics, userLocation]);
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Live Mobility Telemetry Ticker Pill */}
        <div className="mx-auto mt-6 flex justify-center px-4">
          <div className="card-elev inline-flex flex-wrap items-center justify-center gap-3 rounded-full border border-border/60 bg-background/80 px-4 py-2 text-xs font-medium backdrop-blur-md">
            <span className="flex items-center gap-1.5 font-bold text-success">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              142 Active Mobile Units Nearby
            </span>
            <span className="text-muted-foreground hidden sm:inline">•</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="size-3.5 text-primary" />
              ~4.2 Min Avg Roadside Response
            </span>
            <span className="text-muted-foreground hidden sm:inline">•</span>
            <span className="flex items-center gap-1 text-foreground font-semibold">
              <span className="text-amber-500">★</span> 4.95 / 5.0 Rating (2,400+ Rescues)
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:pt-14 lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary font-semibold">
                <Sparkles className="size-3.5" /> Next-Gen Vehicle Intelligence & Rapid Rescue
              </div>
              <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Car broke down?<br />
                <span className="text-primary">Master mechanic</span> beside you,
                <br />guided by multimodal AI.
              </h1>
              <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
                Instant priority roadside SOS dispatch, acoustic engine sound analysis, fair repair pricing calculators, and verified ASE master technicians at your fingertips.
              </p>

              {/* Primary Call to Actions */}
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-12 px-6 bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold shadow-lg shadow-destructive/25">
                  <Link to="/sos">
                    <Radio className="mr-2 size-4.5 animate-pulse" /> Emergency Roadside SOS
                  </Link>
                </Button>
                <Button asChild size="lg" className="h-12 px-6 grad-primary text-primary-foreground font-semibold shadow-md">
                  <Link to="/diagnose">
                    <Sparkles className="mr-2 size-4.5" /> AI Diagnostic Suite
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="h-12 px-5">
                  <Link to="/cost-estimator">
                    <DollarSign className="mr-1.5 size-4" /> Fair Cost Estimator
                  </Link>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-success" /> ASE Certified Garages
                </div>
                <div className="flex items-center gap-1.5">
                  <Bot className="size-4 text-primary" /> Audio & Vision AI
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-primary" /> Live GPS Dispatch
                </div>
              </div>
            </div>

            {/* Hero Interactive Preview Card */}
            <div className="relative mt-12 lg:mt-0">
              <Card className="card-elev relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-xl grad-primary text-primary-foreground shadow-md">
                      <Wrench className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold">Apex Precision & EV Lab</p>
                      <p className="text-xs text-muted-foreground">1.8 km away · ASE Master Certified</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-success/40 bg-success/15 text-success font-semibold text-xs">
                    OPEN NOW
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  {[
                    "EV & Hybrid Powertrains",
                    "Full OBD-II Diagnostic",
                    "Brake Pad Replacement",
                    "Battery Booster Jump",
                  ].map((s) => (
                    <div key={s} className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-muted-foreground">
                      {s}
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex gap-2">
                  <Button asChild size="sm" className="flex-1 grad-primary text-primary-foreground font-semibold">
                    <Link to="/mechanics">View Verified Garages</Link>
                  </Button>
                  <Button asChild size="sm" variant="secondary" className="flex-1">
                    <Link to="/sos">Dispatch Mobile Unit</Link>
                  </Button>
                </div>
              </Card>

              {/* Floating AI Diagnostic Bubble */}
              <div className="card-elev absolute -bottom-6 -left-4 hidden max-w-xs rounded-2xl border border-border/60 bg-background/90 p-4 backdrop-blur-md sm:block">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Bot className="size-4" /> AI Multimodal Mechanic
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  &ldquo;Acoustic sample matched serpentine belt glaze (98.8% confidence). Safe for short trip to workshop.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Dual Portal Selection Area */}
        <section className="mx-auto max-w-7xl px-4 py-12">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-2">
              <Cpu className="size-4 text-primary" /> Select Dedicated System Portal
            </span>
            <span className="text-primary font-bold flex items-center gap-1">
              <Activity className="size-3.5 animate-pulse" /> Live Telemetry Online
            </span>
          </div>

          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {/* PORTAL 1: USER / DRIVER PORTAL */}
            <Card className="card-elev border-border/60 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl grad-primary text-primary-foreground shadow-lg">
                    <Car className="size-6" />
                  </span>
                  <Badge variant="outline" className="text-xs">Vehicle Owners & Drivers</Badge>
                </div>

                <h2 className="mt-5 text-2xl font-bold">User / Driver Portal</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Access live roadside emergency dispatch, multimodal AI symptom diagnostics, cost estimation, and digital vehicle maintenance telemetry.
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-lg border border-border/60 bg-background/60 px-2.5 py-1 text-muted-foreground">
                    ⚡ Instant Roadside SOS
                  </span>
                  <span className="rounded-lg border border-border/60 bg-background/60 px-2.5 py-1 text-muted-foreground">
                    📍 GPS Live Garages
                  </span>
                  <span className="rounded-lg border border-border/60 bg-background/60 px-2.5 py-1 text-muted-foreground">
                    🤖 AI Auto-Scan
                  </span>
                  <span className="rounded-lg border border-border/60 bg-background/60 px-2.5 py-1 text-muted-foreground">
                    🚗 Digital Garage
                  </span>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="flex-1 grad-primary text-primary-foreground font-semibold">
                  <Link to="/dashboard">Enter Driver Portal <ArrowRight className="ml-2 size-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/mechanics">Find Mechanics</Link>
                </Button>
              </div>
            </Card>

            {/* PORTAL 2: MECHANIC / PARTNER RADAR PORTAL */}
            <Card className="card-elev border-border/60 bg-gradient-to-br from-amber-500/10 via-card to-card p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl bg-amber-500 text-slate-950 font-bold shadow-lg">
                    <Wrench className="size-6" />
                  </span>
                  <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs">
                    Garages & Mobile Mechanics
                  </Badge>
                </div>

                <h2 className="mt-5 text-2xl font-bold">Mechanic Partner Portal</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Receive live emergency radar dispatches in your area, navigate directly to stranded drivers, track jobs, and manage automated daily revenue payouts.
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-lg border border-border/60 bg-background/60 px-2.5 py-1 text-muted-foreground">
                    📡 Priority SOS Radar Alerts
                  </span>
                  <span className="rounded-lg border border-border/60 bg-background/60 px-2.5 py-1 text-muted-foreground">
                    🗺️ Turn-by-Turn GPS
                  </span>
                  <span className="rounded-lg border border-border/60 bg-background/60 px-2.5 py-1 text-muted-foreground">
                    💵 Daily Automated Payouts
                  </span>
                  <span className="rounded-lg border border-border/60 bg-background/60 px-2.5 py-1 text-muted-foreground">
                    ⭐ Reputation Ratings
                  </span>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="flex-1 bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold shadow-md">
                  <Link to="/partner-portal">Launch Partner Radar <ArrowRight className="ml-2 size-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/mechanic/register">Register Garage</Link>
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* Verified Local Mechanics Map Preview Section */}
        <section className="border-t border-border/60 bg-muted/15 py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div className="max-w-2xl space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary font-semibold">
                  <MapPin className="size-3.5" /> Verified Local Technicians
                </div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Find Certified Mechanics Nearby
                </h2>
                <p className="text-sm text-muted-foreground">
                  Every workshop and mobile technician on our network undergoes strict ASE master validation, background verification, and fair-pricing audits.
                </p>
              </div>

              {/* Specialty Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "All Specialists" },
                  { id: "ev", label: "EV & Hybrid" },
                  { id: "mobile", label: "Mobile Units" },
                  { id: "247", label: "Open 24/7" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeFilter === f.id
                        ? "grad-primary text-primary-foreground shadow-md"
                        : "bg-card border border-border/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Left Column: Top 3 Mechanics Cards */}
              <div className="lg:col-span-6 space-y-4">
                {filteredMechanics.slice(0, 3).map((mech) => {
                  const isSelected = selectedMech?.id === mech.id;
                  return (
                    <div
                      key={mech.id}
                      onClick={() => setSelectedMech(mech)}
                      className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-1 ring-primary shadow-lg"
                          : "card-elev border-border/60 bg-card hover:border-primary/40 hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <img
                            src={mech.image}
                            alt={mech.name}
                            className="size-16 rounded-xl object-cover border border-border/60 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-sm text-foreground">{mech.name}</h4>
                              {mech.verifiedBadge && <ShieldCheck className="size-4 text-success shrink-0" />}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{mech.address}</p>

                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                              <span className="flex items-center gap-1 font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[11px]">
                                ★ {mech.rating} <span className="font-normal text-muted-foreground">({mech.reviewCount})</span>
                              </span>
                              <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 text-[11px]">
                                📍 {mech.distanceKm} km away
                              </span>
                              {mech.isOpen247 && (
                                <Badge variant="outline" className="border-success/40 bg-success/15 text-success text-[10px] py-0">
                                  24/7 Service
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="sm:text-right flex sm:flex-col justify-between items-center sm:items-end w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                          <div>
                            <span className="text-[10px] uppercase font-mono text-muted-foreground block">Rate</span>
                            <span className="text-sm font-bold font-mono text-foreground">${mech.hourlyRate}/hr</span>
                          </div>

                          <Button asChild size="sm" className="mt-2 grad-primary text-primary-foreground font-semibold text-xs h-8 px-3">
                            <Link to={`/mechanics?selected=${mech.id}&book=true`}>
                              Book Slot <ArrowRight className="ml-1 size-3" />
                            </Link>
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-border/40 flex flex-wrap gap-1.5">
                        {mech.specialties.slice(0, 3).map((spec, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/40"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <div className="pt-2">
                  <Button asChild variant="link" className="p-0 text-sm font-bold text-primary font-mono">
                    <Link to="/mechanics">
                      <span>View all 48 nearby mechanics on interactive map</span>
                      <ArrowRight className="ml-1.5 size-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Right Column: Live OpenStreetMap Preview */}
              <div className="lg:col-span-6">
                <div className="card-elev overflow-hidden rounded-3xl border border-border/60 bg-card h-full flex flex-col justify-between p-2">
                  <MechMap
                    userLocation={
                      userLocation
                        ? { lat: userLocation.lat, lng: userLocation.lng, accuracy: accuracy || 20 }
                        : null
                    }
                    garages={mapGarages}
                    selectedGarage={
                      mapGarages.find((g) => g.id === selectedMech?.id) || mapGarages[0]
                    }
                    onSelectGarage={(g) => {
                      const found = MOCK_MECHANICS.find((m) => m.id === g.id);
                      if (found) setSelectedMech(found);
                    }}
                    onLocate={() => turnOnLocation()}
                    height="420px"
                  />
                  <div className="p-3 text-xs text-muted-foreground flex items-center justify-between border-t border-border/40 mt-2">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-primary" />
                      Showing verified mechanics within 10 km
                    </span>
                    <Link to="/mechanics" className="text-primary font-bold hover:underline">
                      Open Full Screen Map &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Feature Deep Dives */}
        <section id="features" className="mx-auto max-w-7xl px-4 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Complete Automotive Rescue & Intelligence
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Everything you need when you are on the road or planning routine vehicle care.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="card-elev border-border/60 bg-card p-6 flex flex-col justify-between">
              <div>
                <span className="grid size-10 place-items-center rounded-lg bg-destructive/15 text-destructive font-bold">
                  <Radio className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold">Priority Roadside SOS</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Battery jumpstarts, tyre changes, lockout rescue, and flatbed tow trucks dispatched to your exact GPS coordinates in minutes.
                </p>
              </div>
              <Button asChild variant="link" size="sm" className="mt-4 p-0 text-destructive justify-start">
                <Link to="/sos">Request Emergency SOS →</Link>
              </Button>
            </Card>

            <Card className="card-elev border-border/60 bg-card p-6 flex flex-col justify-between">
              <div>
                <span className="grid size-10 place-items-center rounded-lg bg-primary/15 text-primary font-bold">
                  <Bot className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold">Multimodal AI Diagnostics</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Diagnose vehicle symptoms via natural text, acoustic frequency matching, dashboard warning light scans, and OBD-II DTC lookups.
                </p>
              </div>
              <Button asChild variant="link" size="sm" className="mt-4 p-0 text-primary justify-start">
                <Link to="/diagnose">Open AI Diagnostic Suite →</Link>
              </Button>
            </Card>

            <Card className="card-elev border-border/60 bg-card p-6 flex flex-col justify-between">
              <div>
                <span className="grid size-10 place-items-center rounded-lg bg-success/15 text-success font-bold">
                  <DollarSign className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold">Transparent Cost Estimator</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Compare OEM parts costs and certified labor book-time against inflated dealership quotes before approving any repair.
                </p>
              </div>
              <Button asChild variant="link" size="sm" className="mt-4 p-0 text-success justify-start">
                <Link to="/cost-estimator">Calculate Fair Price →</Link>
              </Button>
            </Card>

            <Card className="card-elev border-border/60 bg-card p-6 flex flex-col justify-between">
              <div>
                <span className="grid size-10 place-items-center rounded-lg bg-amber-500/15 text-amber-500 font-bold">
                  <Wrench className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold">Verified Mechanics Network</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Explore certified workshops with transparent ratings, menu pricing, 24/7 service filters, and instant appointment booking.
                </p>
              </div>
              <Button asChild variant="link" size="sm" className="mt-4 p-0 text-amber-500 justify-start">
                <Link to="/mechanics">Explore Garages →</Link>
              </Button>
            </Card>
          </div>
        </section>

        {/* Customer Testimonials Section */}
        <section className="mx-auto max-w-7xl px-4 py-12 border-t border-border/60">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Verified Driver Experiences</h2>
            <p className="mt-1 text-xs text-muted-foreground">Real rescues completed across our roadside partner network.</p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {MOCK_REVIEWS.map((rev) => (
              <Card key={rev.id} className="card-elev border-border/60 bg-card p-6">
                <div className="flex items-center gap-1 text-amber-500 text-sm">
                  {"★".repeat(rev.rating)}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-foreground italic">
                  &ldquo;{rev.comment}&rdquo;
                </p>
                <div className="mt-4 border-t border-border/60 pt-3">
                  <p className="font-semibold text-xs text-foreground">{rev.author}</p>
                  <p className="text-[11px] text-muted-foreground">{rev.role} · {rev.service}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
          <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} Automobile-Mech-AI. All rights reserved.</p>
            <div className="flex gap-4">
              <Link to="/sos" className="hover:text-foreground">SOS Dispatch</Link>
              <Link to="/diagnose" className="hover:text-foreground">AI Diagnostics</Link>
              <Link to="/cost-estimator" className="hover:text-foreground">Cost Estimator</Link>
              <Link to="/mechanics" className="hover:text-foreground">Find Mechanics</Link>
              <Link to="/dashboard" className="hover:text-foreground">My Garage</Link>
              <Link to="/partner-portal" className="hover:text-foreground">Partner Radar</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
