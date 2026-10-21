// File: src/components/ToolLogo.tsx
// Purpose: Deterministic monogram logo. No third-party image hotlinking: zero broken logos,
// zero layout shift, zero trademark-logo reproduction, zero extra requests.

const HUES = [160, 200, 230, 260, 290, 20, 35, 120, 340, 185];

export default function ToolLogo({ name, size = 44 }: { name: string; size?: number }) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = HUES[h % HUES.length] ?? 160;
  const initials = name.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "AI";
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-xl font-display font-bold text-white shadow-sm"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, hsl(${hue} 62% 42%), hsl(${(hue + 40) % 360} 60% 32%))`,
      }}
    >
      {initials}
    </span>
  );
}
