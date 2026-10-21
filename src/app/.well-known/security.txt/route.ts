// File: src/app/.well-known/security.txt/route.ts
// Purpose: RFC 9116 security contact, so researchers report vulnerabilities to you, privately.
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const expires = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
  const body = `Contact: mailto:${CONTACT_EMAIL}
Expires: ${expires}
Preferred-Languages: en, hi
Canonical: ${SITE_URL}/.well-known/security.txt
Policy: ${SITE_URL}/legal/terms
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
