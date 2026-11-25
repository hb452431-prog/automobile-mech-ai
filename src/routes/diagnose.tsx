import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Sparkles, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Wrench, 
  Search, 
  Copy, 
  Check, 
  Activity, 
  Volume2, 
  ShieldAlert, 
  Eye, 
  Binary, 
  DollarSign, 
  Car,
  Clock
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { aiDiagnosticService, type DiagnosticResult } from "@/services/aiDiagnosticService";
import { MOCK_ACOUSTIC_SAMPLES, MOCK_WARNING_LIGHTS, MOCK_OBD_CODES, type AcousticSampleItem, type WarningLightItem, type ObdCodeItem } from "@/services/mockData";

export const Route = createFileRoute("/diagnose")({
  component: DiagnosticsPage,
});

function DiagnosticsPage() {
  const [activeTab, setActiveTab] = useState<"nlp" | "acoustic" | "visual" | "obd">("nlp");

  // NLP Query state
  const [userQuery, setUserQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Acoustic Studio state
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [micSeconds, setMicSeconds] = useState(0);
  const [selectedSoundSample, setSelectedSoundSample] = useState<AcousticSampleItem>(MOCK_ACOUSTIC_SAMPLES[0]);
  const [isPlayingSample, setIsPlayingSample] = useState(false);

  // Visual Scanner state
  const [selectedWarningLight, setSelectedWarningLight] = useState<WarningLightItem>(MOCK_WARNING_LIGHTS[0]);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);

  // OBD state
  const [obdCodeSearch, setObdCodeSearch] = useState("");
  const [selectedObdResult, setSelectedObdResult] = useState<ObdCodeItem>(MOCK_OBD_CODES[0]);

  // Mic timer effect
  useEffect(() => {
    let interval: any = null;
    if (isRecordingMic) {
      interval = setInterval(() => {
        setMicSeconds((prev) => {
          if (prev >= 6) {
            setIsRecordingMic(false);
            toast.success("AI finished processing acoustic recording!");
            handleAcousticAnalysis(selectedSoundSample);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setMicSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingMic, selectedSoundSample]);

  const handleNlpDiagnosis = async (textToAnalyze: string) => {
    const q = textToAnalyze.trim();
    if (!q) return;
    setIsAnalyzing(true);
    try {
      const result = await aiDiagnosticService.diagnoseSymptomText(q);
      setDiagnosticReport(result);
      toast.success("AI Diagnostic Report Generated");
    } catch {
      toast.error("Failed to run AI triage");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAcousticAnalysis = async (sample: AcousticSampleItem) => {
    setIsAnalyzing(true);
    try {
      const result = await aiDiagnosticService.diagnoseAcousticSample(sample);
      setDiagnosticReport(result);
      toast.success(`Acoustic match: ${sample.name}`);
    } catch {
      toast.error("Failed to analyze audio sample");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleWarningLightSelect = async (light: WarningLightItem) => {
    setSelectedWarningLight(light);
    setIsAnalyzing(true);
    try {
      const result = await aiDiagnosticService.diagnoseWarningLight(light);
      setDiagnosticReport(result);
      toast.success(`Identified: ${light.name}`);
    } catch {
      toast.error("Failed to diagnose warning light");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleObdSearch = (code: string) => {
    setObdCodeSearch(code);
    const match = MOCK_OBD_CODES.find((c) => c.code.toLowerCase() === code.trim().toLowerCase());
    if (match) {
      setSelectedObdResult(match);
      setDiagnosticReport({
        title: `${match.code} - ${match.title}`,
        category: match.system,
        severity: match.severity,
        severityColor: match.severityColor,
        confidenceScore: 99.2,
        explanation: match.recommendation,
        canDrive: match.canDrive,
        diySafety: match.diyDifficulty,
        estimatedCost: `$${match.estimatedCost.min} - $${match.estimatedCost.max}`,
        troubleshootingSteps: match.symptoms.concat(match.causes),
        relatedDtc: match.code,
      });
      toast.success(`DTC Decoded: ${match.code}`);
    }
  };

  const handleCopyReport = () => {
    if (!diagnosticReport) return;
    const reportText = `Automobile-Mech-AI Diagnostic Report:\nIssue: ${diagnosticReport.title}\nCategory: ${diagnosticReport.category}\nSeverity: ${diagnosticReport.severity}\nDrive Safety: ${diagnosticReport.canDrive}\nEstimated Cost: ${diagnosticReport.estimatedCost}\nTroubleshooting:\n${diagnosticReport.troubleshootingSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    toast.success("Diagnostic report copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const quickSymptoms = [
    "Car vibrates heavily at 60 MPH",
    "Thick white smoke from exhaust",
    "Rhythmic clicking when making sharp turns",
    "Engine sputtering during acceleration",
    "Rapid clicking sound won't start",
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
            <Sparkles className="size-3.5" /> Next-Gen Multimodal AI Diagnostics
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
            AI Vehicle Diagnostic Suite
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Diagnose vehicle symptoms via natural language, acoustic sound frequency analysis, dashboard warning light scans, or OBD-II DTC lookups.
          </p>
        </div>

        {/* 4 Mode Navigation Tabs */}
        <div className="mt-10">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
            <div className="flex justify-center">
              <TabsList className="grid w-full max-w-2xl grid-cols-4">
                <TabsTrigger value="nlp" className="gap-2 text-xs sm:text-sm">
                  <Sparkles className="size-3.5" /> Describe
                </TabsTrigger>
                <TabsTrigger value="acoustic" className="gap-2 text-xs sm:text-sm">
                  <Volume2 className="size-3.5" /> Acoustic
                </TabsTrigger>
                <TabsTrigger value="visual" className="gap-2 text-xs sm:text-sm">
                  <Eye className="size-3.5" /> Dash Light
                </TabsTrigger>
                <TabsTrigger value="obd" className="gap-2 text-xs sm:text-sm">
                  <Binary className="size-3.5" /> OBD-II
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: NLP Symptom Triage */}
            <TabsContent value="nlp" className="mt-6">
              <Card className="card-elev border-border/60 bg-card p-6 sm:p-8">
                <h2 className="text-lg font-bold">Describe Your Vehicle Problem</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Type what you feel, hear, or smell — our AI mechanic will cross-reference 500+ automotive service bulletins.
                </p>

                <div className="mt-4">
                  <Textarea
                    rows={3}
                    placeholder="e.g. My car shudders when braking from highway speeds, and steering wheel vibrates..."
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    className="resize-none"
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Quick Examples:</span>
                  {quickSymptoms.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setUserQuery(chip);
                        handleNlpDiagnosis(chip);
                      }}
                      className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/50 hover:bg-muted hover:text-foreground"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <div className="mt-6">
                  <Button
                    onClick={() => handleNlpDiagnosis(userQuery)}
                    disabled={isAnalyzing || !userQuery.trim()}
                    size="lg"
                    className="grad-primary text-primary-foreground"
                  >
                    {isAnalyzing ? "Analyzing Symptoms..." : "Generate AI Diagnosis Report"}
                    <Sparkles className="ml-2 size-4" />
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* TAB 2: Acoustic Sound Studio */}
            <TabsContent value="acoustic" className="mt-6">
              <Card className="card-elev border-border/60 bg-card p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold">Engine & Chassis Acoustic Studio</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Record live engine noises or select standard mechanical acoustic resonance profiles.
                    </p>
                  </div>
                  <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                    <Activity className="mr-1 size-3" /> Live Frequency Spectrogram
                  </Badge>
                </div>

                {/* Simulated Microphone Recording Bar */}
                <div className="mt-6 rounded-2xl border border-border/60 bg-muted/30 p-6 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setIsRecordingMic(!isRecordingMic)}
                      className={`grid size-16 place-items-center rounded-full transition-all ${
                        isRecordingMic
                          ? "bg-destructive text-destructive-foreground animate-pulse shadow-lg shadow-destructive/40"
                          : "grad-primary text-primary-foreground shadow-lg"
                      }`}
                    >
                      {isRecordingMic ? <MicOff className="size-7" /> : <Mic className="size-7" />}
                    </button>
                    <p className="mt-3 font-semibold text-sm">
                      {isRecordingMic ? `Listening to Engine Noise... (${micSeconds}s / 6s)` : "Tap to Record Engine Noise"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Hold phone near engine bay or wheel well safely with vehicle stationary
                    </p>
                  </div>

                  {/* Audio Waveform visualization */}
                  <div className="mt-6 flex h-16 items-center justify-center gap-1.5 px-4">
                    {selectedSoundSample.audioWaveform.map((h, i) => (
                      <div
                        key={i}
                        className={`w-2 rounded-full transition-all duration-200 ${
                          isRecordingMic
                            ? "bg-destructive animate-pulse"
                            : "bg-primary/70"
                        }`}
                        style={{ height: `${isRecordingMic ? Math.max(15, (h + Math.random() * 20)) : h}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Sample Preset Audio Clips */}
                <div className="mt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Or Select a Standard Problem Audio Signature
                  </h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {MOCK_ACOUSTIC_SAMPLES.map((sample) => (
                      <div
                        key={sample.id}
                        onClick={() => {
                          setSelectedSoundSample(sample);
                          handleAcousticAnalysis(sample);
                        }}
                        className={`cursor-pointer rounded-xl border p-4 transition ${
                          selectedSoundSample.id === sample.id
                            ? "border-primary bg-primary/10 ring-1 ring-primary"
                            : "border-border/60 bg-muted/20 hover:border-primary/40 hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">{sample.name}</span>
                          <span className="grid size-6 place-items-center rounded-full bg-primary/20 text-primary">
                            <Play className="size-3 fill-primary" />
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                          {sample.description}
                        </p>
                        <div className="mt-3 flex items-center justify-between text-[11px] font-medium">
                          <span className="text-primary">{sample.frequencyHz}</span>
                          <span className="font-semibold text-foreground">{sample.estimatedCost}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* TAB 3: Visual Dashboard Warning Light & Photo Scanner */}
            <TabsContent value="visual" className="mt-6">
              <Card className="card-elev border-border/60 bg-card p-6 sm:p-8">
                <h2 className="text-lg font-bold">Dashboard Warning Lamp Scanner</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Select your active dashboard indicator icon or upload a photo of your instrument cluster.
                </p>

                {/* Warning Light Grid */}
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  {MOCK_WARNING_LIGHTS.map((light) => (
                    <button
                      key={light.id}
                      type="button"
                      onClick={() => handleWarningLightSelect(light)}
                      className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                        selectedWarningLight.id === light.id
                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                          : "border-border/60 bg-muted/20 hover:border-primary/40 hover:bg-muted/40"
                      }`}
                    >
                      <div
                        className="grid size-12 place-items-center rounded-lg font-bold text-lg"
                        style={{ color: light.color, backgroundColor: `${light.color}15` }}
                      >
                        ⚠️
                      </div>
                      <span className="mt-2 text-xs font-semibold text-foreground line-clamp-1">
                        {light.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase mt-0.5">
                        {light.severity.split('/')[0]}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Photo Upload Scanner Box */}
                <div className="mt-6 rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 p-6 text-center">
                  <label className="flex cursor-pointer flex-col items-center justify-center">
                    <Upload className="size-8 text-primary" />
                    <span className="mt-2 text-sm font-semibold">
                      {uploadedImagePreview ? "Photo Uploaded — Click to Change" : "Upload Cluster or Engine Photo"}
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      PNG, JPG, or HEIC up to 10MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          setUploadedImagePreview(url);
                          handleNlpDiagnosis("Dashboard warning light or under-hood visual issue detected in photo");
                        }
                      }}
                    />
                  </label>
                  {uploadedImagePreview && (
                    <div className="mt-4 flex justify-center">
                      <img src={uploadedImagePreview} alt="Preview" className="max-h-48 rounded-xl object-contain border border-border/60" />
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* TAB 4: OBD-II Code Lookup */}
            <TabsContent value="obd" className="mt-6">
              <Card className="card-elev border-border/60 bg-card p-6 sm:p-8">
                <h2 className="text-lg font-bold">OBD-II Diagnostic Trouble Code (DTC) Search</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter any standard P, C, B, or U trouble code (e.g., P0300, P0420, C0035) from your handheld scanner.
                </p>

                <div className="mt-4 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Enter DTC code (e.g. P0300, P0420, P0171)..."
                      className="pl-9 font-mono uppercase"
                      value={obdCodeSearch}
                      onChange={(e) => setObdCodeSearch(e.target.value.toUpperCase())}
                    />
                  </div>
                  <Button
                    onClick={() => handleObdSearch(obdCodeSearch)}
                    className="grad-primary text-primary-foreground"
                  >
                    Lookup DTC
                  </Button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Popular codes:</span>
                  {MOCK_OBD_CODES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleObdSearch(c.code)}
                      className="rounded-md border border-border/60 bg-muted/40 px-2 py-1 font-mono text-xs font-semibold transition hover:border-primary/50 hover:bg-muted"
                    >
                      {c.code}
                    </button>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Diagnostic Report Display */}
        {diagnosticReport && (
          <div className="mt-10">
            <Card className="card-elev border-border/60 bg-card p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-5 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Diagnostic Evaluation Report
                    </span>
                  </div>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight">
                    {diagnosticReport.title}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    System Category: <span className="font-semibold text-foreground">{diagnosticReport.category}</span> · AI Confidence: <span className="font-semibold text-primary">{diagnosticReport.confidenceScore}%</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      diagnosticReport.severity === "Critical"
                        ? "destructive"
                        : diagnosticReport.severity === "High"
                        ? "destructive"
                        : "default"
                    }
                    className="uppercase"
                  >
                    {diagnosticReport.severity} Severity
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyReport}
                    className="gap-1.5 text-xs"
                  >
                    {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                    {copied ? "Copied" : "Copy Report"}
                  </Button>
                </div>
              </div>

              {/* Driving Safety Alert Banner */}
              <div
                className={`mt-6 rounded-xl border p-4 ${
                  diagnosticReport.severity === "Critical"
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : "border-warning/40 bg-warning/10 text-warning"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Can I still safely drive this vehicle?</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{diagnosticReport.canDrive}</p>
                  </div>
                </div>
              </div>

              {/* Explanation & Cost Breakdown */}
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Root Cause Diagnosis
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">
                    {diagnosticReport.explanation}
                  </p>
                  {diagnosticReport.relatedDtc && (
                    <div className="mt-4 flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Associated OBD-II DTC:</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {diagnosticReport.relatedDtc}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/20 p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Repair Cost & DIY Feasibility
                  </h3>
                  <div className="mt-3 flex items-center justify-between border-b border-border/60 pb-3">
                    <span className="text-xs text-muted-foreground">Estimated Fair Cost:</span>
                    <span className="text-lg font-bold text-primary">{diagnosticReport.estimatedCost}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">DIY Feasibility:</span>
                    <span className="text-xs font-semibold text-foreground">{diagnosticReport.diySafety}</span>
                  </div>
                </div>
              </div>

              {/* Troubleshooting Checklist */}
              <div className="mt-6 rounded-xl border border-border/60 bg-muted/20 p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recommended Action Steps
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                  {diagnosticReport.troubleshootingSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                      <span className="text-foreground">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Call-to-action Action Buttons */}
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="grad-primary text-primary-foreground">
                  <Link to="/mechanics" search={{ service: diagnosticReport.title }}>
                    Find Verified Mechanics for this Fix <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link to="/cost-estimator">
                    View Transparent Cost Breakdown
                  </Link>
                </Button>
                {diagnosticReport.severity === "Critical" && (
                  <Button asChild size="lg" variant="destructive">
                    <Link to="/sos">
                      Emergency Roadside SOS <ShieldAlert className="ml-2 size-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
