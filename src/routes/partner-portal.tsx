import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Wrench, 
  Radio, 
  MapPin, 
  DollarSign, 
  Star, 
  CheckCircle2, 
  AlertOctagon, 
  PhoneCall, 
  Navigation, 
  Clock, 
  ShieldCheck, 
  Activity, 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  User, 
  Phone, 
  Check, 
  X,
  Car
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { triggerConfetti } from "@/lib/confetti";
import { MechMap, type MapGarageItem } from "@/components/map/MechMap";
import { useLocation } from "@/hooks/useLocation";
import { generateGaragesNearLocation } from "@/data/demoGarages";
import { calculateDistanceKm, routingService } from "@/services/routingService";
import { emergencyService, type EmergencyRequestItem, type CompletedRequestItem } from "@/services/emergencyService";

export const Route = createFileRoute("/partner-portal")({
  component: PartnerPortalPage,
});

function PartnerPortalPage() {
  const [isOnline, setIsOnline] = useState(true);
  const [hasIncomingRadarAlert, setHasIncomingRadarAlert] = useState(true);
  const [activeJob, setActiveJob] = useState<any | null>(null);
  const [activeJobRoute, setActiveJobRoute] = useState<Array<[number, number]> | null>(null);
  const [todayEarnings, setTodayEarnings] = useState(420.0);
  const [completedJobsCount, setCompletedJobsCount] = useState(4);
  const [activeRequests, setActiveRequests] = useState<EmergencyRequestItem[]>([]);
  const [completedRequests, setCompletedRequests] = useState<CompletedRequestItem[]>([]);

  const {
    location: partnerLocation,
    accuracy,
    loading: isLocating,
    turnOnLocation,
  } = useLocation({ autoRequest: true, enableHighAccuracy: true, allowIPFallback: true, watch: true });

  const currentCoords = {
    lat: partnerLocation?.lat ?? 37.7749,
    lng: partnerLocation?.lng ?? -122.4194,
  };

  // Dynamically place breakdown distress signal near the technician's actual GPS location
  const sampleIncomingAlert = {
    id: "SOS-882190",
    service: "12V Battery Jumpstart & Rapid OBD-II Scan",
    customerName: "Alex Turner",
    vehicle: "2023 Tesla Model Y (Pearl White)",
    distanceMiles: 1.4,
    distanceKm: 2.2,
    etaMins: 7,
    payout: 55.0,
    lat: currentCoords.lat + 0.012,
    lng: currentCoords.lng + 0.010,
    address: `Roadside Shoulder Near Sector Interchange (${partnerLocation?.name || partnerLocation?.address || "Local City Area"})`,
    customerPhone: "+1 (555) 883-9912",
    notes: "Low voltage battery warning triggered. Vehicle safe on shoulder with hazard lights.",
  };

  // Nearby Fleet Garages & Dispatch Hubs in partner's area
  const nearbyFleetHubs: MapGarageItem[] = generateGaragesNearLocation(currentCoords.lat, currentCoords.lng, 6).map((g) => ({
    id: g.id,
    name: g.name,
    mechanicName: g.mechanicName,
    address: g.address,
    services: g.services,
    rating: g.rating,
    isOpen247: true,
    distance: g.distance,
    distanceKm: g.distanceKm,
    lat: g.lat,
    lng: g.lng,
    hourlyRate: 85,
  }));

  useEffect(() => {
    setActiveRequests(emergencyService.getActiveRequests());
    setCompletedRequests(emergencyService.getCompletedRequests());
  }, []);

  const handleAcceptJob = async () => {
    setActiveJob(sampleIncomingAlert);
    setHasIncomingRadarAlert(false);
    triggerConfetti({ particleCount: 70, spread: 60 });
    toast.success("Job Accepted! GPS turn-by-turn route initiated.");
    try {
      const route = await routingService.getRoute(
        currentCoords.lat,
        currentCoords.lng,
        sampleIncomingAlert.lat,
        sampleIncomingAlert.lng
      );
      if (route && route.coordinates.length > 0) {
        setActiveJobRoute(route.coordinates);
      } else {
        setActiveJobRoute([
          [currentCoords.lat, currentCoords.lng],
          [sampleIncomingAlert.lat, sampleIncomingAlert.lng],
        ]);
      }
    } catch {
      setActiveJobRoute([
        [currentCoords.lat, currentCoords.lng],
        [sampleIncomingAlert.lat, sampleIncomingAlert.lng],
      ]);
    }
  };

  const handleDeclineJob = () => {
    setHasIncomingRadarAlert(false);
    toast.info("Job passed to next available mobile unit.");
  };

  const handleCompleteJob = () => {
    const payout = activeJob?.payout || 49.0;
    setTodayEarnings((prev) => prev + payout);
    setCompletedJobsCount((prev) => prev + 1);
    triggerConfetti({ particleCount: 90, spread: 75 });
    toast.success(`Rescue completed! $${payout}.00 added to today's payout balance.`);
    setActiveJob(null);
    setActiveJobRoute(null);
  };

  const toggleOnlineStatus = () => {
    const next = !isOnline;
    setIsOnline(next);
    toast.info(next ? "Status: ONLINE & Receiving SOS Radar Dispatches" : "Status: OFFLINE");
  };

  const handleAcceptRequest = async (reqId: string) => {
    const target = activeRequests.find((r) => r.id === reqId);
    const updated = emergencyService.acceptRequest(reqId);
    setActiveRequests(updated);
    if (target) {
      setActiveJob({
        id: target.id,
        service: target.problem,
        customerName: target.userName,
        vehicle: target.vehicleType,
        distanceMiles: parseFloat(target.distance) || 1.8,
        etaMins: 8,
        payout: 49.0,
        address: target.location,
        customerPhone: target.userPhone,
        notes: `Urgency: ${target.urgency}`,
      });
      try {
        const route = await routingService.getRoute(37.7850, -122.4100, 37.7749, -122.4194);
        if (route) setActiveJobRoute(route.coordinates);
      } catch {}
    }
    toast.success("Dispatched to customer location");
  };

  const handleRejectRequest = (reqId: string) => {
    const updated = emergencyService.rejectRequest(reqId);
    setActiveRequests(updated);
    toast.info("Request declined");
  };

  const handleCompleteRequest = (reqId: string) => {
    const updated = emergencyService.completeRequest(reqId);
    setActiveRequests(updated);
    setCompletedRequests(emergencyService.getCompletedRequests());
    setTodayEarnings((prev) => prev + 49);
    setCompletedJobsCount((prev) => prev + 1);
    triggerConfetti({ particleCount: 80, spread: 70 });
    toast.success("Rescue marked completed!");
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary font-semibold">
              <Radio className="size-3.5 animate-pulse" /> Mobile Partner Operations Radar
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
              Mechanic Partner Portal
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Live roadside rescue dispatches, turn-by-turn navigation, and automated daily payouts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleOnlineStatus}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition shadow-sm ${
                isOnline
                  ? "border-success/40 bg-success/15 text-success ring-1 ring-success"
                  : "border-border/60 bg-muted text-muted-foreground"
              }`}
            >
              <span className="relative flex size-2.5">
                <span className={`absolute inline-flex size-full rounded-full ${isOnline ? "animate-ping bg-success opacity-75" : "bg-muted-foreground"}`} />
                <span className={`relative inline-flex size-2.5 rounded-full ${isOnline ? "bg-success" : "bg-muted-foreground"}`} />
              </span>
              <span>{isOnline ? "RADAR: ONLINE" : "RADAR: OFFLINE"}</span>
            </button>
          </div>
        </div>

        {/* 4 Performance Metric Cards */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="card-elev border-border/60 bg-card p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Today's Payout</span>
            <p className="mt-1 text-2xl sm:text-3xl font-bold text-success font-mono">${todayEarnings.toFixed(2)}</p>
            <span className="text-[10px] text-muted-foreground">Direct Bank Deposit</span>
          </Card>

          <Card className="card-elev border-border/60 bg-card p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Completed Rescues</span>
            <p className="mt-1 text-2xl sm:text-3xl font-bold text-foreground font-mono">{completedJobsCount}</p>
            <span className="text-[10px] text-success font-medium">100% Resolved</span>
          </Card>

          <Card className="card-elev border-border/60 bg-card p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Technician Rating</span>
            <p className="mt-1 text-2xl sm:text-3xl font-bold text-amber-500 font-mono">★ 4.95</p>
            <span className="text-[10px] text-muted-foreground">340+ Verified Reviews</span>
          </Card>

          <Card className="card-elev border-border/60 bg-card p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Average Arrival</span>
            <p className="mt-1 text-2xl sm:text-3xl font-bold text-primary font-mono">11 Mins</p>
            <span className="text-[10px] text-muted-foreground">Top 5% in Sector</span>
          </Card>
        </div>

        {/* Incoming Radar Emergency Dispatch Alert Banner */}
        {hasIncomingRadarAlert && isOnline && !activeJob && (
          <div className="mt-8">
            <Card className="card-elev relative overflow-hidden border-destructive/50 bg-destructive/10 p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-destructive/20 px-2.5 py-1 text-xs font-bold text-destructive">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-destructive" />
                    </span>
                    INCOMING PRIORITY SOS RADAR ALERT
                  </div>
                  <h2 className="mt-3 text-2xl font-bold">{sampleIncomingAlert.service}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Customer: <span className="font-semibold text-foreground">{sampleIncomingAlert.customerName}</span> · Vehicle: <span className="font-semibold text-foreground">{sampleIncomingAlert.vehicle}</span>
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="size-3.5 text-destructive" /> {sampleIncomingAlert.address} ({sampleIncomingAlert.distanceMiles} miles away · ~{sampleIncomingAlert.etaMins} mins)
                  </p>
                  <p className="mt-2 text-xs bg-destructive/15 rounded-lg p-2.5 text-foreground max-w-xl">
                    <strong>Reported Notes:</strong> &ldquo;{sampleIncomingAlert.notes}&rdquo;
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-muted-foreground">Guaranteed Payout</span>
                  <p className="text-3xl font-extrabold text-success font-mono">
                    +${sampleIncomingAlert.payout.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={handleAcceptJob} size="lg" className="grad-primary text-primary-foreground font-semibold shadow-lg">
                  <Check className="mr-2 size-4" /> Accept Job & Start Navigation
                </Button>
                <Button onClick={handleDeclineJob} variant="outline" size="lg" className="text-muted-foreground">
                  <X className="mr-2 size-4" /> Pass to Next Unit
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Active In-Progress Rescue Navigation */}
        {activeJob && (
          <div className="mt-8">
            <Card className="card-elev border-primary/50 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <Badge variant="outline" className="border-primary bg-primary/20 text-primary uppercase text-xs">
                    ACTIVE JOB IN TRANSIT
                  </Badge>
                  <h2 className="mt-2 text-2xl font-bold">{activeJob.service}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    En route to: <span className="font-semibold text-foreground">{activeJob.customerName}</span> ({activeJob.address})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="secondary">
                    <a href={`tel:${activeJob.customerPhone}`}>
                      <PhoneCall className="mr-1.5 size-3.5" /> Call Customer
                    </a>
                  </Button>
                  <Button onClick={handleCompleteJob} size="sm" className="bg-success text-success-foreground hover:bg-success/90">
                    <CheckCircle2 className="mr-1.5 size-3.5" /> Complete & Collect ${activeJob.payout}
                  </Button>
                </div>
              </div>

              {/* Navigation Telemetry Bar */}
              <div className="mt-6 grid grid-cols-3 gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 text-center text-xs">
                <div>
                  <p className="text-muted-foreground">Remaining Distance</p>
                  <p className="text-lg font-bold text-foreground">{activeJob.distanceKm || 2.2} km</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estimated Turn-by-Turn ETA</p>
                  <p className="text-lg font-bold text-primary font-mono">~{activeJob.etaMins || 7} MINS</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Live Driver GPS</p>
                  <p className="text-lg font-bold text-success font-semibold">STREAMING (±{Math.round(accuracy || 15)}m)</p>
                </div>
              </div>

              {/* Live Driving Route Map */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-border/60">
                <MechMap
                  userLocation={{
                    lat: activeJob.lat || currentCoords.lat + 0.012,
                    lng: activeJob.lng || currentCoords.lng + 0.01,
                    address: activeJob.address,
                  }}
                  mechanicLocation={{ lat: currentCoords.lat, lng: currentCoords.lng }}
                  mechanicInfo={{
                    name: "RapidRescue Van #12",
                    mechanicName: "Master Technician (You)",
                    garageName: "Apex Mobile Fleet",
                    phone: "+1 555-0199",
                    vehicle: "Mobile Diagnostic Unit #12",
                  }}
                  routeCoordinates={activeJobRoute}
                  showRoute={true}
                  activeRouteInfo={{
                    distance: `${activeJob.distanceKm || 2.2} km`,
                    eta: `${activeJob.etaMins || 7} mins`,
                  }}
                  onLocate={() => turnOnLocation()}
                  height="360px"
                />
              </div>
            </Card>
          </div>
        )}

        {/* Live Partner Operations Radar Screen */}
        {!activeJob && isOnline && (
          <div className="mt-8">
            <Card className="card-elev border-border/60 bg-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                    <Radio className="size-3.5 animate-pulse" /> Live Regional Operations Radar
                  </div>
                  <h2 className="text-lg font-bold text-foreground">Nearby Partner Fleet Network & Emergency Beacons</h2>
                  <p className="text-xs text-muted-foreground">
                    Monitoring 10 km rescue frequency around your technician coordinates ({currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-xs">
                    {nearbyFleetHubs.length} Support Hubs Online
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={() => turnOnLocation()} className="text-xs text-primary h-7">
                    <Navigation className="mr-1 size-3" /> Refresh GPS
                  </Button>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border/60">
                <MechMap
                  userLocation={{
                    lat: currentCoords.lat,
                    lng: currentCoords.lng,
                    accuracy: accuracy || 15,
                    address: partnerLocation?.name || "Your Current Technician Hub",
                  }}
                  garages={nearbyFleetHubs}
                  selectedGarage={nearbyFleetHubs[0]}
                  onLocate={() => turnOnLocation()}
                  height="350px"
                />
              </div>
            </Card>
          </div>
        )}

        {/* Job Management Tabs */}
        <div className="mt-10">
          <Tabs defaultValue="requests">
            <TabsList>
              <TabsTrigger value="requests">Pending Requests ({activeRequests.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed Rescues ({completedRequests.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="mt-4 space-y-3">
              {activeRequests.length === 0 ? (
                <Card className="card-elev border-border/60 bg-card p-10 text-center text-muted-foreground text-xs">
                  No active requests in queue.
                </Card>
              ) : (
                activeRequests.map((req) => (
                  <Card
                    key={req.id}
                    className="card-elev flex flex-col justify-between gap-4 border-border/60 bg-card p-5 sm:flex-row sm:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">{req.id}</span>
                        <Badge
                          variant={req.urgency.includes("Highway") ? "destructive" : "outline"}
                          className="text-[10px]"
                        >
                          {req.urgency}
                        </Badge>
                      </div>
                      <h3 className="mt-1 font-bold text-sm text-foreground">{req.problem}</h3>
                      <p className="text-xs text-muted-foreground">
                        Customer: <span className="font-semibold text-foreground">{req.userName}</span> ({req.userPhone}) · {req.vehicleType}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        <MapPin className="inline size-3 text-primary mr-1" />
                        {req.location} ({req.distance}) · {req.time}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {req.status === "ACCEPTED" ? (
                        <Button
                          size="sm"
                          onClick={() => handleCompleteRequest(req.id)}
                          className="bg-success text-success-foreground hover:bg-success/90"
                        >
                          <CheckCircle2 className="mr-1.5 size-3.5" /> Mark Completed
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRequest(req.id)}
                            className="grad-primary text-primary-foreground font-semibold"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectRequest(req.id)}
                            className="text-xs"
                          >
                            Decline
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-4 space-y-3">
              {completedRequests.map((item) => (
                <Card
                  key={item.id}
                  className="card-elev flex items-center justify-between border-border/60 bg-card p-4 text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-foreground">{item.userName} · {item.vehicleType}</p>
                    <p className="text-muted-foreground">{item.problem} · {item.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-success text-sm">{item.fee}</p>
                    <Badge variant="outline" className="text-[10px] text-success border-success/40">Paid</Badge>
                  </div>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
