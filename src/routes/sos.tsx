import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { 
  AlertCircle, 
  MapPin, 
  PhoneCall, 
  Send, 
  ShieldCheck, 
  Navigation, 
  Clock, 
  Truck, 
  BatteryCharging, 
  Disc, 
  Fuel, 
  KeyRound, 
  Anchor, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Sparkles, 
  Radio, 
  Car, 
  ShieldAlert,
  Phone
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { triggerConfetti } from "@/lib/confetti";
import { MechMap } from "@/components/map/MechMap";
import { ipLocationService } from "@/services/ipLocationService";
import { sosDispatchService, SOS_STATUSES, type SosRequest } from "@/services/sosDispatchService";
import { MOCK_EMERGENCY_SERVICES, type EmergencyServiceItem } from "@/services/mockData";

export const Route = createFileRoute("/sos")({
  component: SosPage,
});

function SosPage() {
  const [activeRequest, setActiveRequest] = useState<SosRequest | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState("sos-jumpstart");
  const [vehicleType, setVehicleType] = useState("🚗 Car / 4-Wheeler");
  const [vehicleBrand, setVehicleBrand] = useState("Tesla");
  const [vehicleModel, setVehicleModel] = useState("Model Y");
  const [vehiclePlate, setVehiclePlate] = useState("7XYZ892");
  const [urgencyLevel, setUrgencyLevel] = useState("⚡ Highway / Danger Zone");
  const [vehicleNotes, setVehicleNotes] = useState("Car disabled near sidewalk. Hazards turned on.");
  const [userLocation, setUserLocation] = useState({
    lat: 37.7749,
    lng: -122.4194,
    address: "Market St & 7th St, San Francisco, CA"
  });
  const [isLocating, setIsLocating] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Sync active request on mount
  useEffect(() => {
    const existing = sosDispatchService.getActiveRequest();
    if (existing) {
      setActiveRequest(existing);
    }
  }, []);

  // Request GPS position on load with multi-tier IP fallback
  useEffect(() => {
    setIsLocating(true);
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: `GPS Stranded Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`,
          });
          setIsLocating(false);
        },
        async () => {
          try {
            const ipData = await ipLocationService.getIPLocation();
            if (ipData) {
              setUserLocation({
                lat: ipData.lat,
                lng: ipData.lng,
                address: `${ipData.city}, ${ipData.region}, ${ipData.country}`,
              });
            }
          } catch {}
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      ipLocationService.getIPLocation().then((ipData) => {
        if (ipData) {
          setUserLocation({
            lat: ipData.lat,
            lng: ipData.lng,
            address: `${ipData.city}, ${ipData.region}, ${ipData.country}`,
          });
        }
        setIsLocating(false);
      });
    }
  }, []);

  // Simulation loop for driver progression when in SEARCHING or EN_ROUTE
  useEffect(() => {
    if (!activeRequest) return;

    if (activeRequest.status === SOS_STATUSES.SEARCHING) {
      const timer = setTimeout(() => {
        const assigned = sosDispatchService.simulateAssignDriver(activeRequest);
        setActiveRequest(assigned);
        toast.success("Mobile rescue unit assigned!");
        triggerConfetti({ particleCount: 50, spread: 60 });
      }, 3500);
      return () => clearTimeout(timer);
    }

    if (activeRequest.status === SOS_STATUSES.ASSIGNED || activeRequest.status === SOS_STATUSES.EN_ROUTE) {
      const interval = setInterval(() => {
        if (activeRequest.currentStepIndex < activeRequest.driverPath.length - 1) {
          const advanced = sosDispatchService.advanceDriverStep(activeRequest);
          setActiveRequest(advanced);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeRequest]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [activeRequest?.messages]);

  const handleStartEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const selectedService = MOCK_EMERGENCY_SERVICES.find((s) => s.id === selectedServiceId) || MOCK_EMERGENCY_SERVICES[0];
      const newReq = await sosDispatchService.createEmergencyRequest({
        serviceType: selectedService.id,
        serviceName: selectedService.name,
        cost: selectedService.basePrice,
        vehicle: `${vehicleBrand} ${vehicleModel}`,
        vehicleType,
        vehiclePlate,
        notes: `[${urgencyLevel}] ${vehicleNotes}`,
        userLocation,
      });
      setActiveRequest(newReq);
      toast.success("Emergency SOS Beacon Broadcasted!");
    } catch {
      toast.error("Failed to broadcast SOS request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !activeRequest) return;
    const updated = sosDispatchService.sendChatMessage(activeRequest, chatMessage);
    setActiveRequest(updated);
    setChatMessage("");
  };

  const handleCancel = () => {
    if (!activeRequest) return;
    const updated = sosDispatchService.cancelEmergency(activeRequest);
    setActiveRequest(null);
    toast.info("Emergency assistance cancelled");
  };

  const handleComplete = () => {
    if (!activeRequest) return;
    const updated = sosDispatchService.completeEmergency(activeRequest);
    setActiveRequest(null);
    triggerConfetti({ particleCount: 100, spread: 80 });
    toast.success("Rescue successfully completed! Thank you.");
  };

  const serviceIconMap: Record<string, any> = {
    BatteryCharging,
    Disc,
    Truck,
    Fuel,
    KeyRound,
    Anchor,
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-destructive" />
              </span>
              Priority Rapid Rescue Dispatch
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
              Emergency Roadside SOS
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Instant dispatch of ASE certified mobile workshops directly to your live vehicle location.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/diagnose">
                <Sparkles className="mr-1.5 size-3.5" /> AI Self-Check
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/cost-estimator">
                <Clock className="mr-1.5 size-3.5" /> Rates
              </Link>
            </Button>
          </div>
        </div>

        {/* VIEW 1: SOS Request Form */}
        {!activeRequest && (
          <div className="mt-10 grid gap-8 lg:grid-cols-12">
            {/* Form Column */}
            <form onSubmit={handleStartEmergency} className="space-y-6 lg:col-span-8">
              {/* Step 1: Emergency Service Type */}
              <Card className="card-elev border-border/60 bg-card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    1. Select Roadside Service Required
                  </h2>
                  <span className="text-xs text-muted-foreground">Standardized Flat-Rate Pricing</span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {MOCK_EMERGENCY_SERVICES.map((srv) => {
                    const IconComponent = serviceIconMap[srv.icon] || Wrench;
                    const isSelected = selectedServiceId === srv.id;
                    return (
                      <div
                        key={srv.id}
                        onClick={() => setSelectedServiceId(srv.id)}
                        className={`cursor-pointer rounded-xl border p-4 transition ${
                          isSelected
                            ? "border-primary bg-primary/10 ring-1 ring-primary"
                            : "border-border/60 bg-muted/20 hover:border-primary/40 hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span
                            className={`grid size-9 place-items-center rounded-lg ${
                              isSelected ? "grad-primary text-primary-foreground" : "bg-muted text-foreground"
                            }`}
                          >
                            <IconComponent className="size-4.5" />
                          </span>
                          <span className="text-sm font-bold text-primary">${srv.basePrice}</span>
                        </div>
                        <h3 className="mt-3 text-xs font-bold leading-tight text-foreground">{srv.name}</h3>
                        <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{srv.description}</p>
                        <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="size-3 text-primary" /> ~{srv.etaMins} mins ETA</span>
                          {srv.popular && <Badge variant="outline" className="text-[9px] py-0">Popular</Badge>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Step 2: Vehicle Specs & Urgency */}
              <Card className="card-elev border-border/60 bg-card p-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  2. Vehicle Identification & Urgency
                </h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Vehicle Platform</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                    >
                      <option value="🚗 Car / 4-Wheeler">🚗 Car / Sedan / SUV</option>
                      <option value="🏍️ Bike / 2-Wheeler">🏍️ Motorcycle / Scooter</option>
                      <option value="🚚 Heavy Commercial">🚚 Commercial / Van / Truck</option>
                      <option value="⚡ Electric EV">⚡ Electric / EV</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Brand & Model</label>
                    <Input
                      className="mt-1.5 text-xs"
                      placeholder="e.g. Tesla Model Y"
                      value={vehicleBrand}
                      onChange={(e) => setVehicleBrand(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">License Plate</label>
                    <Input
                      className="mt-1.5 text-xs uppercase"
                      placeholder="e.g. 7XYZ892"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-xs font-semibold text-muted-foreground">Urgency Assessment</label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {[
                      { id: "⚡ Highway / Danger Zone", label: "Highway / Danger", desc: "Highest Priority" },
                      { id: "🟡 Roadside Breakdown", label: "Roadside Breakdown", desc: "Shoulder of Road" },
                      { id: "🟢 Safe Parking Lot / Garage", label: "Safe Parking Lot", desc: "Off-Road Protected" },
                    ].map((urg) => (
                      <button
                        key={urg.id}
                        type="button"
                        onClick={() => setUrgencyLevel(urg.id)}
                        className={`rounded-xl border p-2.5 text-left transition ${
                          urgencyLevel === urg.id
                            ? "border-destructive bg-destructive/10 text-destructive font-semibold ring-1 ring-destructive"
                            : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        }`}
                      >
                        <p className="text-xs font-bold">{urg.label}</p>
                        <p className="text-[10px] opacity-75">{urg.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-xs font-semibold text-muted-foreground">Roadside Situation Notes</label>
                  <Textarea
                    rows={2}
                    className="mt-1.5 resize-none text-xs"
                    value={vehicleNotes}
                    onChange={(e) => setVehicleNotes(e.target.value)}
                    placeholder="Describe surrounding hazards, street landmarks, etc."
                  />
                </div>
              </Card>

              {/* Step 3: Location Details */}
              <Card className="card-elev border-border/60 bg-card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    3. Live GPS Stranded Location
                  </h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-primary"
                    onClick={() => {
                      if (navigator.geolocation) {
                        setIsLocating(true);
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setUserLocation({
                              lat: pos.coords.latitude,
                              lng: pos.coords.longitude,
                              address: `GPS Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`
                            });
                            setIsLocating(false);
                            toast.success("Location refreshed");
                          },
                          () => {
                            setIsLocating(false);
                            toast.error("Location permission denied");
                          }
                        );
                      }
                    }}
                  >
                    <MapPin className="mr-1 size-3.5" /> Refresh GPS
                  </Button>
                </div>

                <div className="mt-4 flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
                    <Input
                      className="pl-9 text-xs"
                      value={userLocation.address}
                      onChange={(e) => setUserLocation({ ...userLocation, address: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-3 overflow-hidden rounded-xl border border-border/60">
                  <MechMap
                    userLocation={userLocation}
                    onSelectLocation={(lat, lng, address) => {
                      setUserLocation({ lat, lng, address });
                    }}
                    height="200px"
                  />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Precise coordinates: {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)} · GPS High Accuracy Active
                </p>
              </Card>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="h-14 w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 text-base font-bold shadow-xl shadow-destructive/25"
              >
                <Radio className="mr-2 size-5 animate-pulse" />
                BROADCAST EMERGENCY SOS BEACON NOW
              </Button>
            </form>

            {/* Sidebar Security & Policy Column */}
            <div className="space-y-6 lg:col-span-4">
              <Card className="card-elev border-border/60 bg-card p-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-success" />
                  <h3 className="font-bold text-sm">Automobile-Mech-AI Guarantee</h3>
                </div>
                <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                    <span><strong>15-Minute Target Arrival:</strong> Nearest mobile workshop dispatched automatically.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                    <span><strong>No Upfront Surprise Fees:</strong> Standardized flat-rate roadside rescue billing.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                    <span><strong>ASE Master Technicians:</strong> Background-checked, licensed, and insured field pros.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                    <span><strong>Live GPS Radar:</strong> Turn-by-turn live tracking of mechanic vehicle.</span>
                  </li>
                </ul>
              </Card>

              <Card className="card-elev border-border/60 bg-gradient-to-br from-primary/10 via-card to-card p-6">
                <h3 className="font-bold text-sm">Need Direct Phone Dispatch?</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  If you are unable to use the app or in extreme immediate danger:
                </p>
                <Button asChild size="lg" className="mt-4 w-full grad-primary text-primary-foreground">
                  <a href="tel:911">
                    <Phone className="mr-2 size-4" /> Call Emergency 911
                  </a>
                </Button>
              </Card>
            </div>
          </div>
        )}

        {/* VIEW 2 & 3: Active Emergency SOS Live Radar & Dispatch Tracker */}
        {activeRequest && (
          <div className="mt-8 grid gap-8 lg:grid-cols-12">
            {/* Left Column: Live Status & Radar Map */}
            <div className="space-y-6 lg:col-span-8">
              {/* Status Header Banner */}
              <Card className="card-elev border-border/60 bg-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          activeRequest.status === SOS_STATUSES.SEARCHING
                            ? "outline"
                            : activeRequest.status === SOS_STATUSES.ARRIVED
                            ? "default"
                            : "destructive"
                        }
                        className="animate-pulse uppercase text-xs"
                      >
                        Status: {activeRequest.status}
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">ID: {activeRequest.id}</span>
                    </div>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight">
                      {activeRequest.serviceName}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Vehicle: <span className="font-semibold text-foreground">{activeRequest.vehicle}</span> · Target: {activeRequest.userLocation.address}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Estimated Arrival</p>
                    <p className="text-3xl font-extrabold text-primary font-mono">
                      ~{activeRequest.etaMins} MINS
                    </p>
                  </div>
                </div>

                {/* Progress Tracker Steps */}
                <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 text-xs font-semibold">
                  {[
                    { label: "Beacon Sent", done: true },
                    { label: "Unit Assigned", done: !!activeRequest.assignedDriver },
                    { label: "En Route", done: activeRequest.currentStepIndex > 0 },
                    { label: "Arrived", done: activeRequest.status === SOS_STATUSES.ARRIVED },
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span
                        className={`grid size-5 place-items-center rounded-full text-[10px] ${
                          step.done ? "bg-primary text-primary-foreground font-bold" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {step.done ? "✓" : idx + 1}
                      </span>
                      <span className={step.done ? "text-foreground font-semibold" : "text-muted-foreground"}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Master Leaflet Interactive Rescue Tracking Map */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
                  <span className="flex items-center gap-1.5 text-primary">
                    <span className="size-2.5 rounded-full bg-primary" />
                    📍 You ({activeRequest.vehicle})
                  </span>
                  {activeRequest.assignedDriver && (
                    <span className="flex items-center gap-1.5 text-destructive font-bold">
                      <span className="size-2.5 rounded-full bg-destructive animate-ping" />
                      🚐 Unit ({activeRequest.assignedDriver.name} · {activeRequest.assignedDriver.vehicle})
                    </span>
                  )}
                </div>

                <MechMap
                  userLocation={activeRequest.userLocation}
                  mechanicLocation={
                    activeRequest.assignedDriver?.currentLocation || {
                      lat: activeRequest.userLocation.lat + 0.015,
                      lng: activeRequest.userLocation.lng + 0.012,
                    }
                  }
                  mechanicInfo={
                    activeRequest.assignedDriver
                      ? {
                          name: activeRequest.assignedDriver.name,
                          mechanicName: activeRequest.assignedDriver.name,
                          garageName: activeRequest.assignedDriver.company,
                          phone: activeRequest.assignedDriver.phone,
                          vehicle: activeRequest.assignedDriver.vehicle,
                        }
                      : null
                  }
                  routeCoordinates={
                    activeRequest.driverPath && activeRequest.driverPath.length > 0
                      ? activeRequest.driverPath.map((p) => [p.lat, p.lng] as [number, number])
                      : null
                  }
                  showRoute={activeRequest.status !== SOS_STATUSES.SEARCHING}
                  activeRouteInfo={{
                    distance: `${((activeRequest.etaMins || 6) * 0.35).toFixed(1)} miles`,
                    eta: `${activeRequest.etaMins || 6} mins`,
                  }}
                  height="360px"
                />

                <Card className="card-elev border-border/60 bg-muted/20 p-5">
                  {/* Searching Radar animation overlay */}
                  {activeRequest.status === SOS_STATUSES.SEARCHING && (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <div className="relative grid size-20 place-items-center">
                        <div className="absolute size-20 animate-ping rounded-full bg-primary/20" />
                        <div className="absolute size-14 animate-pulse rounded-full bg-primary/30" />
                        <div className="relative grid size-10 place-items-center rounded-full grad-primary text-primary-foreground shadow-lg">
                          <Radio className="size-5 animate-spin" />
                        </div>
                      </div>
                      <h3 className="mt-3 text-base font-bold text-foreground">Scanning Local Mobile Units...</h3>
                      <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                        Broadcasting priority emergency frequency to nearest master mechanics within 3.5 miles.
                      </p>
                    </div>
                  )}

                  {/* En-Route Status Bar & Telemetry */}
                  {activeRequest.status !== SOS_STATUSES.SEARCHING && activeRequest.assignedDriver && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-semibold text-primary">
                          <Navigation className="size-3.5" /> Mobile Van GPS Stream Live
                        </span>
                        <span>Progress: Step {activeRequest.currentStepIndex + 1} of {activeRequest.driverPath.length}</span>
                      </div>

                      <div className="relative flex-1">
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full grad-primary transition-all duration-700 rounded-full"
                            style={{
                              width: `${((activeRequest.currentStepIndex + 1) / activeRequest.driverPath.length) * 100}%`
                            }}
                          />
                        </div>
                      </div>

                      {activeRequest.assignedDriver.currentLocation && (
                        <div className="rounded-lg bg-background/60 p-2.5 text-[11px] font-mono text-muted-foreground flex justify-between border border-border/40">
                          <span>Technician: {activeRequest.assignedDriver.currentLocation.lat.toFixed(4)}, {activeRequest.assignedDriver.currentLocation.lng.toFixed(4)}</span>
                          <span>Destination: {activeRequest.userLocation.lat.toFixed(4)}, {activeRequest.userLocation.lng.toFixed(4)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rescue Action Bar */}
                  <div className="mt-4 flex flex-wrap gap-2.5 pt-3 border-t border-border/40">
                    {activeRequest.assignedDriver && (
                      <Button asChild size="sm" className="grad-primary text-primary-foreground font-semibold">
                        <a href={`tel:${activeRequest.assignedDriver.phone}`}>
                          <PhoneCall className="mr-1.5 size-4" /> Call Driver ({activeRequest.assignedDriver.phone})
                        </a>
                      </Button>
                    )}
                    {activeRequest.status === SOS_STATUSES.ARRIVED ? (
                      <Button onClick={handleComplete} size="sm" className="bg-success text-success-foreground hover:bg-success/90 font-semibold">
                        <CheckCircle2 className="mr-1.5 size-4" /> Mark Rescue Completed
                      </Button>
                    ) : (
                      <Button onClick={handleCancel} variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                        <X className="mr-1.5 size-4" /> Cancel Emergency
                      </Button>
                    )}
                  </div>
                </Card>
              </div>
            </div>

            {/* Right Column: Driver Card & Live Messaging Chat */}
            <div className="space-y-6 lg:col-span-4">
              {/* Assigned Driver Profile */}
              {activeRequest.assignedDriver ? (
                <Card className="card-elev border-border/60 bg-card p-6">
                  <div className="flex items-center gap-3">
                    <img
                      src={activeRequest.assignedDriver.avatar}
                      alt={activeRequest.assignedDriver.name}
                      className="size-14 rounded-2xl object-cover border-2 border-primary"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{activeRequest.assignedDriver.name}</h3>
                      <p className="text-xs text-primary font-medium">{activeRequest.assignedDriver.role}</p>
                      <p className="text-[11px] text-muted-foreground">{activeRequest.assignedDriver.company}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-muted/20 p-3 text-center text-xs">
                    <div>
                      <p className="text-muted-foreground">Rating</p>
                      <p className="font-bold text-foreground">★ {activeRequest.assignedDriver.rating} / 5.0</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Rescues</p>
                      <p className="font-bold text-foreground">{activeRequest.assignedDriver.completedRescues}+</p>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-muted-foreground space-y-1">
                    <p><strong>Workshop Vehicle:</strong> {activeRequest.assignedDriver.vehicle}</p>
                    <p><strong>Fixed Payout:</strong> ${activeRequest.estimatedCost}.00</p>
                  </div>
                </Card>
              ) : (
                <Card className="card-elev border-border/60 bg-card p-6 text-center text-xs text-muted-foreground">
                  <Radio className="mx-auto size-6 text-primary animate-spin" />
                  <p className="mt-2 font-semibold">Assigning Technician...</p>
                  <p className="mt-0.5">Vetting partner mechanics in your sector.</p>
                </Card>
              )}

              {/* In-Transit Live Chat */}
              <Card className="card-elev flex h-80 flex-col border-border/60 bg-card p-4">
                <div className="border-b border-border/60 pb-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Live Dispatch Channel
                  </h3>
                </div>

                <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-2 py-3 text-xs">
                  {activeRequest.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-xl p-2.5 max-w-[85%] ${
                        m.sender === "user"
                          ? "ml-auto bg-primary text-primary-foreground"
                          : m.sender === "driver"
                          ? "mr-auto border border-primary/30 bg-primary/10 text-foreground"
                          : "mx-auto bg-muted/60 text-muted-foreground text-center text-[11px]"
                      }`}
                    >
                      <p>{m.text}</p>
                      <span className="mt-1 block text-[9px] opacity-70">{m.timestamp}</span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-border/60 pt-2">
                  <Input
                    placeholder="Message driver or dispatcher..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <Button type="submit" size="sm" className="grad-primary text-primary-foreground h-9 px-3">
                    <Send className="size-3.5" />
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
