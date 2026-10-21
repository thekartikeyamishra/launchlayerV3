// File: src/components/SearchBox.tsx
// Purpose: Plain GET search form — works with zero JavaScript, instant on slow networks,
// and gives every search a shareable URL.

export default function SearchBox({
  defaultValue = "",
  size = "lg",
  autoFocus = false,
}: {
  defaultValue?: string;
  size?: "lg" | "sm";
  autoFocus?: boolean;
}) {
  const big = size === "lg";
  return (
    <form action="/tools" method="get" role="search" className="relative w-full">
      <label htmlFor={`q-${size}`} className="sr-only">Describe the task you need AI for</label>
      <svg aria-hidden="true" className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-[var(--muted)] ${big ? "left-4 h-5 w-5" : "left-3 h-4 w-4"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input
        id={`q-${size}`}
        name="q"
        type="search"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        maxLength={100}
        enterKeyHint="search"
        autoComplete="off"
        placeholder={big ? "Describe the job: “summarise PDFs”, “voiceover in Hindi”, “logo”…" : "Search tools or tasks"}
        className={`w-full border border-[var(--line)] bg-white text-[var(--ink)] shadow-sm placeholder:text-[var(--muted)] focus:border-[var(--trust)] focus:outline-none focus:ring-4 focus:ring-[var(--trust)]/15 ${
          big ? "rounded-2xl py-4 pl-12 pr-28 text-base" : "rounded-xl py-2 pl-9 pr-3 text-sm"
        }`}
      />
      {big && (
        <button
          type="submit"
          className="press absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-[var(--trust)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--trust-strong)]"
        >
          Find AI
        </button>
      )}
    </form>
  );
}
