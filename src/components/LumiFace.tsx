// File: src/components/LumiFace.tsx
// Purpose: Lumi, LaunchLayer's mascot — an SVG face with expressive moods, blinking and
// pupils that follow the pointer. Pure SVG + CSS: no images, no animation library, ~3 KB.

"use client";

import { useId } from "react";

export type Mood = "idle" | "happy" | "thinking" | "surprised" | "wink" | "sad" | "love" | "sleepy" | "excited";

const MOUTHS: Record<Mood, string> = {
  idle: "M24 41 Q32 46 40 41",
  happy: "M22 39 Q32 50 42 39 Z",
  excited: "M21 38 Q32 53 43 38 Z",
  thinking: "M27 43 Q33 41 38 43",
  surprised: "M32 39 m-4 0 a4 5 0 1 0 8 0 a4 5 0 1 0 -8 0",
  wink: "M23 40 Q32 48 41 40",
  sad: "M24 45 Q32 39 40 45",
  love: "M22 39 Q32 50 42 39 Z",
  sleepy: "M28 43 Q32 45 36 43",
};

function Eye({ cx, mood, look, side }: { cx: number; mood: Mood; look: { x: number; y: number }; side: "l" | "r" }) {
  if (mood === "love") {
    return <path d={`M${cx} 31 l-5 -5 a3 3 0 0 1 5 -4 a3 3 0 0 1 5 4 z`} fill="#ff5a7a" className="lumi-pulse" />;
  }
  if (mood === "sleepy" || (mood === "wink" && side === "r")) {
    return <path d={`M${cx - 5} 27 Q${cx} ${mood === "sleepy" ? 30 : 23} ${cx + 5} 27`} stroke="#14213d" strokeWidth="2.4" fill="none" strokeLinecap="round" />;
  }
  if (mood === "happy" || mood === "excited") {
    return <path d={`M${cx - 5} 28 Q${cx} 21 ${cx + 5} 28`} stroke="#14213d" strokeWidth="2.6" fill="none" strokeLinecap="round" />;
  }
  const big = mood === "surprised";
  const ty = mood === "thinking" ? -2.5 : 0;
  const tx = mood === "thinking" ? 2 : 0;
  return (
    <g className="lumi-blink" style={{ transformOrigin: `${cx}px 27px` }}>
      <ellipse cx={cx} cy={27} rx={big ? 6 : 5} ry={big ? 7 : 6} fill="#fff" />
      <circle cx={cx + look.x + tx} cy={27 + look.y + ty} r={big ? 2.6 : 3} fill="#14213d" />
      <circle cx={cx + look.x + tx + 1} cy={25.6 + look.y + ty} r={0.9} fill="#fff" />
    </g>
  );
}

export default function LumiFace({ mood, look = { x: 0, y: 0 }, size = 56 }: { mood: Mood; look?: { x: number; y: number }; size?: number }) {
  const sad = mood === "sad";
  const gid = `lumi-${useId().replace(/:/g, "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={mood === "excited" ? "lumi-bounce" : mood === "sleepy" ? "lumi-breathe" : "lumi-float"}>
      <defs>
        <radialGradient id={gid} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#5fe0c0" />
          <stop offset="0.55" stopColor="#14a08a" />
          <stop offset="1" stopColor="#0a5f4e" />
        </radialGradient>
      </defs>
      {/* antenna */}
      <line x1="32" y1="9" x2="32" y2="3.5" stroke="#0a5f4e" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="3.5" r="2.6" fill={mood === "thinking" ? "#f5b301" : "#7ee0c6"} className={mood === "thinking" ? "lumi-pulse" : undefined} />
      <rect x="6" y="9" width="52" height="48" rx="22" fill={`url(#${gid})`} />
      <ellipse cx="23" cy="17" rx="9" ry="4" fill="#fff" opacity="0.22" />
      {(mood === "happy" || mood === "love" || mood === "excited" || mood === "wink") && (
        <>
          <ellipse cx="15" cy="37" rx="4" ry="2.4" fill="#ff8fa3" opacity="0.6" />
          <ellipse cx="49" cy="37" rx="4" ry="2.4" fill="#ff8fa3" opacity="0.6" />
        </>
      )}
      {sad && <path d="M18 21 L26 23 M46 21 L38 23" stroke="#14213d" strokeWidth="2" strokeLinecap="round" />}
      {mood === "thinking" && <path d="M36 19 Q41 17 46 19" stroke="#14213d" strokeWidth="2" fill="none" strokeLinecap="round" />}
      <Eye cx={23} mood={mood} look={look} side="l" />
      <Eye cx={41} mood={mood} look={look} side="r" />
      <path
        d={MOUTHS[mood]}
        fill={mood === "happy" || mood === "love" || mood === "excited" ? "#14213d" : mood === "surprised" ? "#14213d" : "none"}
        stroke="#14213d"
        strokeWidth={mood === "surprised" ? 0 : 2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {(mood === "happy" || mood === "excited" || mood === "love") && <path d="M27 44 Q32 47 37 44" fill="#ff8fa3" />}
      {sad && <path d="M44 30 q1.5 3 0 4.5 q-1.5 -1.5 0 -4.5" fill="#7cc4ff" className="lumi-drip" />}
      {mood === "sleepy" && <text x="47" y="15" fontSize="9" fontWeight="700" fill="#0a5f4e" className="lumi-zz">z</text>}
    </svg>
  );
}
