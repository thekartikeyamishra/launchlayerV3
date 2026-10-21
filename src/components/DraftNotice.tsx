"use client";

export default function DraftNotice({ onDiscard, onKeep }: { onDiscard: () => void; onKeep: () => void }) {
  return (
    <div role="status" className="anim-rise flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--trust)]/30 bg-[var(--trust)]/5 px-4 py-2.5 text-sm">
      <span>We restored the draft you left unfinished on this device.</span>
      <span className="flex gap-3 font-semibold">
        <button type="button" onClick={onKeep} className="text-[var(--trust-strong)] hover:underline">Keep editing</button>
        <button type="button" onClick={onDiscard} className="text-[var(--muted)] hover:underline">Start over</button>
      </span>
    </div>
  );
}
