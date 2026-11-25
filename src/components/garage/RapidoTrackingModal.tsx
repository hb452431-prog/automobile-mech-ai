import { useState, useEffect } from "react";
import { 
  Wrench, 
  BatteryCharging, 
  Disc, 
  Fuel, 
  Truck, 
  Phone, 
  MessageSquare, 
  X, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  Radio, 
  Navigation, 
  Star,
  Car,
  Bike
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { triggerConfetti } from "@/lib/confetti";
import type { MapGarageItem } from "@/components/map/MechMap";

export interface RapidoServiceOption {
  id: string;
  name: string;
  desc: string;
  priceInr: number;
  priceUsd: number;
  timeEst: string;
  icon: any;
}

export const RAPIDO_SERVICES: RapidoServiceOption[] = [
  {
    id: "battery",
    name: "Battery Jumpstart",
    desc: "12V jump boost or rapid charging",
    priceInr: 299,
    priceUsd: 35,
    timeEst: "10-15 mins",
    icon: BatteryCharging,
  },
  {
    id: "puncture",
    name: "Flat Tyre / Puncture",
    desc: "On-spot tubeless puncture or stepney swap",
    priceInr: 349,
    priceUsd: 42,
    timeEst: "15-20 mins",
    icon: Disc,
  },
  {
    id: "engine",
    name: "Engine Breakdown & OBD Scan",
    desc: "ECU sensor diagnostics & minor roadside fix",
    priceInr: 499,
    priceUsd: 59,
    timeEst: "20-25 mins",
    icon: Wrench,
  },
  {
    id: "fuel",
    name: "Emergency Fuel Delivery",
    desc: "5 Litres of clean Petrol or Diesel brought to you",
    priceInr: 350,
    priceUsd: 40,
    timeEst: "15 mins",
    icon: Fuel,
  },
  {
    id: "towing",
    name: "Flatbed Recovery Tow",
    desc: "Safe hydraulic flatbed tow to certified workshop",
    priceInr: 799,
    priceUsd: 89,
    timeEst: "Immediate",
    icon: Truck,
  },
];

export interface ActiveRapidoBooking {
  id: string;
  garage: MapGarageItem;
  mechanicName: string;
  service: RapidoServiceOption;
  vehicleType: "bike" | "scooter" | "car" | "suv";
  otp: string;
  startTime: number;
  status: "searching" | "accepted" | "en_route" | "arrived" | "completed";
  technicianVehicle: string;
  technicianPlate: string;
  technicianRating: number;
  totalFareInr: number;
  totalFareUsd: number;
  etaMinutes: number;
}

interface RapidoTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  garage: MapGarageItem | null;
  userLocation: { lat: number; lng: number; address?: string } | null;
  onStartBooking: (booking: ActiveRapidoBooking) => void;
  activeBooking: ActiveRapidoBooking | null;
  onCancelBooking: () => void;
  onSimulateArrival: () => void;
  onCompleteService: () => void;
}

export function RapidoTrackingModal({
  isOpen,
  onClose,
  garage,
  userLocation,
  onStartBooking,
  activeBooking,
  onCancelBooking,
  onSimulateArrival,
  onCompleteService,
}: RapidoTrackingModalProps) {
  const [selectedService, setSelectedService] = useState<RapidoServiceOption>(RAPIDO_SERVICES[0]);
  const [vehicleType, setVehicleType] = useState<"bike" | "scooter" | "car" | "suv">("bike");
  const [isSearching, setIsSearching] = useState(false);

  // If no garage selected and no active booking, don't show
  if (!isOpen || (!garage && !activeBooking)) return null;

  const currentGarage = activeBooking?.garage || garage!;

  const handleConfirmAndSearch = () => {
    setIsSearching(true);
    // Simulate Rapido radar driver assignment
    setTimeout(() => {
      setIsSearching(false);
      triggerConfetti({ particleCount: 80, spread: 70 });

      const newBooking: ActiveRapidoBooking = {
        id: `RAP-${Math.floor(100000 + Math.random() * 900000)}`,
        garage: currentGarage,
        mechanicName: currentGarage.mechanicName || "Rahul Sharma",
        service: selectedService,
        vehicleType,
        otp: `${Math.floor(1000 + Math.random() * 9000)}`,
        startTime: Date.now(),
        status: "accepted",
        technicianVehicle: "Bajaj Pulsar 150 · Service Toolkit",
        technicianPlate: "KA 05 ME 2026",
        technicianRating: 4.92,
        totalFareInr: selectedService.priceInr,
        totalFareUsd: selectedService.priceUsd,
        etaMinutes: 6,
      };

      onStartBooking(newBooking);
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        style={{
          boxShadow: "0 -10px 40px rgba(0,0,0,0.45)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl grad-primary flex items-center justify-center text-primary-foreground font-black text-sm shadow-md">
              ⚡
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-foreground flex items-center gap-1.5">
                Rapido Mechanic Dispatch
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-500 text-[10px] font-bold">
                  LIVE TRACKING
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">
                Nearest mobile unit from {currentGarage.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* STATE 1: SEARCHING RADAR ANIMATION */}
        {isSearching && (
          <div className="py-10 text-center space-y-4">
            <div className="relative mx-auto size-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-60" />
              <div className="absolute inset-2 rounded-full border-2 border-primary/40 animate-pulse" />
              <div className="size-16 rounded-full grad-primary flex items-center justify-center text-3xl shadow-xl text-primary-foreground">
                🏍️
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Contacting Nearest Mobile Mechanic...</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Broadcasting dispatch to technicians within 2 km of your location
              </p>
            </div>
          </div>
        )}

        {/* STATE 2: ACTIVE BOOKING & LIVE TRACKING HUD */}
        {!isSearching && activeBooking && (
          <div className="space-y-4">
            {/* Arrival Banner / OTP */}
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  {activeBooking.status === "arrived" ? "Mechanic Arrived" : "Ride / Service Safety OTP"}
                </p>
                <p className="text-2xl font-mono font-black text-foreground tracking-widest mt-0.5">
                  {activeBooking.otp}
                </p>
              </div>
              <div className="text-right">
                <Badge className="grad-primary text-primary-foreground font-black text-xs px-2.5 py-1">
                  {activeBooking.status === "arrived" ? "AT LOCATION" : `ETA ~${activeBooking.etaMinutes} MINS`}
                </Badge>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Share OTP with mechanic
                </p>
              </div>
            </div>

            {/* Mechanic & Vehicle Profile Card (Rapido Style) */}
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative size-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shadow-inner">
                    👨‍🔧
                    <span className="absolute -bottom-1 -right-1 size-3.5 rounded-full bg-success border-2 border-background" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-sm text-foreground">{activeBooking.mechanicName}</h4>
                      <div className="flex items-center text-amber-500 text-xs font-bold">
                        <Star className="size-3 fill-current inline" />
                        <span>{activeBooking.technicianRating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activeBooking.technicianVehicle}
                    </p>
                    <p className="text-[11px] font-mono font-bold text-primary mt-0.5">
                      {activeBooking.technicianPlate}
                    </p>
                  </div>
                </div>

                {/* Call Mechanic Button */}
                <Button asChild size="sm" className="rounded-xl grad-primary text-primary-foreground font-bold shadow-md h-10 px-3.5">
                  <a href={`tel:${currentGarage.phone || "+919876543210"}`}>
                    <Phone className="size-4 mr-1.5 text-white" /> Call
                  </a>
                </Button>
              </div>

              {/* Progress Stepper */}
              <div className="pt-2 border-t border-border/40">
                <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground mb-1.5">
                  <span className={activeBooking.status !== "searching" ? "text-primary font-black" : ""}>Accepted</span>
                  <span className={activeBooking.status === "en_route" || activeBooking.status === "arrived" ? "text-primary font-black" : ""}>On The Way</span>
                  <span className={activeBooking.status === "arrived" ? "text-success font-black" : ""}>Arrived</span>
                </div>
                <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                  <div 
                    className="h-full grad-primary transition-all duration-500" 
                    style={{ 
                      width: activeBooking.status === "arrived" ? "100%" : activeBooking.status === "en_route" ? "65%" : "25%" 
                    }} 
                  />
                </div>
              </div>
            </div>

            {/* Service & Payment Summary */}
            <div className="flex items-center justify-between text-xs p-3 rounded-xl border border-border/40 bg-background/60">
              <div className="flex items-center gap-2">
                <selectedService.icon className="size-4 text-primary" />
                <span className="font-bold text-foreground">{activeBooking.service.name}</span>
                <span className="text-muted-foreground">({activeBooking.vehicleType.toUpperCase()})</span>
              </div>
              <div className="text-right font-mono font-extrabold text-foreground">
                ₹{activeBooking.totalFareInr} / ${activeBooking.totalFareUsd}
                <span className="block text-[10px] text-muted-foreground font-normal">Cash / UPI on Finish</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              {activeBooking.status !== "arrived" ? (
                <Button 
                  onClick={onSimulateArrival}
                  variant="outline" 
                  size="sm" 
                  className="h-10 text-xs font-bold border-primary/40 hover:bg-primary/10 text-primary"
                >
                  ⏩ Fast-Forward Arrival
                </Button>
              ) : (
                <Button 
                  onClick={onCompleteService}
                  size="sm" 
                  className="h-10 text-xs font-extrabold bg-success hover:bg-success/90 text-white shadow-md"
                >
                  <CheckCircle2 className="size-4 mr-1.5" /> Service Completed
                </Button>
              )}

              <Button 
                onClick={onCancelBooking}
                variant="destructive" 
                size="sm" 
                className="h-10 text-xs font-bold"
              >
                Cancel Booking
              </Button>
            </div>
          </div>
        )}

        {/* STATE 3: PRE-BOOKING SELECTION FORM */}
        {!isSearching && !activeBooking && (
          <div className="space-y-4">
            {/* Selected Garage Info Banner */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/50">
              <div>
                <h4 className="font-bold text-sm text-foreground">{currentGarage.name}</h4>
                <p className="text-xs text-muted-foreground">
                  Chief Tech: <strong>{currentGarage.mechanicName || "Suresh Kumar"}</strong> · {currentGarage.distance || "1.2 km"} away
                </p>
              </div>
              <div className="text-right text-xs">
                <span className="text-amber-500 font-extrabold">★ {currentGarage.rating || 4.9}</span>
                <span className="block text-[11px] text-success font-semibold">● Available Now</span>
              </div>
            </div>

            {/* Vehicle Selector */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                Select Your Vehicle
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "bike", label: "Bike", icon: "🏍️" },
                  { id: "scooter", label: "Scooter", icon: "🛵" },
                  { id: "car", label: "Car", icon: "🚗" },
                  { id: "suv", label: "SUV / 4x4", icon: "🚙" },
                ].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVehicleType(v.id as any)}
                    className={`py-2.5 px-2 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                      vehicleType === v.id
                        ? "border-primary bg-primary/10 text-primary font-extrabold shadow-sm"
                        : "border-border/60 bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="text-xl">{v.icon}</span>
                    <span className="text-[11px] font-bold">{v.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Services List */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                Select Emergency Roadside Service
              </label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {RAPIDO_SERVICES.map((s) => {
                  const IconComp = s.icon;
                  const isSelected = selectedService.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedService(s)}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border/60 bg-background hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? "grad-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                          <IconComp className="size-5" />
                        </div>
                        <div>
                          <p className="font-extrabold text-xs text-foreground">{s.name}</p>
                          <p className="text-[11px] text-muted-foreground">{s.desc}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono font-black text-xs text-foreground">
                          ₹{s.priceInr} <span className="text-[10px] text-muted-foreground font-normal">/ ${s.priceUsd}</span>
                        </p>
                        <span className="text-[10px] font-semibold text-primary">{s.timeEst}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fare Summary & Instant Booking Button */}
            <div className="pt-2 border-t border-border/60 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Estimated Arrival Time:</span>
                <span className="font-bold text-foreground flex items-center gap-1">
                  <Clock className="size-3.5 text-primary" /> ~6 - 8 Minutes
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total Roadside Service Fare:</span>
                <span className="font-mono font-black text-sm text-primary">
                  ₹{selectedService.priceInr}.00 / ${selectedService.priceUsd}.00
                </span>
              </div>

              <Button
                onClick={handleConfirmAndSearch}
                size="lg"
                className="w-full h-12 rounded-2xl grad-primary text-primary-foreground font-extrabold shadow-lg text-sm cursor-pointer"
              >
                <span>⚡</span>
                <span className="ml-1.5">Book Mechanic Now (Rapido Dispatch)</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
