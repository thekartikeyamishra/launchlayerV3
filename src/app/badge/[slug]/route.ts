// File: src/app/badge/[slug]/route.ts
// Purpose: "Listed on LaunchLayer" SVG badge makers embed on their sites. Each embed links back
// to the tool page — an organic backlink and referral channel at zero acquisition cost.

import { getAllTools } from "@/lib/directory";

export const revalidate = 86400;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = (await getAllTools()).find((t) => t.slug === slug.replace(/\.svg$/, ""));
  const dark = new URL(req.url).searchParams.get("theme") === "dark";
  const bg = dark ? "#14213d" : "#ffffff";
  const fg = dark ? "#ffffff" : "#14213d";
  const sub = dark ? "#9fb0c8" : "#5b6b85";
  const border = dark ? "#14213d" : "#e2e7ef";
  const label = tool ? esc(tool.name.length > 24 ? `${tool.name.slice(0, 23)}…` : tool.name) : "AI tools directory";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="54" viewBox="0 0 220 54" role="img" aria-label="Listed on LaunchLayer">
<title>Listed on LaunchLayer</title>
<rect x="0.5" y="0.5" width="219" height="53" rx="11" fill="${bg}" stroke="${border}"/>
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0e7c66"/><stop offset="1" stop-color="#0b8bb0"/></linearGradient></defs>
<rect x="11" y="11" width="32" height="32" rx="8" fill="url(#g)"/>
<text x="27" y="33" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="17" font-weight="700" fill="#fff">L</text>
<text x="54" y="23" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="10" font-weight="600" letter-spacing=".06em" fill="${sub}">LISTED ON LAUNCHLAYER</text>
<text x="54" y="40" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="14" font-weight="700" fill="${fg}">${label}</text>
</svg>`;
  return new Response(svg, {
    status: tool ? 200 : 404,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
