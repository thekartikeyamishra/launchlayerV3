// File: src/app/ads.txt/route.ts
// Purpose: Authorised Digital Sellers file for AdSense, generated from NEXT_PUBLIC_ADSENSE_CLIENT
// ("ca-pub-XXXXXXXXXXXXXXXX"). Missing ads.txt is a common cause of reduced ad earnings.
export const dynamic = "force-static";

export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";
  const pub = client.replace(/^ca-/, "");
  const body = pub.startsWith("pub-")
    ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`
    : "# ads.txt — set NEXT_PUBLIC_ADSENSE_CLIENT to publish your AdSense seller line.\n";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" } });
}
