import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, MapPin, Phone, Navigation, Search, Sparkles, Upload, AlertTriangle, Languages } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { distanceKm } from "@/lib/geocode";
import { diagnose, type DiagnosisResult } from "@/lib/ai-diagnose.functions";
import { LANGUAGES } from "@/lib/languages";
import { useServerFn } from "@tanstack/react-start";
import type { Tables } from "@/integrations/supabase/types";

type Mech = Tables<"mechanics">;

const BLR = { lat: 12.9716, lng: 77.5946 };

export const Route = createFileRoute("/customer/home")({ component: CustomerHome });

function CustomerHome() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [pos, setPos] = useState<{ lat: number; lng: number }>(BLR);
  const [posSet, setPosSet] = useState(false);
  const [mechs, setMechs] = useState<Mech[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
  }, [user, loading, navigate]);

  useEffect(() => {
    supabase.from("mechanics").select("*").not("latitude", "is", null).then(({ data }) => {
      if (data) setMechs(data as Mech[]);
    });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setPosSet(true); },
        () => {},
      );
    }
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mechs
      .filter((m) => !q || m.garage_name.toLowerCase().includes(q) || m.full_name.toLowerCase().includes(q) || (m.services ?? []).some(s => s.toLowerCase().includes(q)))
      .map((m) => ({ m, dist: distanceKm(pos, { lat: m.latitude!, lng: m.longitude! }) }))
      .sort((a, b) => a.dist - b.dist);
  }, [mechs, query, pos]);

  const scrollToSearch = () => searchRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <section ref={searchRef} className="rounded-2xl border border-border/60 bg-gradient-to-br from-card to-card/60 p-6 sm:p-8 card-elev">
          <h1 className="text-3xl font-bold sm:text-4xl">Find help for your ride</h1>
          <p className="mt-1 text-muted-foreground">Search nearby garages or ask AI to diagnose your problem.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search nearby garage / mechanic / service" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Button size="lg" className="grad-primary text-primary-foreground" onClick={() => {
              if (navigator.geolocation) navigator.geolocation.getCurrentPosition(
                (p) => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setPosSet(true); toast.success("Using your location"); },
                () => toast.error("Location permission denied"),
              );
            }}>
              <MapPin className="mr-2 size-4" />Find Nearby
            </Button>
          </div>
          {!posSet && <p className="mt-2 text-xs text-muted-foreground">Using Bengaluru as reference — allow location for accurate distance.</p>}
          <Button asChild size="lg" className="mt-4 h-14 w-full grad-primary text-lg font-bold text-primary-foreground shadow-lg">
            <a href="/customer/nearby"><Navigation className="mr-2 size-5" />Nearby Garage (within 1 km)</a>
          </Button>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-3">
            {results.length === 0 && <p className="text-sm text-muted-foreground">No mechanics found.</p>}
            {results.slice(0, 20).map(({ m, dist }) => (
              <MechCard key={m.id} m={m} dist={dist} selected={selectedId === m.id} onSelect={() => setSelectedId(m.id)} customerPos={pos} />
            ))}
          </div>
          <div className="lg:sticky lg:top-6 lg:self-start">
            <GoogleMap center={pos} mechs={results.map(r => r.m)} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
        </div>

        <AiSection onGoToMechanic={scrollToSearch} userId={user?.id} />
      </main>
    </div>
  );
}

function MechCard({ m, dist, selected, onSelect, customerPos }: { m: Mech; dist: number; selected: boolean; onSelect: () => void; customerPos: { lat: number; lng: number } }) {
  const dirUrl = `https://www.google.com/maps/dir/?api=1&origin=${customerPos.lat},${customerPos.lng}&destination=${m.latitude},${m.longitude}`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${m.latitude},${m.longitude}`;
  return (
    <Card onClick={onSelect} className={`card-elev cursor-pointer border-border/60 bg-card p-4 transition ${selected ? "ring-2 ring-primary" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{m.garage_name}</h3>
          <p className="text-xs text-muted-foreground">{m.full_name} · {m.working_hours}</p>
        </div>
        <Badge variant={m.availability_status === "open" ? "default" : "secondary"} className={m.availability_status === "open" ? "grad-primary text-primary-foreground" : ""}>
          {m.availability_status}
        </Badge>
      </div>
      <p className="mt-2 text-sm">{m.address}, {m.city}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {(m.services ?? []).slice(0, 4).map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{dist.toFixed(1)} km away</span>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="secondary"><a href={`tel:${m.phone}`}><Phone className="mr-1 size-3.5" />Call</a></Button>
          <Button asChild size="sm" variant="secondary"><a href={mapUrl} target="_blank" rel="noreferrer"><MapPin className="mr-1 size-3.5" />Map</a></Button>
          <Button asChild size="sm" className="grad-primary text-primary-foreground"><a href={dirUrl} target="_blank" rel="noreferrer"><Navigation className="mr-1 size-3.5" />Directions</a></Button>
        </div>
      </div>
    </Card>
  );
}

declare global { interface Window { google?: any; initGmap?: () => void; } }

function GoogleMap({ center, mechs, selectedId, onSelect }: { center: { lat: number; lng: number }; mechs: Mech[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.google?.maps) { setReady(true); return; }
    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const trackId = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
    if (!key) return;
    window.initGmap = () => setReady(true);
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=initGmap${trackId ? `&channel=${trackId}` : ""}`;
    s.async = true;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (!ready || !ref.current) return;
    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(ref.current, {
        center, zoom: 12, disableDefaultUI: false,
        styles: [{ elementType: "geometry", stylers: [{ color: "#1a2332" }] }, { elementType: "labels.text.fill", stylers: [{ color: "#d1d5db" }] }, { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] }, { featureType: "road", elementType: "geometry", stylers: [{ color: "#334155" }] }, { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b1220" }] }],
      });
      new window.google.maps.Marker({ position: center, map: mapRef.current, title: "You", icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#f97316", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 } });
    } else {
      mapRef.current.setCenter(center);
    }
    Object.values(markersRef.current).forEach((m: any) => m.setMap(null));
    markersRef.current = {};
    mechs.forEach((m) => {
      if (m.latitude == null || m.longitude == null) return;
      const marker = new window.google.maps.Marker({
        position: { lat: m.latitude, lng: m.longitude }, map: mapRef.current, title: m.garage_name,
      });
      marker.addListener("click", () => onSelect(m.id));
      markersRef.current[m.id] = marker;
    });
  }, [ready, center, mechs, onSelect]);

  useEffect(() => {
    if (selectedId && markersRef.current[selectedId] && mapRef.current) {
      const m = markersRef.current[selectedId];
      mapRef.current.panTo(m.getPosition());
    }
  }, [selectedId]);

  if (!import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY) {
    return <Card className="grid h-96 place-items-center text-sm text-muted-foreground">Google Maps key not configured</Card>;
  }
  return <div ref={ref} className="h-[500px] w-full rounded-xl border border-border/60 bg-muted" />;
}

function AiSection({ onGoToMechanic, userId }: { onGoToMechanic: () => void; userId?: string }) {
  const [text, setText] = useState("");
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [language, setLanguage] = useState<string>("English");
  const run = useServerFn(diagnose);

  useEffect(() => {
    if (!userId) return;
    supabase.from("profiles").select("preferred_language").eq("id", userId).maybeSingle().then(({ data }) => {
      if (data?.preferred_language) setLanguage(data.preferred_language);
    });
  }, [userId]);

  const onLanguageChange = (v: string) => {
    setLanguage(v);
    if (userId) supabase.from("profiles").update({ preferred_language: v }).eq("id", userId).then(() => {});
  };

  const onFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result);
      const b64 = s.split(",")[1];
      setImageB64(b64); setImageMime(f.type);
    };
    reader.readAsDataURL(f);
  };

  const submit = async () => {
    if (!text && !imageB64) return toast.error("Describe the problem or upload a photo");
    setBusy(true); setResult(null);
    try {
      const r = await run({ data: { description: text || undefined, imageBase64: imageB64 || undefined, imageMime: imageMime || undefined, language } });
      setResult(r);
      if (userId) supabase.from("ai_help_requests").insert({
        user_id: userId, problem_description: text || null, ai_response: r as unknown as any, severity: r.severity,
      }).then(() => {});
    } catch (e: any) {
      toast.error(e.message || "AI request failed");
    } finally { setBusy(false); }
  };

  return (
    <section id="ai" className="mt-10 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8 card-elev">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <h2 className="text-2xl font-bold">AI Vehicle Help</h2>
        </div>
        <div className="flex items-center gap-2">
          <Languages className="size-4 text-muted-foreground" />
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              {LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Upload a photo or describe your problem — get an instant mechanic-style diagnosis in your language.</p>

      <Tabs defaultValue="text" className="mt-4">
        <TabsList><TabsTrigger value="text">Describe</TabsTrigger><TabsTrigger value="image">Upload photo</TabsTrigger></TabsList>
        <TabsContent value="text">
          <Textarea rows={4} placeholder="e.g. Bike is not starting, engine making noise, tyre puncture…" value={text} onChange={(e) => setText(e.target.value)} />
        </TabsContent>
        <TabsContent value="image">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-8 text-sm text-muted-foreground hover:bg-muted/50">
            <Upload className="mb-2 size-6" />
            {imageB64 ? "Photo ready — click to change" : "Click to upload a photo of the problem"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
          </label>
          {imageB64 && <img src={`data:${imageMime};base64,${imageB64}`} alt="preview" className="mt-3 max-h-48 rounded-lg" />}
          <Textarea rows={2} className="mt-3" placeholder="Optional: add context…" value={text} onChange={(e) => setText(e.target.value)} />
        </TabsContent>
      </Tabs>

      <Button onClick={submit} disabled={busy} size="lg" className="mt-4 grad-primary text-primary-foreground">
        {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Analyze Problem
      </Button>

      {result && <DiagnosisView r={result} onGoToMechanic={onGoToMechanic} />}
    </section>
  );
}


function DiagnosisView({ r, onGoToMechanic }: { r: DiagnosisResult; onGoToMechanic: () => void }) {
  const sevColor = r.severity === "high" ? "destructive" : r.severity === "medium" ? "default" : "secondary";
  return (
    <Card className="card-elev mt-6 border-border/60 bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xl font-bold">{r.problem}</h3>
        <Badge variant={sevColor as any} className="uppercase">{r.severity} severity</Badge>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{r.explanation}</p>

      {r.goToMechanic && (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-5 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Serious problem detected</p>
              <p className="text-sm text-muted-foreground">This appears to be complex or risky. Please visit a nearby mechanic instead of attempting repair yourself.</p>
              <Button className="mt-3 grad-primary text-primary-foreground" onClick={onGoToMechanic}><Search className="mr-2 size-4" />Search Nearby Garage</Button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Block title="Possible causes" items={r.causes} />
        <Block title="How to check" items={r.steps} ordered />
        <Block title="Precautions" items={r.precautions} />
        <Block title="Tools needed" items={r.tools} />
      </div>
      <div className="mt-4 rounded-lg bg-muted/40 p-4">
        <p className="text-sm"><span className="font-semibold">Solution: </span>{r.solution}</p>
        <p className="mt-2 text-sm"><span className="font-semibold">DIY possible: </span>{r.diyPossible ? "Yes" : "No"}</p>
        <p className="mt-2 text-sm"><span className="font-semibold">Recommendation: </span>{r.recommendation}</p>
      </div>
    </Card>
  );
}

function Block({ title, items, ordered }: { title: string; items: string[]; ordered?: boolean }) {
  if (!items?.length) return null;
  const List: any = ordered ? "ol" : "ul";
  return (
    <div>
      <h4 className="font-semibold">{title}</h4>
      <List className={`mt-1 ml-5 space-y-1 text-sm text-muted-foreground ${ordered ? "list-decimal" : "list-disc"}`}>
        {items.map((x, i) => <li key={i}>{x}</li>)}
      </List>
    </div>
  );
}
