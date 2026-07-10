import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import type { Tables } from "@/integrations/supabase/types";

type Mech = Tables<"mechanics">;

export const Route = createFileRoute("/mechanic/dashboard")({ component: Dashboard });

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mech, setMech] = useState<Mech | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) return navigate({ to: "/auth" });
    supabase.from("mechanics").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (!data) navigate({ to: "/mechanic/register" });
      else setMech(data);
    });
  }, [user, loading, navigate]);

  const update = async (patch: Partial<Mech>) => {
    if (!mech) return;
    setBusy(true);
    const { data, error } = await supabase.from("mechanics").update(patch).eq("id", mech.id).select().single();
    setBusy(false);
    if (error) return toast.error(error.message);
    setMech(data);
    toast.success("Updated");
  };

  if (!mech) return <div className="grid min-h-screen place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Mechanic Dashboard</p>
            <h1 className="text-3xl font-bold">{mech.garage_name}</h1>
            <p className="text-sm text-muted-foreground">{mech.address}, {mech.city}</p>
          </div>
          <div className="flex items-center gap-2">
            <Label>Availability</Label>
            <Select value={mech.availability_status} onValueChange={(v) => update({ availability_status: v })}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card className="card-elev border-border/60 bg-card p-6">
            <h2 className="font-semibold">Profile</h2>
            <div className="mt-3 space-y-3">
              <div><Label>Full name</Label><Input value={mech.full_name} onChange={(e) => setMech({ ...mech, full_name: e.target.value })} onBlur={(e) => update({ full_name: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={mech.phone} onChange={(e) => setMech({ ...mech, phone: e.target.value })} onBlur={(e) => update({ phone: e.target.value })} /></div>
              <div><Label>Alternate phone</Label><Input value={mech.alternate_phone ?? ""} onChange={(e) => setMech({ ...mech, alternate_phone: e.target.value })} onBlur={(e) => update({ alternate_phone: e.target.value })} /></div>
              <div><Label>Working hours</Label><Input value={mech.working_hours ?? ""} onChange={(e) => setMech({ ...mech, working_hours: e.target.value })} onBlur={(e) => update({ working_hours: e.target.value })} /></div>
              <div><Label>Experience (years)</Label><Input type="number" value={mech.experience_years ?? 0} onChange={(e) => setMech({ ...mech, experience_years: Number(e.target.value) })} onBlur={(e) => update({ experience_years: Number(e.target.value) })} /></div>
            </div>
          </Card>

          <Card className="card-elev border-border/60 bg-card p-6">
            <h2 className="font-semibold">Location</h2>
            <div className="mt-3 space-y-3">
              <div><Label>Address</Label><Input value={mech.address} onChange={(e) => setMech({ ...mech, address: e.target.value })} onBlur={(e) => update({ address: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>City</Label><Input value={mech.city} onChange={(e) => setMech({ ...mech, city: e.target.value })} onBlur={(e) => update({ city: e.target.value })} /></div>
                <div><Label>State</Label><Input value={mech.state} onChange={(e) => setMech({ ...mech, state: e.target.value })} onBlur={(e) => update({ state: e.target.value })} /></div>
              </div>
              <div><Label>PIN</Label><Input value={mech.pincode} onChange={(e) => setMech({ ...mech, pincode: e.target.value })} onBlur={(e) => update({ pincode: e.target.value })} /></div>
              <p className="text-xs text-muted-foreground">Coordinates: {mech.latitude?.toFixed(4)}, {mech.longitude?.toFixed(4)}</p>
            </div>
          </Card>

          <Card className="card-elev border-border/60 bg-card p-6 md:col-span-2">
            <h2 className="font-semibold">Services offered</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(mech.services ?? []).map((s) => (
                <Badge key={s} variant="secondary" className="cursor-pointer" onClick={() => update({ services: (mech.services ?? []).filter(x => x !== s) })}>
                  {s} ✕
                </Badge>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Input placeholder="Add a service and press Enter" onKeyDown={(e) => {
                const t = e.currentTarget as HTMLInputElement;
                if (e.key === "Enter" && t.value.trim()) {
                  e.preventDefault();
                  update({ services: [...(mech.services ?? []), t.value.trim()] });
                  t.value = "";
                }
              }} />
            </div>
          </Card>

          <Card className="card-elev border-dashed border-border/60 bg-card/50 p-6 md:col-span-2">
            <h2 className="font-semibold text-muted-foreground">Customer requests</h2>
            <p className="mt-1 text-sm text-muted-foreground">No requests yet — this section is future-ready.</p>
          </Card>
        </div>
        {busy && <div className="mt-4 text-xs text-muted-foreground">Saving…</div>}
      </main>
    </div>
  );
}
