import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { geocodeAddress } from "@/lib/geocode";

const SERVICE_OPTIONS = [
  "Bike repair", "Car repair", "Engine service", "Oil change",
  "Battery service", "Tyre puncture / tyre replacement", "Brake service",
  "Electrical repair", "AC repair", "Emergency roadside help",
];

export const Route = createFileRoute("/mechanic/register")({ component: MechanicRegister });

function MechanicRegister() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [geo, setGeo] = useState<{ lat?: number; lng?: number }>({});
  const [f, setF] = useState({
    full_name: "", garage_name: "", address: "", city: "", state: "", pincode: "",
    phone: "", alternate_phone: "", experience_years: 0, working_hours: "9AM-8PM",
    services: [] as string[], custom_service: "",
  });

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);

  const toggleSvc = (s: string) => setF((p) => ({
    ...p, services: p.services.includes(s) ? p.services.filter(x => x !== s) : [...p.services, s]
  }));

  const detectLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not available");
    navigator.geolocation.getCurrentPosition(
      (p) => { setGeo({ lat: p.coords.latitude, lng: p.coords.longitude }); toast.success("Location captured"); },
      () => toast.error("Location permission denied"),
    );
  };

  const geocode = async () => {
    if (!f.address || !f.city) return toast.error("Enter address and city first");
    setBusy(true);
    const res = await geocodeAddress(`${f.address}, ${f.city}, ${f.state} ${f.pincode}`);
    setBusy(false);
    if (res) { setGeo(res); toast.success("Address located"); }
    else toast.error("Could not geocode address");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!geo.lat || !geo.lng) return toast.error("Please set garage location (detect or geocode)");
    if (f.services.length === 0 && !f.custom_service) return toast.error("Select at least one service");
    setBusy(true);
    const services = f.custom_service ? [...f.services, ...f.custom_service.split(",").map(s => s.trim()).filter(Boolean)] : f.services;
    const mechData = {
      user_id: user.id,
      full_name: f.full_name,
      garage_name: f.garage_name,
      address: f.address,
      city: f.city,
      state: f.state,
      pincode: f.pincode,
      phone: f.phone,
      alternate_phone: f.alternate_phone || null,
      services,
      experience_years: Number(f.experience_years) || 0,
      working_hours: f.working_hours,
      latitude: geo.lat,
      longitude: geo.lng,
      availability_status: "open",
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(`mech_mechanic_profile_${user.id}`, JSON.stringify(mechData));
    }

    try {
      await supabase.from("mechanics").insert(mechData);
    } catch {}

    setBusy(false);
    toast.success("Garage registered successfully!");
    navigate({ to: "/partner-portal" });
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">Register your garage</h1>
        <p className="mt-1 text-sm text-muted-foreground">Fill in your shop details so customers can find you.</p>
        <Card className="card-elev mt-6 border-border/60 bg-card p-6">
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" v={f.full_name} on={(v) => setF({ ...f, full_name: v })} required />
            <Field label="Shop / Garage name" v={f.garage_name} on={(v) => setF({ ...f, garage_name: v })} required />
            <div className="sm:col-span-2"><Field label="Shop address" v={f.address} on={(v) => setF({ ...f, address: v })} required /></div>
            <Field label="City" v={f.city} on={(v) => setF({ ...f, city: v })} required />
            <Field label="State" v={f.state} on={(v) => setF({ ...f, state: v })} required />
            <Field label="PIN code" v={f.pincode} on={(v) => setF({ ...f, pincode: v })} required />
            <Field label="Mobile" v={f.phone} on={(v) => setF({ ...f, phone: v })} placeholder="+91..." required />
            <Field label="Alternate number" v={f.alternate_phone} on={(v) => setF({ ...f, alternate_phone: v })} />
            <Field label="Years of experience" type="number" v={String(f.experience_years)} on={(v) => setF({ ...f, experience_years: Number(v) })} />
            <Field label="Working hours" v={f.working_hours} on={(v) => setF({ ...f, working_hours: v })} />

            <div className="sm:col-span-2">
              <Label>Services offered</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SERVICE_OPTIONS.map((s) => (
                  <label key={s} className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm">
                    <Checkbox checked={f.services.includes(s)} onCheckedChange={() => toggleSvc(s)} /> {s}
                  </label>
                ))}
              </div>
              <Input className="mt-2" placeholder="Other services (comma separated)" value={f.custom_service} onChange={(e) => setF({ ...f, custom_service: e.target.value })} />
            </div>

            <div className="sm:col-span-2">
              <Label>Garage location</Label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button type="button" variant="secondary" onClick={detectLocation}><MapPin className="mr-2 size-4" />Detect current</Button>
                <Button type="button" variant="secondary" onClick={geocode} disabled={busy}>Geocode address</Button>
                {geo.lat && <span className="text-xs text-muted-foreground">Lat {geo.lat.toFixed(4)}, Lng {geo.lng!.toFixed(4)}</span>}
              </div>
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" className="w-full grad-primary text-primary-foreground" size="lg" disabled={busy}>
                {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Register garage
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}

function Field({ label, v, on, required, type, placeholder }: {
  label: string; v: string; on: (v: string) => void; required?: boolean; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}{required && " *"}</Label>
      <Input className="mt-1.5" value={v} onChange={(e) => on(e.target.value)} required={required} type={type} placeholder={placeholder} />
    </div>
  );
}
