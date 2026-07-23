import { createFileRoute, Link } from "@tanstack/react-router";
import { Wrench, MapPin, Bot, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:pt-20 lg:grid lg:grid-cols-2 lg:gap-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
                <Sparkles className="size-3.5" /> AI Vehicle Diagnosis + Nearby Mechanics
              </div>
              <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Your car broke down?<br />
                <span className="text-primary">We&apos;ve got a mechanic</span>
                <br />and an AI beside you.
              </h1>
              <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
                Find trusted nearby garages on the map, call them instantly, or describe
                the problem to our AI mechanic — including a photo of the issue.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="grad-primary text-primary-foreground">
                  <Link to="/auth">
                    Get started <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link to="/auth">I&apos;m a mechanic</Link>
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-success" /> Verified garages</div>
                <div className="flex items-center gap-1.5"><Bot className="size-4 text-primary" /> Multimodal AI</div>
                <div className="flex items-center gap-1.5"><MapPin className="size-4 text-primary" /> Live map</div>
              </div>
            </div>

            <div className="relative mt-14 lg:mt-0">
              <div className="card-elev relative rounded-3xl border border-border/60 bg-card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid size-9 place-items-center rounded-lg grad-primary text-primary-foreground">
                      <Wrench className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">Ravi Auto Garage</p>
                      <p className="text-xs text-muted-foreground">1.2 km · Open now</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs text-success">OPEN</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  {["Engine", "Battery", "Oil change", "AC repair"].map((s) => (
                    <div key={s} className="rounded-md bg-muted px-2 py-1.5">{s}</div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="flex-1 grad-primary text-primary-foreground">Call</Button>
                  <Button size="sm" variant="secondary" className="flex-1">Directions</Button>
                </div>
              </div>
              <div className="card-elev absolute -bottom-6 -right-4 hidden max-w-xs rounded-2xl border border-border/60 bg-card p-4 sm:block">
                <div className="flex items-center gap-2 text-xs text-primary">
                  <Bot className="size-4" /> AI Mechanic
                </div>
                <p className="mt-2 text-sm">
                  &ldquo;Engine warning + white smoke? Likely coolant leak. Do not drive — recommend nearby garage.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-7xl px-4 py-16">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: MapPin, title: "Find nearby mechanics instantly", desc: "Real-time map with distance, services and open/closed status." },
              { icon: Bot, title: "AI help for vehicle problems", desc: "Upload a photo or describe the issue — get step-by-step guidance." },
              { icon: Wrench, title: "For mechanics: get customers", desc: "Register your garage in 2 minutes and start receiving requests." },
            ].map((f) => (
              <Card key={f.title} className="card-elev border-border/60 bg-card p-6">
                <span className="grid size-10 place-items-center rounded-lg grad-primary text-primary-foreground">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Automobile-Mech-AI
        </footer>
      </main>
    </div>
  );
}
