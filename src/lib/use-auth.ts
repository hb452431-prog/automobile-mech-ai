import { useEffect, useState } from "react";
import { 
  auth, 
  onAuthStateChanged, 
  firebaseSignOut,
  type FirebaseUser 
} from "@/lib/firebase";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "mechanic" | "customer";

export interface AppUser {
  id: string; // Alias for uid to ensure backwards compatibility with existing codebase
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  phone: string | null; // Alias for phoneNumber
  displayName: string | null;
  photoURL: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        setUser({
          id: fbUser.uid,
          uid: fbUser.uid,
          email: fbUser.email,
          phoneNumber: fbUser.phoneNumber,
          phone: fbUser.phoneNumber,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { 
    user, 
    loading,
    signOut: () => firebaseSignOut(auth)
  };
}

export async function fetchUserRole(userId: string): Promise<AppRole | null> {
  if (typeof window !== "undefined") {
    const cachedRole = localStorage.getItem(`mech_user_role_${userId}`);
    if (cachedRole === "mechanic" || cachedRole === "customer") {
      return cachedRole;
    }
  }

  try {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    if (data?.role) {
      if (typeof window !== "undefined") {
        localStorage.setItem(`mech_user_role_${userId}`, data.role);
      }
      return data.role as AppRole;
    }
  } catch (e) {
    console.warn("Could not query remote role", e);
  }
  return null;
}

export function setUserRole(userId: string, role: AppRole) {
  if (typeof window !== "undefined") {
    localStorage.setItem(`mech_user_role_${userId}`, role);
  }
}
