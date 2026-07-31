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
import { ensureUserProfile, getUserProfile, isAdmin } from "@/lib/db";
import type { UserProfile } from "@/lib/types";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  admin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  admin: false,
  loading: true,
  refreshProfile: async () => undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth(), async (u) => {
      setUser(u);
      if (u) {
        try {
          await ensureUserProfile(u.uid, u.displayName ?? u.email?.split("@")[0] ?? "Member");
          const [p, a] = await Promise.all([getUserProfile(u.uid), isAdmin(u.uid)]);
          setProfile(p);
          setAdmin(a);
        } catch {
          setProfile(null);
          setAdmin(false);
        }
      } else {
        setProfile(null);
        setAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      profile,
      admin,
      loading,
      refreshProfile: async () => {
        if (user) setProfile(await getUserProfile(user.uid));
      },
    }),
    [user, profile, admin, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
