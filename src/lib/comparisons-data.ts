// File: src/lib/comparisons-data.ts
// Purpose: Editor-written head-to-head comparisons ("X vs Y") — high-intent search pages.
// Policy: every pair has original guidance on *who should pick which*. No auto-generated
// pairs (thin content). Keep claims qualitative and consistent with the tool listings.

export interface Comparison {
  a: string;
  b: string;
  intro: string;
  chooseA: string[];
  chooseB: string[];
  verdict: string;
}

export const COMPARISONS: Comparison[] = [
  {
    a: "chatgpt", b: "claude",
    intro: "Both are top general assistants that write, analyse files and code. The practical differences are in breadth of features, how they handle long documents, and how their writing reads.",
    chooseA: ["You want one app for chat, voice conversations and image generation", "You rely on custom GPTs or its large integration ecosystem", "You want strong voice mode on your phone"],
    chooseB: ["You work with long documents, contracts or whole codebases", "You want natural, less formulaic writing", "You do a lot of coding or structured analysis"],
    verdict: "Try both free plans on a real task from your week. Most people who mainly write or work with long files lean towards Claude; people who want the widest feature set in one app lean towards ChatGPT.",
  },
  {
    a: "chatgpt", b: "gemini",
    intro: "ChatGPT is the broadest standalone assistant; Gemini's advantage is how deeply it plugs into Google's apps and Android.",
    chooseA: ["You want the widest range of built-in features", "You use custom GPTs or many third-party integrations"],
    chooseB: ["Your work lives in Gmail, Docs and Drive", "You use an Android phone and want the assistant built in", "You want a generous free tier for quick lookups"],
    verdict: "If you are a Google Workspace user, Gemini usually saves more clicks. Otherwise ChatGPT's breadth makes it the safer default.",
  },
  {
    a: "claude", b: "gemini",
    intro: "Claude is strong on long-document work, writing and coding; Gemini is strongest when connected to your Google account and apps.",
    chooseA: ["You need careful reading of long documents", "Writing quality and tone matter", "You use AI for coding"],
    chooseB: ["You want answers grounded in your Gmail, Docs and Drive", "You prefer a generous free tier", "You are on Android"],
    verdict: "Pick by where your work happens: inside Google's apps, Gemini; long documents, writing and code, Claude.",
  },
  {
    a: "perplexity", b: "chatgpt",
    intro: "Perplexity is built around search with citations; ChatGPT is a general assistant that can also search the web.",
    chooseA: ["You mainly ask research and current-events questions", "You want numbered citations on every answer to check sources", "You want a search-engine replacement"],
    chooseB: ["You want drafting, analysis and brainstorming more than lookups", "You need image generation or voice in the same app"],
    verdict: "Use Perplexity when the source matters as much as the answer. Use ChatGPT when you need help making something.",
  },
  {
    a: "notebooklm", b: "perplexity",
    intro: "Both cite sources, but from different places: NotebookLM answers only from documents you upload, while Perplexity searches the open web.",
    chooseA: ["You're studying or working from your own PDFs, notes or videos", "You want answers that never stray outside your sources", "You like audio overviews for learning"],
    chooseB: ["You need current information from the web", "You don't have the sources yet"],
    verdict: "They complement each other: find sources with Perplexity, then study them in NotebookLM.",
  },
  {
    a: "cursor", b: "github-copilot",
    intro: "Copilot adds AI to the editor you already use; Cursor is a whole editor rebuilt around AI.",
    chooseA: ["You want deep, codebase-wide edits and an agent inside the editor", "You're happy to switch editors (it keeps VS Code extensions)"],
    chooseB: ["You want to stay in VS Code, JetBrains or Visual Studio", "Your company already standardises on GitHub", "You want a free tier for individuals"],
    verdict: "Start with Copilot if switching editors is a hassle for your team; try Cursor if you want the AI to take on bigger, multi-file changes.",
  },
  {
    a: "ollama", b: "lm-studio",
    intro: "Both run open models privately on your own computer. Ollama is command-line first for developers; LM Studio is a desktop app anyone can use.",
    chooseA: ["You're a developer who wants a simple local API", "You script or automate model use", "You run models on a server"],
    chooseB: ["You prefer a visual app to browse and chat with models", "You don't want to use the command line"],
    verdict: "Developers usually pick Ollama; everyone else will find LM Studio easier to start with. Both are free.",
  },
  {
    a: "midjourney", b: "ideogram",
    intro: "Midjourney is known for polished, artistic images; Ideogram for getting readable text into images.",
    chooseA: ["Aesthetic quality matters most", "You're making concept art, mood boards or stylised visuals"],
    chooseB: ["Your image needs words — posters, thumbnails, logos", "You want a free tier to experiment"],
    verdict: "For images with text, Ideogram. For pure visual quality and style, Midjourney.",
  },
  {
    a: "otter-ai", b: "fireflies-ai",
    intro: "Both record and summarise meetings. Otter is strongest at live transcription; Fireflies at pushing notes into your other tools.",
    chooseA: ["You want a live transcript during the call", "You mainly need searchable meeting history"],
    chooseB: ["You want notes sent to your CRM and project tools automatically", "Your team is in sales or customer success"],
    verdict: "Individuals and note-takers lean Otter; sales and customer teams usually get more from Fireflies' integrations.",
  },
  {
    a: "elevenlabs", b: "murf-ai",
    intro: "Both generate natural voiceovers. ElevenLabs leads on realism and developer tools; Murf on fine timing controls for narration.",
    chooseA: ["You want the most natural-sounding voices", "You're building a voice app with an API", "You need dubbing"],
    chooseB: ["You produce e-learning or presentation narration", "You want precise control over pauses, pitch and emphasis"],
    verdict: "ElevenLabs for realism and building products; Murf for structured narration work.",
  },
  {
    a: "zapier", b: "make",
    intro: "Both connect your apps and add AI steps. Zapier is easier; Make is more powerful and often cheaper at volume.",
    chooseA: ["You want the simplest setup and the most app connectors", "Your team is non-technical"],
    chooseB: ["Your workflows branch, loop or transform data", "You run high volumes and watch cost per operation"],
    verdict: "Start on Zapier for simple automations; move complex or high-volume flows to Make.",
  },
  {
    a: "lovable", b: "bolt-new",
    intro: "Both build working web apps from a prompt. Lovable focuses on polished UI and GitHub sync; Bolt on instant, in-browser full-stack previews.",
    chooseA: ["You care about a polished interface out of the box", "You want your code synced to GitHub"],
    chooseB: ["You want to see a running full-stack app instantly", "You iterate quickly on prototypes"],
    verdict: "Both are excellent for prototypes; try the same prompt in each and keep the one whose output you'd rather maintain.",
  },
  {
    a: "grammarly", b: "quillbot",
    intro: "Grammarly is a writing checker that follows you across apps; QuillBot is a paraphrasing and summarising toolkit.",
    chooseA: ["You want corrections everywhere you type", "You write professional emails and documents"],
    chooseB: ["You need to rephrase or summarise text", "You're a student working with sources"],
    verdict: "Grammarly for correct everyday writing; QuillBot for rephrasing and summarising — and always cite your sources.",
  },
  {
    a: "runway", b: "pika",
    intro: "Both generate video. Runway is a full creative toolkit for higher-end work; Pika is quicker and more playful for social clips.",
    chooseA: ["You want high-quality generation plus editing tools", "You make ads, music videos or films"],
    chooseB: ["You want fun effects for social media", "You want something quick and simple"],
    verdict: "Runway for serious creative projects; Pika for fast, fun social content.",
  },
  {
    a: "google-translate", b: "deepl",
    intro: "Google Translate covers far more languages; DeepL is known for natural-sounding translations in the languages it supports.",
    chooseA: ["You need Indian or less common languages", "You want camera or conversation translation on your phone"],
    chooseB: ["You translate business documents between major European and Asian languages", "You want formatting preserved in documents"],
    verdict: "For Indian languages, Google Translate (or Bhashini); for polished business documents in supported languages, DeepL.",
  },
];

export const pairSlug = (c: Comparison) => `${c.a}-vs-${c.b}`;

export function getComparison(slug: string): Comparison | null {
  return COMPARISONS.find((c) => pairSlug(c) === slug) ?? null;
}

export function comparisonsFor(toolSlug: string): Comparison[] {
  return COMPARISONS.filter((c) => c.a === toolSlug || c.b === toolSlug);
}
