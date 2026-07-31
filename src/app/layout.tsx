// File: src/app/layout.tsx
// Purpose: Root layout — fonts, metadata, PWA wiring, auth provider, header/footer, GA4.
// Note: suppressHydrationWarning on <html> only — browser extensions inject attributes
// (e.g. data-scribe-recorder-ready) before React hydrates; React must ignore that noise.

import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "LaunchLayer — Real demand for AI solutions",
    template: "%s · LaunchLayer",
  },
  description:
    "LaunchLayer is the trust layer for the AI economy. Post what you need, vote on real demand, and build AI solutions people are actually asking for.",
  metadataBase: new URL("https://launchlayer.me"),
  manifest: "/manifest.webmanifest",
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
    title: "LaunchLayer — Real demand for AI solutions",
    description: "Post what you need. Build what's wanted. Every signal is real.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e7c66",
  width: "device-width",
  initialScale: 1,
};

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col antialiased">
        {gaId ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', { anonymize_ip: true });`}
            </Script>
          </>
        ) : null}
        <AuthProvider>
          <Header />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
          <Footer />
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
