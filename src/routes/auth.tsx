import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Wrench, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { fetchUserRole, useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      fetchUserRole(user.id).then((role) => {
        if (role === "mechanic") navigate({ to: "/mechanic/dashboard" });
        else if (role === "customer") navigate({ to: "/customer/home" });
        else navigate({ to: "/role-select" });
      });
    }
  }, [user, loading, navigate]);

  const google = async () => {
    setBusy(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (res.error) { toast.error("Google sign-in failed"); setBusy(false); }
  };

  const sendOtp = async () => {
    if (!phone.startsWith("+") || phone.length < 8) return toast.error("Enter phone in +91... format");
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setBusy(false);
    if (error) return toast.error(error.message.includes("provider") || error.message.includes("phone")
      ? "SMS OTP requires phone provider setup in backend auth settings."
      : error.message);
    setOtpSent(true);
    toast.success("OTP sent");
  };

  const verifyOtp = async () => {
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Signed in");
  };

  const emailSignIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (!error) return;
    // Try sign up if not existing
    const { error: se } = await supabase.auth.signUp({ email, password });
    if (se) toast.error(se.message);
    else toast.success("Account created — check email if confirmation required");
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-xl grad-primary text-primary-foreground">
            <Wrench className="size-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Welcome to Automobile-Mech-AI</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in or create an account to continue</p>
        </div>

        <div className="card-elev rounded-2xl border border-border/60 bg-card p-6">
          <Button onClick={google} disabled={busy} className="w-full grad-primary text-primary-foreground" size="lg">
            <svg className="mr-2 size-5" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1H12v3.8h5.35c-.23 1.5-1.7 4.4-5.35 4.4-3.22 0-5.85-2.67-5.85-5.95S8.78 7.4 12 7.4c1.83 0 3.06.78 3.77 1.45L18.7 6.1C16.85 4.4 14.6 3.35 12 3.35 6.98 3.35 2.9 7.43 2.9 12.45S6.98 21.55 12 21.55c6.94 0 9.4-4.87 9.4-8.5 0-.57-.05-1.01-.05-1.95z"/></svg>
            Continue with Google
          </Button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="phone">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="phone"><Phone className="mr-2 size-4" />Phone OTP</TabsTrigger>
              <TabsTrigger value="email"><Mail className="mr-2 size-4" />Email</TabsTrigger>
            </TabsList>

            <TabsContent value="phone" className="space-y-3 pt-4">
              {!otpSent ? (
                <>
                  <Label>Mobile number</Label>
                  <Input placeholder="+919876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <Button onClick={sendOtp} disabled={busy} className="w-full">Send OTP</Button>
                  <p className="text-[11px] text-muted-foreground">
                    Requires an SMS provider (Twilio) configured in backend Auth settings.
                  </p>
                </>
              ) : (
                <>
                  <Label>Enter 6-digit OTP sent to {phone}</Label>
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                    </InputOTPGroup>
                  </InputOTP>
                  <Button onClick={verifyOtp} disabled={busy || otp.length < 6} className="w-full">Verify</Button>
                  <Button variant="ghost" size="sm" onClick={() => setOtpSent(false)}>Change number</Button>
                </>
              )}
            </TabsContent>

            <TabsContent value="email" className="space-y-3 pt-4">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 chars" />
              <Button onClick={emailSignIn} disabled={busy || !email || password.length < 6} className="w-full">
                Sign in / Sign up
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
