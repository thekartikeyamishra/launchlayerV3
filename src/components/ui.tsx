// File: src/components/ui.tsx
// Purpose: Core UI primitives following the design tokens (Ch. 19).
// Accessibility: visible focus, labeled controls, WCAG AA contrast.

"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--trust)] disabled:cursor-not-allowed disabled:opacity-50";
  const variants = {
    primary: "bg-[var(--trust)] text-white hover:bg-[var(--trust-strong)]",
    secondary: "border border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--trust)]",
    ghost: "text-[var(--muted)] hover:text-[var(--ink)]",
    danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function LinkButton({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--trust)]";
  const variants = {
    primary: "bg-[var(--trust)] text-white hover:bg-[var(--trust-strong)]",
    secondary: "border border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--trust)]",
  };
  return (
    <Link href={href} className={`${base} ${variants[variant]}`}>
      {children}
    </Link>
  );
}

export function Field({ label, error, hint, children, htmlFor }: { label: string; error?: string; hint?: string; children: ReactNode; htmlFor: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-[var(--ink)]">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-[var(--muted)]">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--trust)] focus:outline-none focus:ring-2 focus:ring-[var(--trust)]/20";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputClass} {...props} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${inputClass} min-h-28`} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={inputClass} {...props} />;
}

export function VerifiedBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-[var(--trust)]/30 bg-[var(--trust)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--trust-strong)]"
      title="Verified Creator: identity reviewed by LaunchLayer"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2l2.4 2.4 3.4-.5.5 3.4L21 9.6 19.7 12 21 14.4l-2.7 2.3-.5 3.4-3.4-.5L12 22l-2.4-2.4-3.4.5-.5-3.4L3 14.4 4.3 12 3 9.6l2.7-2.3.5-3.4 3.4.5L12 2z" fill="currentColor" opacity="0.2" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Verified Creator
    </span>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "demand" | "trust" }) {
  const tones = {
    neutral: "border-[var(--line)] bg-white text-[var(--muted)]",
    demand: "border-[var(--demand)]/30 bg-[var(--demand)]/10 text-[var(--demand)]",
    trust: "border-[var(--trust)]/30 bg-[var(--trust)]/10 text-[var(--trust-strong)]",
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--line)] bg-white p-10 text-center">
      <h3 className="font-display text-lg font-semibold text-[var(--ink)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[var(--line)]/60 ${className}`} aria-hidden="true" />;
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {message}
    </div>
  );
}
