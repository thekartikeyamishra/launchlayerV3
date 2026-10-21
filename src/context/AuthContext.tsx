// File: src/context/AuthContext.tsx
// Purpose: App-wide auth state (Firebase user + Firestore profile + admin flag).

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ensureUserProfile, fetchStaffRole, getUserProfile } from "@/lib/db";
import type { StaffRole } from "@/lib/roles";
import type { UserProfile } from "@/lib/types";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  /** True for any staff role — use `role` + can() from lib/roles for specific permissions. */
  admin: boolean;
  role: StaffRole | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  admin: false,
  role: null,
  loading: true,
  refreshProfile: async () => undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth(), async (u) => {
      setUser(u);
      if (u) {
        try {
          await ensureUserProfile(u.uid, u.displayName ?? u.email?.split("@")[0] ?? "Member");
          const [p, r] = await Promise.all([getUserProfile(u.uid), fetchStaffRole(u.uid)]);
          setProfile(p);
          setRole(r);
        } catch {
          setProfile(null);
          setRole(null);
        }
      } else {
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      profile,
      admin: role !== null,
      role,
      loading,
      refreshProfile: async () => {
        if (user) setProfile(await getUserProfile(user.uid));
      },
    }),
    [user, profile, role, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
