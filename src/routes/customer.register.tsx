import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/customer/register")({ component: CustomerRegister });

function CustomerRegister() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    full_name: "", phone: "", vehicle_type: "Car",
    vehicle_brand: "", vehicle_model: "",
  });

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("customers").insert({
      user_id: user.id, full_name: f.full_name, phone: f.phone,
      vehicle_type: f.vehicle_type, vehicle_brand: f.vehicle_brand || null, vehicle_model: f.vehicle_model || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
    navigate({ to: "/customer/home" });
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-bold">Tell us about you & your vehicle</h1>
        <p className="mt-1 text-sm text-muted-foreground">Helps us recommend the right mechanics.</p>
        <Card className="card-elev mt-6 border-border/60 bg-card p-6">
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Full name *</Label><Input required value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Registered mobile *</Label><Input required placeholder="+91..." value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
            <div>
              <Label>Vehicle type *</Label>
              <Select value={f.vehicle_type} onValueChange={(v) => setF({ ...f, vehicle_type: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Bike", "Car", "Scooter", "Other"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Vehicle brand</Label><Input value={f.vehicle_brand} onChange={(e) => setF({ ...f, vehicle_brand: e.target.value })} placeholder="Honda, Maruti…" /></div>
            <div className="sm:col-span-2"><Label>Vehicle model</Label><Input value={f.vehicle_model} onChange={(e) => setF({ ...f, vehicle_model: e.target.value })} placeholder="Activa 6G, Swift…" /></div>
            <div className="sm:col-span-2">
              <Button type="submit" size="lg" className="w-full grad-primary text-primary-foreground" disabled={busy}>
                {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Continue
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
