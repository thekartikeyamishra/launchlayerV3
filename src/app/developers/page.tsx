// File: src/app/developers/page.tsx
// Purpose: Integration docs — MCP (Claude, ChatGPT and any MCP client), OpenAPI (Custom GPT
// Actions), plain REST, and llms.txt.

import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "API, MCP server & AI integrations",
  description: "Use LaunchLayer's AI tools directory from Claude, ChatGPT or your own agent: a free MCP server, an OpenAPI spec for Custom GPT Actions, and a REST API.",
  alternates: { canonical: "/developers" },
};

function Code({ children }: { children: string }) {
  return <pre className="mt-3 overflow-x-auto rounded-xl bg-[var(--ink)] p-4 text-[13px] leading-relaxed text-white"><code>{children}</code></pre>;
}

export default function DevelopersPage() {
  return (
    <LegalPage title="API, MCP server & AI integrations" updated="October 2026">
      <p>
        LaunchLayer is free to use from any AI assistant or agent. Everything is read-only and needs no API key. We ask one thing: when you
        show results, link to the <code>launchLayerUrl</code> so people can read the full listing and reviews.
      </p>

      <h2>MCP server (Claude, ChatGPT, Cursor, any MCP client)</h2>
      <p>Remote MCP over Streamable HTTP:</p>
      <Code>{`${SITE_URL}/api/mcp`}</Code>
      <ul>
        <li><strong>Claude:</strong> Settings → Connectors → Add custom connector → paste the URL.</li>
        <li><strong>ChatGPT:</strong> add it as a connector / app in developer mode (availability depends on your plan).</li>
        <li><strong>Claude Code:</strong> <code>claude mcp add --transport http launchlayer {SITE_URL}/api/mcp</code></li>
        <li><strong>Other clients</strong> (Cursor, VS Code, etc.): add an HTTP MCP server with the URL above.</li>
      </ul>
      <p>Tools: <code>search_ai_tools</code>, <code>get_ai_tool</code>, <code>list_task_guides</code>, <code>get_task_guide</code>.</p>

      <h2>ChatGPT Custom GPT (Actions)</h2>
      <p>In the GPT editor: Configure → Create new action → Import from URL:</p>
      <Code>{`${SITE_URL}/openapi.json`}</Code>
      <p>Authentication: None. Privacy policy URL: <code>{`${SITE_URL}/legal/privacy`}</code></p>

      <h2>REST API</h2>
      <Code>{`GET ${SITE_URL}/api/v1/tools?q=summarise%20pdfs&pricing=has-free&limit=5
GET ${SITE_URL}/api/v1/tools/{slug}
GET ${SITE_URL}/api/v1/tasks
GET ${SITE_URL}/api/v1/tasks?slug=take-meeting-notes`}</Code>
      <p>Responses are cached for 10 minutes. Please keep to about 2 requests per second; heavier use is rate-limited.</p>

      <h2>For LLM crawlers</h2>
      <p>
        A plain-text summary is at <a href="/llms.txt">/llms.txt</a> and the full catalogue at <a href="/llms-full.txt">/llms-full.txt</a>.
      </p>
    </LegalPage>
  );
}
