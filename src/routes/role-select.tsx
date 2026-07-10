import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wrench, User as UserIcon, Car } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserRole, useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/role-select")({ component: RoleSelect });

function RoleSelect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const pick = async (role: "mechanic" | "customer") => {
    if (!user) return;
    setBusy(true);
    const existing = await fetchUserRole(user.id);
    if (!existing) {
      const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role });
      if (error) { toast.error(error.message); setBusy(false); return; }
    }
    await supabase.from("profiles").update({ role }).eq("id", user.id);
    if (role === "mechanic") {
      const { data: m } = await supabase.from("mechanics").select("id").eq("user_id", user.id).maybeSingle();
      navigate({ to: m ? "/mechanic/dashboard" : "/mechanic/register" });
    } else {
      const { data: c } = await supabase.from("customers").select("id").eq("user_id", user.id).maybeSingle();
      navigate({ to: c ? "/customer/home" : "/customer/register" });
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">How will you use Automobile-Mech-AI?</h1>
          <p className="mt-2 text-muted-foreground">This is saved so you land in the right place next time.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <RoleCard title="I'm a Customer" desc="Find nearby garages, get AI help for vehicle issues." icon={UserIcon} onClick={() => pick("customer")} busy={busy} />
          <RoleCard title="I'm a Mechanic" desc="Register your garage and start getting customers." icon={Wrench} onClick={() => pick("mechanic")} busy={busy} highlight />
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Car className="mr-1 inline size-3" /> You can switch role later from your profile menu.
        </p>
      </div>
    </div>
  );
}

function RoleCard({ title, desc, icon: Icon, onClick, busy, highlight }: {
  title: string; desc: string; icon: React.ElementType; onClick: () => void; busy: boolean; highlight?: boolean;
}) {
  return (
    <Card className={`card-elev cursor-pointer border-border/60 bg-card p-6 transition hover:-translate-y-0.5 hover:border-primary/50 ${highlight ? "ring-1 ring-primary/40" : ""}`}
      onClick={busy ? undefined : onClick}>
      <span className="grid size-12 place-items-center rounded-xl grad-primary text-primary-foreground">
        <Icon className="size-6" />
      </span>
      <h3 className="mt-4 text-xl font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
      <Button className="mt-5 w-full grad-primary text-primary-foreground" disabled={busy}>Continue</Button>
    </Card>
  );
}
