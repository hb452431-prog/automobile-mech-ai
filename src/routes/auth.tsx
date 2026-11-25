import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Wrench, Phone, Mail, Sparkles, ShieldCheck, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "@/lib/firebase";
import { fetchUserRole, setUserRole, useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      fetchUserRole(user.id).then((role) => {
        if (role === "mechanic") navigate({ to: "/partner-portal" });
        else if (role === "customer") navigate({ to: "/customer/home" });
        else navigate({ to: "/role-select" });
      });
    }
  }, [user, loading, navigate]);

  const handleGoogleSignIn = async () => {
    setBusy(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      toast.success(`Welcome, ${res.user.displayName || res.user.email}!`);
    } catch (err: any) {
      console.error("Firebase Google Auth error:", err);
      toast.error(err.message || "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setBusy(true);
    try {
      if (authMode === "signin") {
        const res = await signInWithEmailAndPassword(auth, email, password);
        toast.success(`Signed in as ${res.user.email}`);
        const role = await fetchUserRole(res.user.uid);
        if (role === "mechanic") navigate({ to: "/partner-portal" });
        else if (role === "customer") navigate({ to: "/customer/home" });
        else navigate({ to: "/role-select" });
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        toast.success(`Account created as ${res.user.email}`);
        navigate({ to: "/role-select" });
      }
    } catch (err: any) {
      console.error("Firebase Email Auth error:", err);
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        toast.error("Invalid email or password. If you are new, switch to 'Create Account' above.");
      } else if (err.code === "auth/email-already-in-use") {
        toast.error("Email already in use. Please switch to Sign In.");
      } else {
        toast.error(err.message || "Authentication failed");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDemoDriverLogin = async () => {
    setBusy(true);
    const demoEmail = "demo.driver@mechgo.app";
    const demoPass = "MechGo2026!";
    try {
      const res = await signInWithEmailAndPassword(auth, demoEmail, demoPass);
      setUserRole(res.user.uid, "customer");
      toast.success("Signed in as Demo Customer / Driver");
      navigate({ to: "/customer/home" });
    } catch {
      try {
        const res = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
        setUserRole(res.user.uid, "customer");
        toast.success("Demo Customer account created & signed in");
        navigate({ to: "/customer/home" });
      } catch {
        toast.error("Could not sign in with demo credentials");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDemoMechanicLogin = async () => {
    setBusy(true);
    const demoEmail = "demo.mechanic@mechgo.app";
    const demoPass = "MechGo2026!";
    try {
      const res = await signInWithEmailAndPassword(auth, demoEmail, demoPass);
      setUserRole(res.user.uid, "mechanic");
      toast.success("Signed in as Demo Mechanic Partner");
      navigate({ to: "/partner-portal" });
    } catch {
      try {
        const res = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
        setUserRole(res.user.uid, "mechanic");
        toast.success("Demo Mechanic account created & signed in");
        navigate({ to: "/partner-portal" });
      } catch {
        toast.error("Could not sign in with demo credentials");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl grad-primary text-primary-foreground shadow-lg">
            <Wrench className="size-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Automobile-Mech-AI</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Sign in with Firebase Authentication to access services
          </p>
        </div>

        <div className="card-elev rounded-2xl border border-border/60 bg-card p-6 shadow-xl">
          {/* Google Sign In Button */}
          <Button 
            onClick={handleGoogleSignIn} 
            disabled={busy} 
            className="w-full grad-primary text-primary-foreground font-semibold shadow-md" 
            size="lg"
          >
            <svg className="mr-2 size-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M21.35 11.1H12v3.8h5.35c-.23 1.5-1.7 4.4-5.35 4.4-3.22 0-5.85-2.67-5.85-5.95S8.78 7.4 12 7.4c1.83 0 3.06.78 3.77 1.45L18.7 6.1C16.85 4.4 14.6 3.35 12 3.35 6.98 3.35 2.9 7.43 2.9 12.45S6.98 21.55 12 21.55c6.94 0 9.4-4.87 9.4-8.5 0-.57-.05-1.01-.05-1.95z"/>
            </svg>
            Continue with Google
          </Button>

          {/* Quick 1-Click Demo Logins for Both Portals */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button 
              type="button"
              onClick={handleDemoDriverLogin} 
              disabled={busy} 
              variant="outline" 
              className="text-xs font-semibold h-9 border-primary/30 hover:bg-primary/10 hover:text-primary" 
              size="sm"
            >
              🚗 Demo Driver
            </Button>
            <Button 
              type="button"
              onClick={handleDemoMechanicLogin} 
              disabled={busy} 
              variant="outline" 
              className="text-xs font-semibold h-9 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-500" 
              size="sm"
            >
              🔧 Demo Mechanic
            </Button>
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border/60" /> OR <div className="h-px flex-1 bg-border/60" />
          </div>

          {/* Email / Password Sign In Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4 text-xs">
            <div className="flex rounded-lg border border-border/60 bg-muted/30 p-1">
              <button
                type="button"
                onClick={() => setAuthMode("signin")}
                className={`flex-1 rounded-md py-1.5 font-semibold transition ${
                  authMode === "signin"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("signup")}
                className={`flex-1 rounded-md py-1.5 font-semibold transition ${
                  authMode === "signup"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Email Address</Label>
              <Input
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Password</Label>
              <Input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <Button 
              type="submit" 
              disabled={busy || !email || password.length < 6} 
              className="w-full grad-primary text-primary-foreground font-semibold"
            >
              {busy ? "Processing..." : authMode === "signin" ? "Sign In to Account" : "Register Account"}
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3.5 text-success" />
            <span>Protected by Google Firebase Authentication</span>
          </div>

          <div className="mt-3 border-t border-border/40 pt-3 text-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: "/" })}
              className="text-xs text-muted-foreground hover:text-foreground h-8"
            >
              Continue as Guest Explorer →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
