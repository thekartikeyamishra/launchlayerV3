// File: src/app/account/page.tsx
// Purpose: Profile, Verified Creator application, my posts, data export (DPDP/GDPR), account deletion.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteUser, sendEmailVerification } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/context/AuthContext";
import { deleteOwnUserDoc, fetchMyPosts, requestVerifiedCreator } from "@/lib/db";
import type { DemandPost } from "@/lib/types";
import { logEvent } from "@/lib/analytics";
import DemandCard from "@/components/DemandCard";
import { Button, ErrorNote, Pill, Skeleton, VerifiedBadge } from "@/components/ui";

export default function AccountPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const [myPosts, setMyPosts] = useState<DemandPost[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        setMyPosts(await fetchMyPosts(user.uid));
      } catch {
        setMyPosts([]);
      }
    })();
  }, [user]);

  if (loading) return <Skeleton className="h-96" />;
  if (!user) {
    return (
      <p className="text-sm text-[var(--muted)]">
        <Link href="/sign-in" className="font-semibold text-[var(--trust-strong)] hover:underline">Sign in</Link> to manage your account.
      </p>
    );
  }

  const exportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      account: { uid: user.uid, email: user.email, displayName: user.displayName, emailVerified: user.emailVerified },
      profile,
      demandPosts: myPosts ?? [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "launchlayer-my-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyVerified = async () => {
    setBusy(true);
    setError("");
    try {
      await requestVerifiedCreator(user.uid);
      logEvent("verified_creator.requested.v1");
      await refreshProfile();
      setNotice("Application received. Verification is a manual review — you'll see the badge on your account once approved.");
    } catch {
      setError("The application couldn't be submitted. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const removeAccount = async () => {
    const confirmed = window.confirm(
      "Delete your LaunchLayer account? Your profile is removed permanently. Your demand posts remain on the board under your display name unless you delete them first or request removal.",
    );
    if (!confirmed) return;
    setBusy(true);
    setError("");
    try {
      await deleteOwnUserDoc(user.uid);
      await deleteUser(user);
      router.push("/");
    } catch (err) {
      if (err instanceof FirebaseError && err.code === "auth/requires-recent-login") {
        setError("For security, deleting an account requires a recent sign-in. Sign out, sign back in, then delete.");
      } else {
        setError("The account couldn't be deleted. Try again.");
      }
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <section>
        <h1 className="font-display text-2xl font-bold">Account</h1>
        <div className="mt-4 rounded-xl border border-[var(--line)] bg-white p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{user.displayName ?? "Member"}</p>
            {profile?.verifiedCreator && <VerifiedBadge />}
            {user.emailVerified ? <Pill tone="trust">Email verified</Pill> : <Pill tone="demand">Email not verified</Pill>}
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">{user.email}</p>
          {!user.emailVerified && (
            <Button
              variant="secondary"
              className="mt-3"
              onClick={async () => {
                try {
                  await sendEmailVerification(user);
                  setNotice("Verification email sent. Check your inbox.");
                } catch {
                  setError("The verification email couldn't be sent right now. Try again shortly.");
                }
              }}
            >
              Send verification email
            </Button>
          )}
        </div>
      </section>

      <section aria-labelledby="creator-heading">
        <h2 id="creator-heading" className="font-display text-lg font-bold">Verified Creator</h2>
        <div className="mt-3 rounded-xl border border-[var(--line)] bg-white p-5 text-sm">
          {profile?.verifiedCreator ? (
            <p className="text-[var(--trust-strong)]">
              You&apos;re a Verified Creator. You can attach solutions to demand posts across the board.
            </p>
          ) : profile?.verifiedCreatorRequest === "pending" ? (
            <p className="text-[var(--muted)]">
              Your application is <strong>pending manual review</strong>. Verification is reviewed by a person, not an algorithm — that&apos;s what makes the badge mean something.
            </p>
          ) : (
            <>
              <p className="text-[var(--muted)]">
                Verified Creators can respond to demand posts with their solutions. Verification requires a verified
                email and a manual review of your profile.
              </p>
              <Button className="mt-3" onClick={applyVerified} disabled={busy || !user.emailVerified}>
                Apply for Verified Creator
              </Button>
              {!user.emailVerified && <p className="mt-2 text-xs text-[var(--muted)]">Verify your email first.</p>}
            </>
          )}
        </div>
      </section>

      <section aria-labelledby="myposts-heading">
        <h2 id="myposts-heading" className="font-display text-lg font-bold">My demand posts</h2>
        {myPosts === null ? (
          <Skeleton className="mt-3 h-32" />
        ) : myPosts.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">
            You haven&apos;t posted any requests yet.{" "}
            <Link href="/demand/new" className="font-semibold text-[var(--trust-strong)] hover:underline">Post your first</Link>.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {myPosts.map((p) => (<DemandCard key={p.id} post={p} />))}
          </div>
        )}
      </section>

      <section aria-labelledby="privacy-heading">
        <h2 id="privacy-heading" className="font-display text-lg font-bold">Your data</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={exportData}>Download my data (JSON)</Button>
          <Button variant="danger" onClick={removeAccount} disabled={busy}>Delete my account</Button>
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Export and deletion are provided under the DPDP Act and GDPR. See the{" "}
          <Link href="/legal/privacy" className="underline">Privacy Policy</Link> for details.
        </p>
      </section>

      {error && <ErrorNote message={error} />}
      {notice && <p className="rounded-lg border border-[var(--trust)]/30 bg-[var(--trust)]/5 px-4 py-3 text-sm text-[var(--trust-strong)]">{notice}</p>}
    </div>
  );
}
