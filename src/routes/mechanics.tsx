import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Search, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Wrench, 
  Calendar, 
  Clock, 
  DollarSign, 
  Filter, 
  ArrowRight, 
  CheckCircle2, 
  X, 
  Navigation, 
  PhoneCall, 
  Award, 
  Sparkles,
  Phone,
  Map as MapIcon,
  LayoutGrid
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MechMap } from "@/components/map/MechMap";
import { LocationStatusBar } from "@/components/common/LocationStatusBar";
import { LocationPermissionModal } from "@/components/common/LocationPermissionModal";
import { useLocation } from "@/hooks/useLocation";
import { triggerConfetti } from "@/lib/confetti";
import { calculateDistanceKm, routingService, calculateETA } from "@/services/routingService";
import { mechanicService, type BookingItem } from "@/services/mechanicService";
import { MOCK_MECHANICS, type MechanicItem, MOCK_VEHICLES } from "@/services/mockData";

export const Route = createFileRoute("/mechanics")({
  component: MechanicsPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      service: (search.service as string) || "",
      selected: (search.selected as string) || "",
    };
  },
});

function MechanicsPage() {
  const searchParams = useSearch({ from: "/mechanics" });
  const [searchQuery, setSearchQuery] = useState(searchParams.service || "");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [is247Only, setIs247Only] = useState(false);
  const [isMobileOnly, setIsMobileOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"rating" | "distance" | "price">("rating");
  const [viewMode, setViewMode] = useState<"both" | "grid" | "map">("both");
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const {
    location: userLocation,
    accuracy,
    loading: isLocating,
    error: locationError,
    permission,
    tracking,
    isManual,
    deviceInfo,
    turnOnLocation,
    fetchIPLocation,
    setManualLocation,
  } = useLocation({ autoRequest: true, enableHighAccuracy: true, allowIPFallback: true, watch: true });

  const [mechanicsList, setMechanicsList] = useState<MechanicItem[]>(MOCK_MECHANICS);
  const [selectedMechanic, setSelectedMechanic] = useState<MechanicItem>(MOCK_MECHANICS[0]);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<[number, number]> | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; eta: string } | null>(null);

  // Modal states
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Booking form state
  const [bookingService, setBookingService] = useState("");
  const [bookingDate, setBookingDate] = useState("2026-11-28");
  const [bookingTime, setBookingTime] = useState("10:00 AM");
  const [bookingVehicle, setBookingVehicle] = useState("2023 Tesla Model Y");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  useEffect(() => {
    const filtered = mechanicService.getAllMechanics({
      search: searchQuery,
      specialty: selectedSpecialty,
      is247Only,
      isMobileOnly,
      sortBy,
    });

    if (userLocation && typeof userLocation.lat === "number" && typeof userLocation.lng === "number") {
      const offsets = [
        { dLat: 0.007, dLng: 0.008, area: "Metro Center & Commercial Sector" },
        { dLat: -0.011, dLng: 0.013, area: "Outer Ring Bypass Road" },
        { dLat: 0.014, dLng: -0.012, area: "City Center Expressway Exit" },
        { dLat: -0.016, dLng: -0.015, area: "Tech Park Avenue" },
        { dLat: 0.021, dLng: 0.019, area: "Industrial Zone Phase 1" },
        { dLat: -0.023, dLng: 0.006, area: "Commercial Transit Plaza" },
        { dLat: 0.010, dLng: -0.021, area: "Grand Trunk Highway Hub" },
        { dLat: -0.014, dLng: 0.026, area: "Skyline Boulevard" },
      ];

      const withDistance = filtered.map((m, idx) => {
        const off = offsets[idx % offsets.length];
        const mLat = userLocation.lat + off.dLat;
        const mLng = userLocation.lng + off.dLng;
        const d = calculateDistanceKm(userLocation.lat, userLocation.lng, mLat, mLng);
        return {
          ...m,
          lat: mLat,
          lng: mLng,
          address: `${off.area} (Nearby)`,
          distanceKm: Number(d.toFixed(1)),
        };
      });
      if (sortBy === "distance") {
        withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
      }
      setMechanicsList(withDistance);
      if (withDistance.length > 0 && (!selectedMechanic || selectedMechanic.id === MOCK_MECHANICS[0].id)) {
        setSelectedMechanic(withDistance[0]);
      }
    } else {
      setMechanicsList(filtered);
    }

    if (searchParams.selected) {
      const match = MOCK_MECHANICS.find((m) => m.id === searchParams.selected);
      if (match) setSelectedMechanic(match);
    }
  }, [searchQuery, selectedSpecialty, is247Only, isMobileOnly, sortBy, searchParams.selected, userLocation]);

  // Turn-by-turn route tracking between user's live GPS and selected mechanic
  useEffect(() => {
    if (
      !userLocation ||
      !selectedMechanic ||
      typeof userLocation.lat !== "number" ||
      typeof selectedMechanic.lat !== "number"
    ) {
      setRouteCoordinates(null);
      setRouteInfo(null);
      return;
    }

    let isMounted = true;
    routingService
      .getRoute(userLocation.lat, userLocation.lng, selectedMechanic.lat, selectedMechanic.lng)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.coordinates.length > 0) {
          setRouteCoordinates(res.coordinates);
          setRouteInfo({ distance: res.distanceFormatted, eta: res.durationFormatted });
        } else {
          const d = calculateDistanceKm(userLocation.lat, userLocation.lng, selectedMechanic.lat, selectedMechanic.lng);
          setRouteCoordinates([
            [userLocation.lat, userLocation.lng],
            [selectedMechanic.lat, selectedMechanic.lng],
          ]);
          setRouteInfo({ distance: `${d.toFixed(1)} km`, eta: calculateETA(d) });
        }
      })
      .catch(() => {
        if (!isMounted) return;
        const d = calculateDistanceKm(userLocation.lat, userLocation.lng, selectedMechanic.lat, selectedMechanic.lng);
        setRouteCoordinates([
          [userLocation.lat, userLocation.lng],
          [selectedMechanic.lat, selectedMechanic.lng],
        ]);
        setRouteInfo({ distance: `${d.toFixed(1)} km`, eta: calculateETA(d) });
      });

    return () => {
      isMounted = false;
    };
  }, [selectedMechanic, userLocation]);

  const handleOpenBooking = (mech: MechanicItem) => {
    setSelectedMechanic(mech);
    setBookingService(mech.services[0]?.name || "Full AI Diagnostic & OBD-II Scan");
    setBookingModalOpen(true);
  };

  const handleOpenProfile = (mech: MechanicItem) => {
    setSelectedMechanic(mech);
    setProfileModalOpen(true);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBooking(true);
    try {
      const srv = selectedMechanic.services.find((s) => s.name === bookingService) || selectedMechanic.services[0];
      const newBooking = await mechanicService.createBooking({
        mechanicId: selectedMechanic.id,
        mechanicName: selectedMechanic.name,
        mechanicAddress: selectedMechanic.address,
        serviceName: bookingService || srv?.name || "General Inspection",
        date: bookingDate,
        timeSlot: bookingTime,
        vehicleName: bookingVehicle,
        estimatedTotal: srv?.price || 65,
      });

      setBookingModalOpen(false);
      triggerConfetti({ particleCount: 70, spread: 60 });
      toast.success(`Appointment Confirmed! Ref: ${newBooking.id}`);
    } catch {
      toast.error("Failed to book appointment");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const specialtiesList = [
    "all",
    "EV & Hybrid",
    "Engine Diagnostics",
    "Brakes & Rotors",
    "Emergency Roadside",
    "German Imports",
    "Transmission",
    "Heavy Towing",
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary font-semibold">
              <ShieldCheck className="size-3.5 text-success" /> Certified Automotive Network
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
              Verified Mechanics & Garages
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Discover ASE certified master technicians, mobile emergency workshops, and specialized import labs near you.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex rounded-lg border border-border/60 bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setViewMode("both")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  viewMode === "both" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Split
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  viewMode === "map" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MapIcon className="size-3" /> Map
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  viewMode === "grid" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="size-3" /> Grid
              </button>
            </div>

            <Button asChild size="sm" className="grad-primary text-primary-foreground">
              <Link to="/sos">
                Emergency SOS
              </Link>
            </Button>
          </div>
        </div>

        {/* Real-time Automotive Location Telemetry Bar */}
        <div className="mt-6">
          <LocationStatusBar
            location={userLocation}
            accuracy={accuracy}
            loading={isLocating}
            error={locationError}
            permission={permission}
            tracking={tracking}
            isManual={isManual}
            onRequestPermission={turnOnLocation}
            onRefreshLocation={turnOnLocation}
            onOpenManualModal={() => setShowPermissionModal(true)}
          />
        </div>

        {/* Filter Controls Bar */}
        <Card className="card-elev mt-6 border-border/60 bg-card p-4 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search garages, technicians, specialties, or addresses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-md border border-input bg-background px-3 py-2 text-xs"
              >
                <option value="rating">Top Rated (★ 4.9+)</option>
                <option value="distance">Nearest Distance</option>
                <option value="price">Lowest Hourly Rate</option>
              </select>
            </div>
          </div>

          {/* Specialty Filter Chips & Toggle Options */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-1">Specialty:</span>
              {specialtiesList.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => setSelectedSpecialty(spec)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    selectedSpecialty === spec
                      ? "grad-primary text-primary-foreground font-semibold"
                      : "border border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  {spec === "all" ? "All Specialties" : spec}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs font-medium">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={is247Only}
                  onChange={(e) => setIs247Only(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                <span>Open 24/7</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMobileOnly}
                  onChange={(e) => setIsMobileOnly(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                <span>Mobile Units Only</span>
              </label>
            </div>
          </div>
        </Card>

        {/* INTERACTIVE LEAFLET / OPENSTREETMAP MAP */}
        {(viewMode === "both" || viewMode === "map") && (
          <div className="mt-6">
            <MechMap
              userLocation={userLocation}
              garages={mechanicsList.map((m) => ({
                id: m.id,
                name: m.name,
                mechanicName: m.owner,
                address: m.address,
                services: m.services.map((s) => s.name),
                rating: m.rating,
                isOpen247: m.isOpen247,
                distance: `${m.distanceKm} km away`,
                distanceKm: m.distanceKm,
                lat: m.lat,
                lng: m.lng,
                hourlyRate: m.hourlyRate,
              }))}
              selectedGarage={{
                id: selectedMechanic.id,
                name: selectedMechanic.name,
                lat: selectedMechanic.lat,
                lng: selectedMechanic.lng,
              }}
              routeCoordinates={routeCoordinates}
              showRoute={!!routeCoordinates}
              activeRouteInfo={routeInfo}
              onSelectGarage={(g) => {
                const match = mechanicsList.find((m) => m.id === g.id);
                if (match) setSelectedMechanic(match);
              }}
              onLocate={() => turnOnLocation()}
              height={viewMode === "map" ? "620px" : "440px"}
            />
          </div>
        )}

        {/* Results Count */}
        <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {mechanicsList.length} verified workshops</span>
          <span>Click any pin on the map or card below to view details and book</span>
        </div>

        {/* Mechanics Cards Grid */}
        {(viewMode === "both" || viewMode === "grid") && (
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {mechanicsList.map((mech) => {
              const isSelected = selectedMechanic.id === mech.id;
              return (
                <Card
                  key={mech.id}
                  onClick={() => setSelectedMechanic(mech)}
                  className={`card-elev flex flex-col justify-between border-border/60 bg-card p-6 transition cursor-pointer ${
                    isSelected ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"
                  }`}
                >
                  <div>
                    {/* Top Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3.5">
                        <img
                          src={mech.image}
                          alt={mech.name}
                          className="size-16 rounded-xl object-cover border border-border/60 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-base leading-snug">{mech.name}</h3>
                            {mech.verifiedBadge && (
                              <ShieldCheck className="size-4 text-success shrink-0" title="Verified Workshop" />
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{mech.owner}</p>
                          <div className="mt-1 flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1 font-bold text-amber-500">
                              <Star className="size-3.5 fill-amber-500" /> {mech.rating}
                              <span className="text-muted-foreground font-normal">({mech.reviewCount})</span>
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-primary font-medium">{mech.distanceKm} km away</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="font-semibold">${mech.hourlyRate}/hr</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {mech.isOpen247 ? (
                          <Badge className="bg-success/15 text-success border-success/30 font-semibold text-[10px]">
                            24/7 OPEN
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            ~{mech.responseTimeMins} min response
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="size-3.5 text-primary shrink-0" />
                      {mech.address}
                    </p>

                    {/* Specialties Badges */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {mech.specialties.map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px]">
                          {s}
                        </Badge>
                      ))}
                    </div>

                    {/* Popular Services Menu */}
                    <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1.5 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Menu & Rates
                      </span>
                      {mech.services.slice(0, 3).map((srv) => (
                        <div key={srv.name} className="flex justify-between items-center text-muted-foreground">
                          <span className="truncate pr-2">{srv.name} ({srv.duration})</span>
                          <span className="font-semibold text-foreground shrink-0">${srv.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenBooking(mech);
                      }}
                      size="sm"
                      className="flex-1 grad-primary text-primary-foreground font-semibold"
                    >
                      <Calendar className="mr-1.5 size-4" /> Book Appointment
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenProfile(mech);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Profile & Reviews
                    </Button>
                    <Button asChild variant="secondary" size="sm" onClick={(e) => e.stopPropagation()}>
                      <a href={`tel:${mech.phone}`}>
                        <Phone className="size-3.5" />
                      </a>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* BOOKING MODAL */}
        <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Book Service Appointment</DialogTitle>
              <DialogDescription className="text-xs">
                {selectedMechanic.name} · {selectedMechanic.address}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmBooking} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground">Select Service Required</label>
                <select
                  value={bookingService}
                  onChange={(e) => setBookingService(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                >
                  {selectedMechanic.services.map((srv) => (
                    <option key={srv.name} value={srv.name}>
                      {srv.name} — ${srv.price} ({srv.duration})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground">Your Vehicle</label>
                <Input
                  className="mt-1.5 text-xs"
                  value={bookingVehicle}
                  onChange={(e) => setBookingVehicle(e.target.value)}
                  placeholder="e.g. 2023 Tesla Model Y"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground">Preferred Date</label>
                  <Input
                    type="date"
                    className="mt-1.5 text-xs"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground">Preferred Time</label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="01:00 PM">01:00 PM</option>
                    <option value="03:30 PM">03:30 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-muted-foreground">
                <div className="flex justify-between font-semibold text-foreground">
                  <span>Transparent Price Estimate:</span>
                  <span className="text-primary font-bold">
                    ${selectedMechanic.services.find((s) => s.name === bookingService)?.price || 65}.00
                  </span>
                </div>
                <p className="mt-1 text-[11px]">Free cancellation up to 2 hours before scheduled slot.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setBookingModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmittingBooking} className="grad-primary text-primary-foreground font-semibold">
                  Confirm Booking
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* PROFILE & REVIEWS MODAL */}
        <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">{selectedMechanic.name}</DialogTitle>
              <DialogDescription className="text-xs">
                {selectedMechanic.owner} · {selectedMechanic.experienceYears} Years Master Experience
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs">
              <div className="flex gap-4">
                <img src={selectedMechanic.image} alt={selectedMechanic.name} className="size-20 rounded-xl object-cover border" />
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{selectedMechanic.address}</p>
                  <p className="text-muted-foreground">Direct Phone: <a href={`tel:${selectedMechanic.phone}`} className="text-primary font-bold">{selectedMechanic.phone}</a></p>
                  <p className="text-muted-foreground">Standard Labor Rate: <span className="text-foreground font-bold">${selectedMechanic.hourlyRate}/hour</span></p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-muted-foreground uppercase text-[10px]">Certifications & Accreditations</h4>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedMechanic.certifications.map((c) => (
                    <Badge key={c} variant="outline" className="border-primary/40 bg-primary/10 text-primary text-xs">
                      <Award className="mr-1 size-3" /> {c}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-muted-foreground uppercase text-[10px]">All Services Offered</h4>
                <div className="mt-2 divide-y divide-border/60 rounded-xl border border-border/60 bg-muted/20">
                  {selectedMechanic.services.map((s) => (
                    <div key={s.name} className="flex justify-between p-2.5">
                      <span className="font-medium text-foreground">{s.name}</span>
                      <span className="font-bold text-primary">${s.price} ({s.duration})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* LOCATION PERMISSION / CITY SELECTION MODAL */}
        <LocationPermissionModal
          isOpen={showPermissionModal}
          onClose={() => setShowPermissionModal(false)}
          onRequestPermission={turnOnLocation}
          onUseIPLocation={fetchIPLocation}
          onManualSelect={(lat, lng, name) => setManualLocation(lat, lng, name)}
          error={locationError}
          permission={permission}
          loading={isLocating}
          deviceInfo={deviceInfo}
        />
      </main>
    </div>
  );
}
