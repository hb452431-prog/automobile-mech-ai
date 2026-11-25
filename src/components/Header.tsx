import { Link, useNavigate } from "@tanstack/react-router";
import {
  Wrench,
  LogOut,
  User as UserIcon,
  AlertCircle,
  Sparkles,
  DollarSign,
  MapPin,
  Car,
  Radio,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { auth, firebaseSignOut } from "@/lib/firebase";
import { useAuth } from "@/lib/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch { }
    try {
      await supabase.auth.signOut();
    } catch { }
    navigate({ to: "/" });
  };

  const navLinks = [
    { to: "/sos", label: "Emergency SOS", badge: "Live", isEmergency: true },
    { to: "/customer/nearby", label: "Nearby Garages", badge: "GPS" },
    { to: "/mechanics", label: "Find Mechanics" },
    { to: "/diagnose", label: "AI Diagnose" },
    { to: "/cost-estimator", label: "Cost Estimator" },
    { to: "/dashboard", label: "My Garage" },
    { to: "/partner-portal", label: "Mechanic Radar" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg grad-primary text-primary-foreground shadow-lg">
            <Wrench className="size-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            Automobile<span className="text-primary">-Mech-AI</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-5 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-xs font-semibold transition hover:text-foreground flex items-center gap-1.5 ${link.isEmergency
                  ? "text-destructive font-bold hover:text-destructive"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {link.isEmergency && (
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-destructive" />
                </span>
              )}
              {link.label}
              {link.badge && (
                <Badge variant="destructive" className="px-1.5 py-0 text-[9px] uppercase font-bold">
                  {link.badge}
                </Badge>
              )}
            </Link>
          ))}
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="secondary" size="sm" className="gap-2">
                <Link to="/profile">
                  <UserIcon className="size-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <span className="hidden max-w-[140px] truncate sm:inline">
                      {user.email ?? user.phone ?? "Account"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
                    <Car className="mr-2 size-4" /> Digital Garage
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                    <UserIcon className="mr-2 size-4" /> View profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/role-select" })}>
                    Switch role
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="mr-2 size-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild size="sm" className="grad-primary text-primary-foreground font-semibold">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}

          {/* Mobile hamburger menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-border/60 bg-background/95 px-4 py-4 lg:hidden backdrop-blur-xl">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition ${link.isEmergency
                    ? "bg-destructive/10 text-destructive"
                    : "hover:bg-muted text-foreground"
                  }`}
              >
                <span className="flex items-center gap-2">
                  {link.isEmergency && <AlertCircle className="size-4 text-destructive" />}
                  {link.label}
                </span>
                {link.badge && (
                  <Badge variant="destructive" className="text-[10px]">
                    {link.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}