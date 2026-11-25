import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Car, 
  Plus, 
  ShieldCheck, 
  Activity, 
  Wrench, 
  Calendar, 
  Clock, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  MapPin,
  Sparkles, 
  Cpu, 
  ArrowRight, 
  TrendingUp, 
  Fuel, 
  Disc, 
  BatteryCharging 
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { triggerConfetti } from "@/lib/confetti";
import { vehicleService } from "@/services/vehicleService";
import { mechanicService, type BookingItem } from "@/services/mechanicService";
import { type VehicleItem } from "@/services/mockData";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const [garageVehicles, setGarageVehicles] = useState<VehicleItem[]>([]);
  const [selectedVehicleIdx, setSelectedVehicleIdx] = useState(0);
  const [userBookings, setUserBookings] = useState<BookingItem[]>([]);
  const [addVehicleModalOpen, setAddVehicleModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState<BookingItem | null>(null);

  // New vehicle form
  const [newVin, setNewVin] = useState("");
  const [newMake, setNewMake] = useState("Honda");
  const [newModel, setNewModel] = useState("Civic");
  const [newYear, setNewYear] = useState("2022");
  const [newMileage, setNewMileage] = useState("32000");
  const [newPlate, setNewPlate] = useState("7XYZ892");
  const [isDecodingVin, setIsDecodingVin] = useState(false);
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);

  useEffect(() => {
    const vehicles = vehicleService.getGarageVehicles();
    setGarageVehicles(vehicles);
    const bookings = mechanicService.getUserBookings();
    setUserBookings(bookings);
  }, []);

  const currentVehicle = garageVehicles[selectedVehicleIdx] || garageVehicles[0];

  const handleVinDecode = async () => {
    if (!newVin.trim()) return;
    setIsDecodingVin(true);
    try {
      const decoded = await vehicleService.simulateVinLookup(newVin);
      setNewMake(decoded.make);
      setNewModel(decoded.model);
      setNewYear(String(decoded.year));
      toast.success(`Decoded VIN: ${decoded.year} ${decoded.make} ${decoded.model}`);
    } catch {
      toast.error("VIN lookup failed");
    } finally {
      setIsDecodingVin(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingVehicle(true);
    try {
      const newVeh = await vehicleService.addVehicle({
        make: newMake,
        model: newModel,
        year: newYear,
        mileage: newMileage,
        vin: newVin || "4T1B11HK" + Math.floor(100000 + Math.random() * 900000),
        licensePlate: newPlate,
        fuelType: "Gasoline",
      });

      const refreshed = vehicleService.getGarageVehicles();
      setGarageVehicles(refreshed);
      setSelectedVehicleIdx(0);
      setAddVehicleModalOpen(false);
      triggerConfetti({ particleCount: 70, spread: 60 });
      toast.success(`Added ${newVeh.year} ${newVeh.make} ${newVeh.model} to Digital Garage!`);
    } catch {
      toast.error("Error saving vehicle");
    } finally {
      setIsSavingVehicle(false);
    }
  };

  const handleDeleteVehicle = (vehId: string) => {
    const updated = vehicleService.deleteVehicle(vehId);
    setGarageVehicles(updated);
    setSelectedVehicleIdx(0);
    toast.info("Vehicle removed from garage");
  };

  const handleOpenInvoice = (bk: BookingItem) => {
    setSelectedBookingForInvoice(bk);
    setInvoiceModalOpen(true);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
              <Activity className="size-3.5" /> Predictive Telemetry & Garage Management
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
              Driver Digital Garage
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Real-time component wear telemetry, upcoming service intervals, and digital service records.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="secondary" className="gap-1.5">
              <Link to="/customer/nearby">
                <MapPin className="size-3.5 text-primary" />
                <span>Nearby Garages</span>
              </Link>
            </Button>
            <Button
              onClick={() => setAddVehicleModalOpen(true)}
              size="sm"
              className="grad-primary text-primary-foreground font-semibold"
            >
              <Plus className="mr-1.5 size-4" /> Add Vehicle
            </Button>
          </div>
        </div>

        {/* Vehicle Selection Chips */}
        {garageVehicles.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {garageVehicles.map((veh, idx) => (
              <button
                key={veh.id}
                type="button"
                onClick={() => setSelectedVehicleIdx(idx)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
                  selectedVehicleIdx === idx
                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                    : "border-border/60 bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                <Car className="size-4" />
                <span>{veh.year} {veh.make} {veh.model}</span>
                <Badge variant="outline" className="text-[10px] py-0">
                  {veh.healthScore}% Health
                </Badge>
              </button>
            ))}
          </div>
        )}

        {/* Current Vehicle Detail Showcase */}
        {currentVehicle && (
          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            {/* Overview Card */}
            <Card className="card-elev border-border/60 bg-card p-6 sm:p-8 lg:col-span-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">
                      {currentVehicle.year} {currentVehicle.make} {currentVehicle.model}
                    </h2>
                    <Badge variant="outline" className="border-success/40 bg-success/10 text-success text-xs">
                      {currentVehicle.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    VIN: <span className="font-mono">{currentVehicle.vin}</span> · Plate: <span className="font-bold">{currentVehicle.licensePlate}</span> · Mileage: <span className="font-semibold">{currentVehicle.mileage.toLocaleString()} mi</span>
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteVehicle(currentVehicle.id)}
                  className="text-xs text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="mr-1.5 size-3.5" /> Remove
                </Button>
              </div>

              {/* Component Wear Gauges */}
              <div className="mt-8">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Component Life Telemetry
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-center">
                    <BatteryCharging className="mx-auto size-5 text-primary" />
                    <p className="mt-2 text-xl font-bold">{currentVehicle.batteryHealth}%</p>
                    <p className="text-[11px] text-muted-foreground">12V Battery</p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-center">
                    <Fuel className="mx-auto size-5 text-amber-500" />
                    <p className="mt-2 text-xl font-bold">
                      {currentVehicle.oilLifePercent != null ? `${currentVehicle.oilLifePercent}%` : "N/A (EV)"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Synthetic Oil</p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-center">
                    <Disc className="mx-auto size-5 text-primary" />
                    <p className="mt-2 text-xl font-bold">{currentVehicle.brakePadLifePercent}%</p>
                    <p className="text-[11px] text-muted-foreground">Brake Pads</p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-center">
                    <Car className="mx-auto size-5 text-emerald-500" />
                    <p className="mt-2 text-xl font-bold">{currentVehicle.tyreTreadPercent}%</p>
                    <p className="text-[11px] text-muted-foreground">Tyre Tread</p>
                  </div>
                </div>
              </div>

              {/* Upcoming Service Intervals */}
              <div className="mt-8">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Upcoming Scheduled Maintenance
                </h3>
                <div className="mt-3 space-y-2.5">
                  {currentVehicle.upcomingServices.map((srv, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3.5 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="size-4 text-primary shrink-0" />
                        <div>
                          <p className="font-semibold text-foreground">{srv.item}</p>
                          <p className="text-[11px] text-muted-foreground">{srv.dueDate}</p>
                        </div>
                      </div>
                      <Badge
                        variant={srv.priority === "High" ? "destructive" : "outline"}
                        className="text-[10px]"
                      >
                        {srv.priority} Priority
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Quick Actions & AI Diagnosis Shortcut Card */}
            <div className="space-y-6 lg:col-span-4">
              <Card className="card-elev border-border/60 bg-card p-6">
                <h3 className="font-bold text-sm">Vehicle Quick Actions</h3>
                <div className="mt-4 space-y-2.5">
                  <Button asChild size="sm" className="w-full grad-primary text-primary-foreground justify-start">
                    <Link to="/diagnose">
                      <Sparkles className="mr-2 size-4" /> Run Multimodal AI Scan
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="w-full justify-start">
                    <Link to="/cost-estimator">
                      <Wrench className="mr-2 size-4" /> Estimate Repair Costs
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="w-full justify-start">
                    <Link to="/mechanics">
                      <Calendar className="mr-2 size-4" /> Book Certified Mechanic
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="destructive" className="w-full justify-start">
                    <Link to="/sos">
                      <Activity className="mr-2 size-4" /> Emergency Roadside SOS
                    </Link>
                  </Button>
                </div>
              </Card>

              {/* Overall Health Score Card */}
              <Card className="card-elev border-border/60 bg-gradient-to-br from-primary/10 via-card to-card p-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Overall Vehicle Health Score
                </p>
                <div className="mt-4 flex items-center justify-center">
                  <div className="grid size-28 place-items-center rounded-full border-4 border-primary bg-primary/10 text-3xl font-extrabold text-primary">
                    {currentVehicle.healthScore}
                    <span className="text-xs font-normal">/100</span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Evaluated using AI predictive telemetry model trained on 10,000+ vehicle maintenance logs.
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* User Bookings & Digital Invoices Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Service Bookings & Invoices</h2>
            <span className="text-xs text-muted-foreground">{userBookings.length} records found</span>
          </div>

          <div className="mt-4 space-y-3">
            {userBookings.map((bk) => (
              <Card
                key={bk.id}
                className="card-elev flex flex-col justify-between gap-4 border-border/60 bg-card p-5 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{bk.id}</span>
                    <Badge variant="outline" className="text-[10px]">{bk.status}</Badge>
                  </div>
                  <h3 className="mt-1 font-bold text-sm text-foreground">{bk.serviceName}</h3>
                  <p className="text-xs text-muted-foreground">
                    {bk.mechanicName} · {bk.mechanicAddress}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Date: <span className="font-semibold">{bk.date}</span> at <span className="font-semibold">{bk.timeSlot}</span> · Vehicle: {bk.vehicleName}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-primary">${bk.estimatedTotal}.00</span>
                  <Button
                    onClick={() => handleOpenInvoice(bk)}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    <FileText className="mr-1.5 size-3.5" /> View Invoice
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* ADD VEHICLE MODAL */}
        <Dialog open={addVehicleModalOpen} onOpenChange={setAddVehicleModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Add Vehicle to Digital Garage</DialogTitle>
              <DialogDescription className="text-xs">
                Enter your VIN to auto-decode make, model, and engine specs or enter manually.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddVehicle} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground">VIN (17 Characters)</label>
                <div className="mt-1 flex gap-2">
                  <Input
                    className="uppercase text-xs font-mono"
                    placeholder="e.g. 5YJ3E1EB6PF928174..."
                    value={newVin}
                    onChange={(e) => setNewVin(e.target.value.toUpperCase())}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleVinDecode}
                    disabled={isDecodingVin || !newVin.trim()}
                  >
                    {isDecodingVin ? "Decoding..." : "Decode"}
                  </Button>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">Try starting with 5YJ (Tesla), WBA (BMW), or 2T3 (Toyota)</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground">Make</label>
                  <Input className="mt-1 text-xs" value={newMake} onChange={(e) => setNewMake(e.target.value)} required />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground">Model</label>
                  <Input className="mt-1 text-xs" value={newModel} onChange={(e) => setNewModel(e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground">Year</label>
                  <Input type="number" className="mt-1 text-xs" value={newYear} onChange={(e) => setNewYear(e.target.value)} required />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground">Mileage (Miles)</label>
                  <Input type="number" className="mt-1 text-xs" value={newMileage} onChange={(e) => setNewMileage(e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground">License Plate</label>
                <Input className="mt-1 text-xs uppercase" value={newPlate} onChange={(e) => setNewPlate(e.target.value.toUpperCase())} required />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setAddVehicleModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSavingVehicle} className="grad-primary text-primary-foreground font-semibold">
                  Save Vehicle
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* INVOICE MODAL */}
        <Dialog open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Automobile-Mech-AI Digital Invoice</DialogTitle>
              <DialogDescription className="text-xs">
                Ref: {selectedBookingForInvoice?.id} · Verified Work Order
              </DialogDescription>
            </DialogHeader>

            {selectedBookingForInvoice && (
              <div className="mt-4 space-y-4 text-xs">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Workshop:</span>
                    <span className="font-semibold text-foreground">{selectedBookingForInvoice.mechanicName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address:</span>
                    <span>{selectedBookingForInvoice.mechanicAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicle:</span>
                    <span>{selectedBookingForInvoice.vehicleName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date & Slot:</span>
                    <span>{selectedBookingForInvoice.date} at {selectedBookingForInvoice.timeSlot}</span>
                  </div>
                </div>

                <div className="border-t border-border/60 pt-3 space-y-2">
                  <div className="flex justify-between font-medium">
                    <span>{selectedBookingForInvoice.serviceName}</span>
                    <span>${selectedBookingForInvoice.estimatedTotal}.00</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Standard Platform Tech Fee</span>
                    <span className="text-success">WAIVED ($0.00)</span>
                  </div>
                  <div className="border-t border-border/60 pt-2 flex justify-between font-bold text-sm text-primary">
                    <span>Total Paid / Due:</span>
                    <span>${selectedBookingForInvoice.estimatedTotal}.00</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button size="sm" variant="outline" onClick={() => setInvoiceModalOpen(false)}>
                    Close Invoice
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
