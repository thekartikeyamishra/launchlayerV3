// File: src/app/sign-in/page.tsx
// Purpose: Email/password + Google sign-in, sign-up, and password reset.

"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase";
import { signInSchema } from "@/lib/schemas";
import { logEvent } from "@/lib/analytics";
import { Button, ErrorNote, Field, TextInput } from "@/components/ui";

const AUTH_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "An account with this email already exists. Switch to Sign in.",
  "auth/invalid-credential": "That email and password don't match. Check both, or use Forgot password.",
  "auth/user-not-found": "No account with this email. Switch to Create account.",
  "auth/wrong-password": "That password doesn't match. Try again or use Forgot password.",
  "auth/too-many-requests": "Too many attempts. Wait a few minutes, then try again.",
  "auth/popup-closed-by-user": "The Google window was closed before finishing. Try again.",
  "auth/network-request-failed": "Network problem. Check your connection and try again.",
};

function authMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    return AUTH_MESSAGES[err.code] ?? "Sign-in failed. Try again.";
  }
  return "Sign-in failed. Try again.";
}

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get("next") ?? "/demand";
  // Only allow same-site relative redirects — never absolute URLs.
  const nextPath = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/demand";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check your details."); return; }
    if (mode === "signup" && name.trim().length < 2) { setError("Enter your name (at least 2 characters)."); return; }
    setBusy(true);
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth(), parsed.data.email, parsed.data.password);
        await updateProfile(cred.user, { displayName: name.trim() });
        await sendEmailVerification(cred.user);
        logEvent("auth.signed_up.v1");
        setNotice("Account created. A verification link is on its way to your inbox.");
        router.push(nextPath);
      } else {
        await signInWithEmailAndPassword(auth(), parsed.data.email, parsed.data.password);
        logEvent("auth.signed_in.v1", { method: "password" });
        router.push(nextPath);
      }
    } catch (err) {
      setError(authMessage(err));
      setBusy(false);
    }
  };

  const google = async () => {
    setError("");
    setBusy(true);
    try {
      await signInWithPopup(auth(), new GoogleAuthProvider());
      logEvent("auth.signed_in.v1", { method: "google" });
      router.push(nextPath);
    } catch (err) {
      setError(authMessage(err));
      setBusy(false);
    }
  };

  const reset = async () => {
    setError("");
    const parsed = signInSchema.pick({ email: true }).safeParse({ email });
    if (!parsed.success) { setError("Enter your email above first, then choose Forgot password."); return; }
    try {
      await sendPasswordResetEmail(auth(), parsed.data.email);
      setNotice("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(authMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-2xl font-bold">{mode === "signin" ? "Sign in" : "Create your account"}</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {mode === "signin" ? "Welcome back to LaunchLayer." : "Join as a founding member of the demand board."}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <Field label="Your name" htmlFor="name">
            <TextInput id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        )}
        <Field label="Email" htmlFor="email">
          <TextInput id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" htmlFor="password" hint={mode === "signup" ? "At least 8 characters." : undefined}>
          <TextInput id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <ErrorNote message={error} />}
        {notice && <p className="rounded-lg border border-[var(--trust)]/30 bg-[var(--trust)]/5 px-4 py-3 text-sm text-[var(--trust-strong)]">{notice}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <Button variant="secondary" onClick={google} disabled={busy} className="mt-3 w-full">
        Continue with Google
      </Button>

      <div className="mt-5 flex items-center justify-between text-sm">
        <button
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setNotice(""); }}
          className="font-medium text-[var(--trust-strong)] hover:underline"
        >
          {mode === "signin" ? "Create an account" : "I already have an account"}
        </button>
        {mode === "signin" && (
          <button onClick={reset} className="text-[var(--muted)] hover:underline">
            Forgot password
          </button>
        )}
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
