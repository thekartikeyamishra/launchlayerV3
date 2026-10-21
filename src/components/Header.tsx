// File: src/components/Header.tsx
// Purpose: Global navigation with auth state.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import NotificationsBell from "./NotificationsBell";
import SearchBox from "./SearchBox";

const NAV = [
  { href: "/tools", label: "AI Tools" },
  { href: "/tasks", label: "By task" },
  { href: "/demand", label: "Demand Board" },
  { href: "/opportunities", label: "For builders" },
];

export default function Header() {
  const { user, admin, loading } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-[var(--ink)]">
          <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[var(--trust)] to-[#0b8bb0] text-sm text-white shadow-sm">L</span>
          LaunchLayer
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? "bg-[var(--trust)]/10 text-[var(--trust-strong)]"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {admin && (
            <Link href="/admin" className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--demand)] hover:underline">
              Admin
            </Link>
          )}
        </nav>
        <div className="hidden w-56 lg:block xl:w-64">
          {!pathname.startsWith("/tools") && pathname !== "/" && <SearchBox size="sm" />}
        </div>
        <div className="flex items-center gap-2">
          {loading ? null : user ? (
            <>
              <Link href="/saved" className={`hidden rounded-lg px-3 py-1.5 text-sm font-medium sm:inline-block ${pathname.startsWith("/saved") ? "text-[var(--trust-strong)]" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}>
                My library
              </Link>
              <NotificationsBell />
              <Link href="/account" className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)]">
                Account
              </Link>
              <button
                onClick={() => void signOut(auth())}
                className="hidden rounded-lg border sm:inline-block border-[var(--line)] px-3 py-1.5 text-sm font-medium text-[var(--ink)] hover:border-[var(--trust)]"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="rounded-lg bg-[var(--trust)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--trust-strong)]"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
      <nav aria-label="Main mobile" className="flex gap-1 overflow-x-auto border-t border-[var(--line)] px-4 py-1.5 md:hidden">
        {[...NAV, ...(user ? [{ href: "/saved", label: "My library" }] : [])].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-lg px-3 py-1 text-sm font-medium ${
              pathname.startsWith(item.href) ? "bg-[var(--trust)]/10 text-[var(--trust-strong)]" : "text-[var(--muted)]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
