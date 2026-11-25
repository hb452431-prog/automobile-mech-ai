import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { 
  Calculator, 
  DollarSign, 
  TrendingDown, 
  ShieldCheck, 
  Wrench, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Car 
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_COST_ESTIMATOR_CATEGORIES } from "@/services/mockData";

export const Route = createFileRoute("/cost-estimator")({
  component: CostEstimatorPage,
});

function CostEstimatorPage() {
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState(0);
  const [selectedItemIdx, setSelectedItemIdx] = useState(0);
  const [vehicleType, setVehicleType] = useState<"standard" | "luxury" | "ev">("standard");

  const currentCategory = MOCK_COST_ESTIMATOR_CATEGORIES[selectedCategoryIdx];
  const currentItem = currentCategory.items[selectedItemIdx] || currentCategory.items[0];

  let multiplier = 1;
  if (vehicleType === "luxury") multiplier = 1.35;
  if (vehicleType === "ev") multiplier = 1.15;

  const partsCost = Math.round(currentItem.parts * multiplier);
  const laborCost = Math.round(currentItem.labor * multiplier);
  const mechPrice = Math.round(currentItem.mechPrice * multiplier);
  const dealerPrice = Math.round(currentItem.dealerPrice * multiplier);
  const savings = dealerPrice - mechPrice;
  const savingsPercent = Math.round((savings / dealerPrice) * 100);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
            <DollarSign className="size-3.5" /> Transparent Auto Repair Pricing
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
            AI Fair Cost Estimator
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Compare verified OEM parts costs and certified labor hours against standard dealership rate sheets before you approve any repair.
          </p>
        </div>

        {/* Calculator Card */}
        <Card className="card-elev mx-auto mt-10 max-w-4xl border-border/60 bg-card p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Left Column: Form Controls */}
            <div className="space-y-6 lg:col-span-7">
              {/* Step 1: Vehicle Platform */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  1. Select Vehicle Platform
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[
                    { id: "standard", label: "Standard / Asian", desc: "1.0x" },
                    { id: "luxury", label: "German Luxury", desc: "1.35x" },
                    { id: "ev", label: "Electric / EV", desc: "1.15x" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setVehicleType(p.id as any)}
                      className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                        vehicleType === p.id
                          ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                          : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      }`}
                    >
                      <span className="text-xs font-semibold">{p.label}</span>
                      <span className="text-[10px] opacity-75">{p.desc} multiplier</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Repair Category */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  2. Select Repair Category
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {MOCK_COST_ESTIMATOR_CATEGORIES.map((cat, idx) => (
                    <button
                      key={cat.category}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryIdx(idx);
                        setSelectedItemIdx(0);
                      }}
                      className={`rounded-xl border p-3 text-left transition ${
                        selectedCategoryIdx === idx
                          ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                          : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      }`}
                    >
                      <span className="text-xs font-medium">{cat.category}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Specific Service */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  3. Select Specific Service
                </label>
                <div className="mt-2">
                  <Select
                    value={String(selectedItemIdx)}
                    onValueChange={(val) => setSelectedItemIdx(parseInt(val, 10))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currentCategory.items.map((item, idx) => (
                        <SelectItem key={idx} value={String(idx)}>
                          {item.service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Right Column: Cost Breakdown Card */}
            <div className="flex flex-col justify-between rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-6 lg:col-span-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Fair Market Quote
                  </span>
                  <Badge variant="outline" className="border-success/40 bg-success/10 text-success">
                    Save {savingsPercent}%
                  </Badge>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-bold leading-snug">{currentItem.service}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    OEM certified parts and book-time labor specification
                  </p>
                </div>

                <div className="mt-6 space-y-3 rounded-xl border border-border/60 bg-muted/30 p-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">OEM Certified Parts:</span>
                    <span className="font-semibold">${partsCost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Certified Labor Hours:</span>
                    <span className="font-semibold">${laborCost}</span>
                  </div>
                  <div className="border-t border-border/60 pt-2 flex justify-between text-sm">
                    <span className="font-semibold text-primary">Fair Partner Price:</span>
                    <span className="font-bold text-primary">${mechPrice}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Typical Dealership Quote:</span>
                    <span className="line-through">${dealerPrice}</span>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-success/30 bg-success/10 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Estimated Driver Savings</p>
                  <p className="text-2xl font-bold text-success">${savings}</p>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  asChild
                  size="lg"
                  className="w-full grad-primary text-primary-foreground shadow-lg"
                >
                  <Link
                    to="/mechanics"
                    search={{ service: currentItem.service }}
                  >
                    Find Mechanic for this Fix <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Benefits Grid */}
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          <Card className="card-elev border-border/60 bg-card p-6">
            <span className="grid size-10 place-items-center rounded-lg bg-success/15 text-success">
              <TrendingDown className="size-5" />
            </span>
            <h3 className="mt-4 text-base font-semibold">Average 35% Savings</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Our partner mechanics use standardized labor book-time without dealership retail overhead markups.
            </p>
          </Card>

          <Card className="card-elev border-border/60 bg-card p-6">
            <span className="grid size-10 place-items-center rounded-lg bg-primary/15 text-primary">
              <ShieldCheck className="size-5" />
            </span>
            <h3 className="mt-4 text-base font-semibold">12-Month / 12k Mile Warranty</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Every repair booked through Automobile-Mech-AI includes nationwide parts and labor protection.
            </p>
          </Card>

          <Card className="card-elev border-border/60 bg-card p-6">
            <span className="grid size-10 place-items-center rounded-lg bg-warning/15 text-warning">
              <Wrench className="size-5" />
            </span>
            <h3 className="mt-4 text-base font-semibold">ASE Certified Technicians</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              All quotes are fulfilled by vetted master technicians with verified diagnostic equipment.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
