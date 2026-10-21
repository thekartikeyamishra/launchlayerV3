// File: src/app/layout.tsx
// Purpose: Root layout — fonts, metadata, PWA wiring, auth provider, header/footer, GA4.
// Note: suppressHydrationWarning on <html> only — browser extensions inject attributes
// (e.g. data-scribe-recorder-ready) before React hydrates; React must ignore that noise.

import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SITE_URL } from "@/lib/site";
import AdsenseLoader from "@/components/AdsenseLoader";
import AssistantLoader from "@/components/AssistantLoader";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import Analytics from "@/components/Analytics";
import ConsentBanner from "@/components/ConsentBanner";

// Self-hosted variable fonts: no runtime request to Google Fonts (faster LCP, no third-party dependency).
const body = localFont({ src: "../fonts/inter-latin-wght-normal.woff2", variable: "--font-body", display: "swap", weight: "100 900" });
const display = localFont({ src: "../fonts/space-grotesk-latin-wght-normal.woff2", variable: "--font-display", display: "swap", weight: "300 700" });

const ADSENSE = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const GSC = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const BING = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;

export const metadata: Metadata = {
  title: {
    default: "LaunchLayer — Find the right AI tool for any task",
    template: "%s · LaunchLayer",
  },
  description:
    "An honest AI tools directory: task-based search, real-use reviews, free listings, and clearly-labelled ads. Can't find an AI for your task? Post it and builders respond.",
  applicationName: "LaunchLayer",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  keywords: ["AI tools directory", "best AI tools", "AI tools for", "AI tool finder", "AI alternatives", "AI tools India"],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LaunchLayer",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: "LaunchLayer — Find the right AI tool for any task",
    description: "Task-based AI tool search with real-use reviews. No pay-to-rank, no login walls.",
    type: "website",
    siteName: "LaunchLayer",
    url: SITE_URL,
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", site: "@kartikeyahere" },
  robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  verification: {
    ...(GSC ? { google: GSC } : {}),
    ...(BING ? { other: { "msvalidate.01": BING } } : {}),
  },
  other: ADSENSE ? { "google-adsense-account": ADSENSE } : {},
};

export const viewport: Viewport = {
  themeColor: "#0e7c66",
  width: "device-width",
  initialScale: 1,
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "LaunchLayer",
      url: SITE_URL,
      logo: `${SITE_URL}/icons/icon-512.png`,
      description:
        "An independent AI tools directory with task-based search, real-use reviews and a public board of demand for AI solutions.",
      sameAs: [
        "https://www.linkedin.com/in/thekartikeyamishra",
        "https://github.com/thekartikeyamishra",
        "https://x.com/kartikeyahere",
      ],
    },
    {
      "@type": "WebSite",
      name: "LaunchLayer",
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/tools?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow">
          Skip to content
        </a>
        <AuthProvider>
          <Header />
          <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
          <Footer />
          <AssistantLoader />
        </AuthProvider>
        <ServiceWorkerRegister />
        <Analytics />
        <ConsentBanner />
        <AdsenseLoader />
      </body>
    </html>
  );
}
