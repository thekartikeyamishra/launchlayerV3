// File: src/components/Assistant.tsx
// Purpose: "Ask Lumi" — a living, conversational way to use the directory.
//  - Type or speak (browser speech recognition, free) in English or Hindi.
//  - Answers come from our own cached search API: zero AI spend per question, instant,
//    and it can never invent a tool that isn't listed.
//  - Never auto-opens, never nags; respects reduced motion; Esc closes.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LumiFace, { type Mood } from "./LumiFace";
import { logEvent } from "@/lib/analytics";

type Lang = "en" | "hi";

const T = {
  en: {
    open: "Ask Lumi for an AI tool",
    hello: "Hi, I'm Lumi! Tell me a job you want AI to do — I'll find tools that do it.",
    placeholder: "e.g. summarise PDFs, Hindi voiceover…",
    send: "Ask",
    listening: "Listening…",
    mic: "Speak your question",
    nothing: "I couldn't find a listed tool for that. Want to post it so builders can make it?",
    post: "Post as a request",
    found: (n: number) => `Here ${n === 1 ? "is a tool" : `are ${n} tools`} that fit:`,
    guide: "Read the guide",
    more: "See all results",
    error: "I couldn't reach the directory just now. Please try again.",
    chips: ["Summarise PDFs", "Make a logo", "Meeting notes", "Run AI offline"],
    note: "Answers come only from LaunchLayer's reviewed listings. Voice is turned into text by your browser.",
    close: "Close",
  },
  hi: {
    open: "Lumi से AI टूल पूछें",
    hello: "नमस्ते, मैं Lumi हूँ! बताइए AI से कौन-सा काम करवाना है — मैं उसके लिए टूल ढूँढ दूँगी।",
    placeholder: "जैसे: PDF का सारांश, हिंदी आवाज़…",
    send: "पूछें",
    listening: "सुन रही हूँ…",
    mic: "बोलकर पूछें",
    nothing: "इसके लिए अभी कोई टूल सूची में नहीं है। क्या आप इसे अनुरोध के रूप में पोस्ट करना चाहेंगे?",
    post: "अनुरोध पोस्ट करें",
    found: (n: number) => `ये ${n} टूल आपके काम के हो सकते हैं:`,
    guide: "गाइड पढ़ें",
    more: "सभी नतीजे देखें",
    error: "अभी डायरेक्टरी से जुड़ नहीं पाई। कृपया फिर से कोशिश करें।",
    chips: ["PDF का सारांश", "लोगो बनाना", "मीटिंग नोट्स", "हिंदी अनुवाद"],
    note: "जवाब केवल LaunchLayer की जाँची गई सूची से आते हैं। आवाज़ को आपका ब्राउज़र टेक्स्ट में बदलता है।",
    close: "बंद करें",
  },
} as const;

interface ToolHit { slug: string; name: string; tagline: string; pricingLabel: string; launchLayerUrl: string }
interface Msg { from: "lumi" | "you"; text: string; tools?: ToolHit[]; guide?: { title: string; url: string }; postUrl?: string; query?: string }

interface SpeechRec {
  lang: string;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

function getRecognizer(): (new () => SpeechRec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const LANG_KEY = "ll.lumi.lang";

export default function Assistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [mood, setMood] = useState<Mood>("idle");
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<SpeechRec | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moodTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = T[lang];

  // A temporary expression that settles back to idle.
  const flash = useCallback((m: Mood, ms = 1400) => {
    setMood(m);
    if (moodTimer.current) clearTimeout(moodTimer.current);
    moodTimer.current = setTimeout(() => setMood("idle"), ms);
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANG_KEY);
      if (saved === "hi" || saved === "en") setLang(saved);
      else if (navigator.language?.toLowerCase().startsWith("hi")) setLang("hi");
    } catch {
      // storage unavailable — default English
    }
    setCanSpeak(getRecognizer() !== null);
  }, []);

  // Eyes follow the pointer (fine pointers only, reduced-motion respected, rAF-throttled).
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = btnRef.current?.getBoundingClientRect();
        if (!r) return;
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const d = Math.max(1, Math.hypot(dx, dy));
        setLook({ x: (dx / d) * Math.min(2.4, d / 60), y: (dy / d) * Math.min(2.4, d / 60) });
      });
      // Doze off after a minute of no movement; wake with a little surprise.
      if (idleTimer.current) clearTimeout(idleTimer.current);
      setMood((m) => (m === "sleepy" ? "surprised" : m));
      idleTimer.current = setTimeout(() => setMood((m) => (m === "idle" ? "sleepy" : m)), 60_000);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  useEffect(() => {
    if (mood === "surprised") {
      const id = setTimeout(() => setMood("idle"), 900);
      return () => clearTimeout(id);
    }
  }, [mood]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  const switchLang = (l: Lang) => {
    setLang(l);
    flash("wink");
    try {
      window.localStorage.setItem(LANG_KEY, l);
    } catch {
      // ignore
    }
  };

  const ask = useCallback(
    async (raw: string) => {
      const q = raw.trim().slice(0, 100);
      if (q.length < 2 || busy) return;
      setInput("");
      setMsgs((m) => [...m, { from: "you", text: q }]);
      setBusy(true);
      setMood("thinking");
      logEvent("hero.searched.v1", { length: q.length, source: "lumi", lang });
      try {
        const res = await fetch(`/api/v1/tools?limit=3&q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error("bad status");
        const data = (await res.json()) as { tools: ToolHit[]; relatedGuides: Array<{ title: string; url: string }>; noMatch?: { postRequestUrl: string } };
        if (data.tools.length === 0) {
          setMsgs((m) => [...m, { from: "lumi", text: T[lang].nothing, postUrl: data.noMatch?.postRequestUrl ?? `/demand/new?title=${encodeURIComponent(q)}` }]);
          flash("sad", 2200);
        } else {
          setMsgs((m) => [...m, { from: "lumi", text: T[lang].found(data.tools.length), tools: data.tools, guide: data.relatedGuides[0], query: q }]);
          flash(data.tools.length >= 3 ? "excited" : "happy", 2000);
        }
      } catch {
        setMsgs((m) => [...m, { from: "lumi", text: T[lang].error }]);
        flash("sad");
      } finally {
        setBusy(false);
      }
    },
    [busy, flash, lang],
  );

  const toggleMic = () => {
    const Rec = getRecognizer();
    if (!Rec) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new Rec();
    rec.lang = lang === "hi" ? "hi-IN" : "en-IN";
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript ?? "";
      if (text) void ask(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    setMood("surprised");
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  };

  if (pathname.startsWith("/admin")) return null;

  const toLocal = (u: string) => u.replace(/^https?:\/\/[^/]+/, "") || "/";

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 print:hidden">
      {open && (
        <div
          role="dialog"
          aria-label="Ask Lumi"
          className="anim-pop flex max-h-[min(560px,72vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-[var(--line)] bg-white shadow-[0_24px_60px_-20px_rgba(20,33,61,0.35)]"
        >
          <div className="flex items-center gap-3 border-b border-[var(--line)] bg-gradient-to-r from-[var(--trust)]/10 to-transparent px-4 py-3">
            <LumiFace mood={mood} look={look} size={40} />
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold leading-tight">Lumi</p>
              <p className="text-xs text-[var(--muted)]">{busy ? "…" : lang === "hi" ? "AI टूल गाइड" : "Your AI tool guide"}</p>
            </div>
            <div className="flex rounded-full border border-[var(--line)] p-0.5 text-xs font-semibold" role="group" aria-label="Language">
              {(["en", "hi"] as const).map((l) => (
                <button key={l} onClick={() => switchLang(l)} aria-pressed={lang === l} className={`rounded-full px-2.5 py-1 ${lang === l ? "bg-[var(--trust)] text-white" : "text-[var(--muted)]"}`}>
                  {l === "en" ? "EN" : "हिं"}
                </button>
              ))}
            </div>
            <button onClick={() => setOpen(false)} aria-label={t.close} className="press rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            <p className="max-w-[90%] rounded-2xl rounded-tl-md bg-[var(--bg)] px-3.5 py-2.5 text-sm">{t.hello}</p>
            {msgs.length === 0 && (
              <div className="flex flex-wrap gap-1.5">
                {t.chips.map((c) => (
                  <button key={c} onClick={() => void ask(c)} className="press rounded-full border border-[var(--line)] px-3 py-1 text-xs hover:border-[var(--trust)] hover:text-[var(--trust-strong)]">{c}</button>
                ))}
              </div>
            )}
            {msgs.map((m, i) =>
              m.from === "you" ? (
                <p key={i} className="anim-rise ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-[var(--trust)] px-3.5 py-2 text-sm text-white">{m.text}</p>
              ) : (
                <div key={i} className="anim-rise max-w-[95%] space-y-2 rounded-2xl rounded-tl-md bg-[var(--bg)] px-3.5 py-2.5 text-sm">
                  <p>{m.text}</p>
                  {m.tools?.map((tool) => (
                    <Link key={tool.slug} href={toLocal(tool.launchLayerUrl)} onClick={() => setOpen(false)} className="block rounded-xl border border-[var(--line)] bg-white p-2.5 hover:border-[var(--trust)]">
                      <span className="block font-semibold text-[var(--trust-strong)]">{tool.name}</span>
                      <span className="block text-xs text-[var(--muted)]">{tool.tagline}</span>
                      <span className="mt-1 inline-block rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px]">{tool.pricingLabel}</span>
                    </Link>
                  ))}
                  <div className="flex flex-wrap gap-3 text-xs font-semibold">
                    {m.guide && <Link href={toLocal(m.guide.url)} onClick={() => setOpen(false)} className="text-[var(--trust-strong)] hover:underline">{t.guide}: {m.guide.title}</Link>}
                    {m.query && <Link href={`/tools?q=${encodeURIComponent(m.query)}`} onClick={() => setOpen(false)} className="text-[var(--trust-strong)] hover:underline">{t.more} →</Link>}
                    {m.postUrl && <Link href={toLocal(m.postUrl)} onClick={() => setOpen(false)} className="rounded-lg bg-[var(--demand)] px-3 py-1.5 text-white">{t.post}</Link>}
                  </div>
                </div>
              ),
            )}
            {busy && (
              <p className="inline-flex gap-1 rounded-2xl bg-[var(--bg)] px-3.5 py-3" aria-label="Lumi is thinking">
                {[0, 1, 2].map((d) => <span key={d} className="lumi-dot h-1.5 w-1.5 rounded-full bg-[var(--muted)]" style={{ animationDelay: `${d * 150}ms` }} />)}
              </p>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); void ask(input); }} className="border-t border-[var(--line)] p-3">
            <div className="flex items-center gap-2">
              <label htmlFor="lumi-input" className="sr-only">{t.placeholder}</label>
              <input
                id="lumi-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setMood((m) => (m === "idle" || m === "sleepy" ? "happy" : m))}
                onBlur={() => setMood((m) => (m === "happy" ? "idle" : m))}
                placeholder={listening ? t.listening : t.placeholder}
                maxLength={100}
                lang={lang}
                className="min-w-0 flex-1 rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm focus:border-[var(--trust)] focus:outline-none focus:ring-2 focus:ring-[var(--trust)]/20"
              />
              {canSpeak && (
                <button type="button" onClick={toggleMic} aria-label={t.mic} aria-pressed={listening} className={`press grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${listening ? "lumi-pulse border-[var(--demand)] bg-[var(--demand)] text-white" : "border-[var(--line)] text-[var(--ink)] hover:border-[var(--trust)]"}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
                </button>
              )}
              <button type="submit" disabled={busy || input.trim().length < 2} className="press h-10 shrink-0 rounded-xl bg-[var(--trust)] px-4 text-sm font-semibold text-white hover:bg-[var(--trust-strong)] disabled:opacity-50">{t.send}</button>
            </div>
            <p className="mt-2 text-[10px] leading-snug text-[var(--muted)]">{t.note}</p>
          </form>
        </div>
      )}

      <button
        ref={btnRef}
        onClick={() => {
          setOpen((o) => !o);
          flash(open ? "wink" : "excited", 1100);
        }}
        onMouseEnter={() => setMood((m) => (m === "idle" || m === "sleepy" ? "happy" : m))}
        onMouseLeave={() => setMood((m) => (m === "happy" ? "idle" : m))}
        onDoubleClick={() => flash("love", 1800)}
        aria-label={t.open}
        aria-expanded={open}
        className="press group relative grid h-16 w-16 place-items-center rounded-full bg-white shadow-[0_10px_30px_-10px_rgba(14,124,102,0.6)] ring-1 ring-[var(--line)] transition-transform hover:-translate-y-0.5"
      >
        <LumiFace mood={mood} look={look} size={52} />
        {!open && (
          <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-full bg-[var(--ink)] px-3 py-1.5 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 sm:block">
            {lang === "hi" ? "AI टूल पूछें" : "Ask Lumi"}
          </span>
        )}
      </button>
    </div>
  );
}
