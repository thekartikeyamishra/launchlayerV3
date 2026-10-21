// File: src/app/not-found.tsx
import Link from "next/link";
import SearchBox from "@/components/SearchBox";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <p className="font-display text-6xl font-bold text-[var(--trust)]">404</p>
      <h1 className="font-display mt-3 text-2xl font-bold">This page doesn&apos;t exist</h1>
      <p className="mt-2 text-[var(--muted)]">It may have moved, or the tool was removed. Search for what you need instead:</p>
      <div className="mt-6 text-left"><SearchBox /></div>
      <div className="mt-6 flex justify-center gap-4 text-sm">
        <Link href="/" className="text-[var(--trust-strong)] hover:underline">Home</Link>
        <Link href="/tasks" className="text-[var(--trust-strong)] hover:underline">Task guides</Link>
        <Link href="/demand" className="text-[var(--trust-strong)] hover:underline">Demand board</Link>
      </div>
    </div>
  );
}
