import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, LogOut } from "lucide-react";
import { Header } from "@/components/Header";
import { AvatarUploader } from "@/components/AvatarUploader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, fetchUserRole } from "@/lib/use-auth";
import { LANGUAGES } from "@/lib/languages";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

type Profile = Tables<"profiles">;
type Customer = Tables<"customers">;
type Mech = Tables<"mechanics">;

function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<"customer" | "mechanic" | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [mech, setMech] = useState<Mech | null>(null);
  const [aiHistory, setAiHistory] = useState<Tables<"ai_help_requests">[]>([]);
  const [searches, setSearches] = useState<Tables<"search_history">[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    (async () => {
      const r = await fetchUserRole(user.id);
      setRole(r);
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setProfile(p);
      if (r === "customer") {
        const { data: c } = await supabase.from("customers").select("*").eq("user_id", user.id).maybeSingle();
        setCustomer(c);
        const { data: ah } = await supabase.from("ai_help_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
        setAiHistory(ah ?? []);
        const { data: sh } = await supabase.from("search_history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
        setSearches(sh ?? []);
      } else if (r === "mechanic") {
        const { data: m } = await supabase.from("mechanics").select("*").eq("user_id", user.id).maybeSingle();
        setMech(m);
      }
    })();
  }, [user, loading, navigate]);

  const saveProfile = async (patch: Partial<Profile>) => {
    if (!user) return;
    const { data, error } = await supabase.from("profiles").update(patch).eq("id", user.id).select().single();
    if (error) return toast.error(error.message);
    setProfile(data);
    toast.success("Saved");
  };

  const logout = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  if (loading || !role) return <div className="grid min-h-screen place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-4">
          <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2">
            <Link to="/customer/home"><ArrowLeft className="size-4" /> Back to Home</Link>
          </Button>
        </div>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {user && (
            <AvatarUploader
              userId={user.id}
              avatarPath={profile?.avatar_url ?? null}
              onChange={(path) => setProfile((p) => (p ? { ...p, avatar_url: path } : p))}
              fallbackIcon={role === "mechanic" ? "wrench" : "user"}
            />
          )}
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{role} profile</p>
            <h1 className="text-2xl font-bold">{profile?.full_name || customer?.full_name || mech?.full_name || "Account"}</h1>
            <p className="text-sm text-muted-foreground">{user?.email ?? user?.phone}</p>
          </div>
          <Button variant="secondary" className="sm:ml-auto" onClick={logout}><LogOut className="mr-2 size-4" />Logout</Button>
        </div>

        <Card className="card-elev mt-6 border-border/60 bg-card p-6">
          <h2 className="font-semibold">Account</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Full name</Label>
              <Input defaultValue={profile?.full_name ?? ""} onBlur={(e) => saveProfile({ full_name: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input defaultValue={profile?.phone ?? user?.phone ?? ""} onBlur={(e) => saveProfile({ phone: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Preferred AI language</Label>
              <Select value={profile?.preferred_language ?? "English"} onValueChange={(v) => saveProfile({ preferred_language: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">AI vehicle help responses will be translated to this language.</p>
            </div>
          </div>
        </Card>

        {role === "customer" && (
          <>
            <Card className="card-elev mt-6 border-border/60 bg-card p-6">
              <h2 className="font-semibold">Vehicle</h2>
              {customer ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label>Type</Label>
                    <Select value={customer.vehicle_type ?? ""} onValueChange={async (v) => {
                      const { data } = await supabase.from("customers").update({ vehicle_type: v }).eq("id", customer.id).select().single();
                      if (data) setCustomer(data);
                    }}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {["Bike","Car","Scooter","Other"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Brand</Label><Input defaultValue={customer.vehicle_brand ?? ""} onBlur={async (e) => { const { data } = await supabase.from("customers").update({ vehicle_brand: e.target.value }).eq("id", customer.id).select().single(); if (data) setCustomer(data); }} /></div>
                  <div><Label>Model</Label><Input defaultValue={customer.vehicle_model ?? ""} onBlur={async (e) => { const { data } = await supabase.from("customers").update({ vehicle_model: e.target.value }).eq("id", customer.id).select().single(); if (data) setCustomer(data); }} /></div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Complete registration to add vehicle details. <Button variant="link" className="p-0" onClick={() => navigate({ to: "/customer/register" })}>Register</Button></p>
              )}
            </Card>

            <Card className="card-elev mt-6 border-border/60 bg-card p-6">
              <h2 className="font-semibold">Recent AI help</h2>
              {aiHistory.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No AI diagnoses yet.</p> : (
                <ul className="mt-3 space-y-2">
                  {aiHistory.map(h => (
                    <li key={h.id} className="flex items-start justify-between gap-3 rounded-lg bg-muted/30 p-3 text-sm">
                      <div>
                        <p className="line-clamp-2">{h.problem_description || (h.ai_response as any)?.problem || "Image diagnosis"}</p>
                        <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</p>
                      </div>
                      {h.severity && <Badge variant={h.severity === "high" ? "destructive" : "secondary"}>{h.severity}</Badge>}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="card-elev mt-6 border-border/60 bg-card p-6">
              <h2 className="font-semibold">Recent garage searches</h2>
              {searches.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No searches yet.</p> : (
                <ul className="mt-3 space-y-2 text-sm">
                  {searches.map(s => (
                    <li key={s.id} className="flex justify-between rounded-lg bg-muted/30 p-3">
                      <span>{s.searched_location || `${s.latitude?.toFixed(3)}, ${s.longitude?.toFixed(3)}`}</span>
                      <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}

        {role === "mechanic" && (
          <Card className="card-elev mt-6 border-border/60 bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Garage</h2>
              <Button variant="secondary" onClick={() => navigate({ to: "/mechanic/dashboard" })}>Manage garage →</Button>
            </div>
            {mech ? (
              <div className="mt-3 grid gap-2 text-sm">
                <p><span className="text-muted-foreground">Garage:</span> {mech.garage_name}</p>
                <p><span className="text-muted-foreground">Address:</span> {mech.address}, {mech.city}, {mech.state} {mech.pincode}</p>
                <p><span className="text-muted-foreground">Phone:</span> {mech.phone}{mech.alternate_phone ? ` / ${mech.alternate_phone}` : ""}</p>
                <p><span className="text-muted-foreground">Working hours:</span> {mech.working_hours || "—"}</p>
                <p><span className="text-muted-foreground">Experience:</span> {mech.experience_years ?? 0} years</p>
                <p><span className="text-muted-foreground">Status:</span> <Badge className="ml-1" variant={mech.availability_status === "open" ? "default" : "secondary"}>{mech.availability_status}</Badge></p>
                <div className="mt-1 flex flex-wrap gap-1">{(mech.services ?? []).map(s => <Badge key={s} variant="outline">{s}</Badge>)}</div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No garage yet. <Button variant="link" className="p-0" onClick={() => navigate({ to: "/mechanic/register" })}>Register your garage</Button></p>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}
