import Link from "next/link";
import {
  ArrowLeft,
  Terminal,
  LayoutList,
  ShieldAlert,
  Cpu,
  Copy,
  Command,
  Code,
  BookOpen,
  Layers,
} from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/10 pb-24 font-sans">
      {/* Subtle grid */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#1a1a1e_1px,transparent_1px)] [background-size:32px_32px] opacity-30" />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-[100] border-b border-white/[0.06] bg-black/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
              <Command className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold text-lg tracking-tight">DevNexus</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-medium text-zinc-500 hover:text-white flex items-center gap-2 border border-white/[0.06] rounded-full px-4 py-2 hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
        </div>
      </nav>

      {/* HEADER */}
      <div className="relative z-10 pt-32 pb-16 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start gap-6 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                Documentation
              </h1>
              <p className="text-lg text-zinc-400 max-w-2xl font-medium leading-relaxed">
                Everything you need to integrate DevNexus into your stack.
                Explore the SDK, APIs, and best practices for resilient incident
                tracking.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-16 space-y-24 relative z-10">
        {/* INSTALLATION */}
        <section className="space-y-8 relative">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center shadow-lg">
              <Cpu className="text-white w-6 h-6" />
            </div>
            <h2 className="text-3xl font-black tracking-tight">
              1. Installation
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10 backdrop-blur-md shadow-2xl">
            <p className="text-zinc-400 leading-relaxed text-base mb-6 font-medium">
              The SDK is optimized for modern JavaScript environments, including
              Node.js, Next.js, React, and Edge Runtimes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-black/50 rounded-2xl border border-white/10 p-6 font-mono text-sm relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform" />
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">
                    npm
                  </span>
                  <Copy className="w-4 h-4 text-zinc-600 hover:text-white cursor-pointer transition-colors" />
                </div>
                <div className="text-zinc-300">
                  npm install{" "}
                  <span className="text-white font-bold">@devnexus/sdk</span>
                </div>
              </div>

              <div className="bg-black/50 rounded-2xl border border-white/10 p-6 font-mono text-sm relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform" />
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">
                    yarn
                  </span>
                  <Copy className="w-4 h-4 text-zinc-600 hover:text-white cursor-pointer transition-colors" />
                </div>
                <div className="text-zinc-300">
                  yarn add{" "}
                  <span className="text-white font-bold">@devnexus/sdk</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INITIALIZATION */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center shadow-lg">
              <Terminal className="text-white w-6 h-6" />
            </div>
            <h2 className="text-3xl font-black tracking-tight">
              2. Initialization
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10 backdrop-blur-md shadow-2xl">
            <p className="text-zinc-400 text-base mb-6 font-medium">
              Initialize DevNexus as early as possible in your
              application&apos;s lifecycle.
            </p>

            <div className="bg-black/60 rounded-2xl border border-white/10 overflow-hidden">
              <div className="flex items-center px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                <div className="flex gap-2 mr-4">
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                </div>
                <span className="text-xs text-zinc-500 font-mono">
                  index.ts
                </span>
              </div>
              <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto whitespace-pre">
                <span className="text-purple-400">import</span> {"{ "}{" "}
                <span className="text-yellow-200">DevNexus</span> {" } "}{" "}
                <span className="text-purple-400">from</span>{" "}
                <span className="text-green-400">
                  &apos;@devnexus/sdk&apos;
                </span>
                ;
                <span className="text-zinc-500">
                  {"// Initialize with your project API key"}
                </span>
                <span className="text-yellow-200">DevNexus</span>.
                <span className="text-blue-400">init</span>({"{"}
                <span className="text-zinc-300">apiKey</span>:{" "}
                <span className="text-green-400">
                  &apos;dn_live_xxxxxxxxxxxxxxxx&apos;
                </span>
                ,<span className="text-zinc-300">environment</span>:{" "}
                <span className="text-green-400">&apos;production&apos;</span>,
                <span className="text-zinc-300">autoCaptureUncaught</span>:{" "}
                <span className="text-orange-400">true</span>
                {"});"}
              </div>
            </div>
          </div>
        </section>

        {/* USAGE */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center shadow-lg">
              <Code className="text-white w-6 h-6" />
            </div>
            <h2 className="text-3xl font-black tracking-tight">
              3. Capturing Errors
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-md shadow-xl hover:bg-white/[0.04] transition-colors">
              <h3 className="text-xl font-bold mb-4">Manual Capture</h3>
              <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                Wrap your risky code in a try-catch block and send the error
                manually.
              </p>
              <div className="bg-black/60 rounded-xl border border-white/10 p-5 font-mono text-xs overflow-x-auto whitespace-pre">
                <span className="text-purple-400">try</span> {"{"}
                <span className="text-blue-400">processPayment</span>();
                {"} "} <span className="text-purple-400">catch</span> (error){" "}
                {"{"}
                <span className="text-yellow-200">DevNexus</span>.
                <span className="text-blue-400">captureException</span>(error,{" "}
                {"{"}
                tags: {"{ "} component:{" "}
                <span className="text-green-400">&apos;checkout&apos;</span>{" "}
                {" }"}
                {"});"}
                {"}"}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-md shadow-xl hover:bg-white/[0.04] transition-colors">
              <h3 className="text-xl font-bold mb-4">Identify Users</h3>
              <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                Attach user context to errors to know exactly who is affected by
                an incident.
              </p>
              <div className="bg-black/60 rounded-xl border border-white/10 p-5 font-mono text-xs overflow-x-auto whitespace-pre">
                <span className="text-zinc-500">
                  {"// Set context on login"}
                </span>
                <span className="text-yellow-200">DevNexus</span>.
                <span className="text-blue-400">setUser</span>({"{"}
                id: <span className="text-green-400">&apos;user_123&apos;</span>
                , email:{" "}
                <span className="text-green-400">
                  &apos;jane@example.com&apos;
                </span>
                , plan:{" "}
                <span className="text-green-400">&apos;enterprise&apos;</span>
                {"});"}
              </div>
            </div>
          </div>
        </section>

        {/* INGEST API */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center shadow-lg">
              <LayoutList className="text-white w-6 h-6" />
            </div>
            <h2 className="text-3xl font-black tracking-tight">4. REST API</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10 backdrop-blur-md shadow-2xl">
            <div className="mb-8 pb-8 border-b border-white/10">
              <div className="flex items-center gap-4 mb-4">
                <span className="bg-white text-black font-black px-4 py-1.5 rounded-lg text-xs uppercase tracking-widest shadow-lg">
                  POST
                </span>
                <span className="font-mono text-lg text-white font-semibold">
                  /api/ingest
                </span>
              </div>
              <p className="text-zinc-400 text-base">
                Secure your requests by including your project token in the
                Authorization header.
              </p>
              <div className="mt-6 p-4 rounded-xl bg-black/50 border border-white/10 font-mono text-sm text-zinc-400 shadow-inner flex items-center justify-between group">
                <span>Authorization: Bearer [SDK_API_KEY]</span>
                <Copy className="w-4 h-4 opacity-50 group-hover:opacity-100 cursor-pointer" />
              </div>
            </div>

            <h3 className="text-lg font-bold mb-4 text-white">
              Payload Schema
            </h3>
            <div className="bg-black/60 rounded-2xl border border-white/10 p-8 font-mono text-sm relative shadow-inner">
              <div className="absolute top-5 right-5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-white/5 px-2 py-1 rounded">
                JSON
              </div>
              <pre className="text-zinc-400 leading-relaxed overflow-x-auto">
                {`{
  // Required
  "message": `}
                <span className="text-green-400">
                  &quot;Database connection timeout&quot;
                </span>
                {`,
  
  // Optional Context
  "stack": `}
                <span className="text-green-400">
                  &quot;Error: timeout at ...&quot;
                </span>
                {`,
  "tags": {
    "component": `}
                <span className="text-green-400">&quot;database&quot;</span>
                {`,
    "environment": `}
                <span className="text-green-400">&quot;production&quot;</span>
                {`
  },
  "metadata": {
    "query": `}
                <span className="text-green-400">
                  &quot;SELECT * FROM users&quot;
                </span>
                {`
  }
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* ARCHITECTURE */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center shadow-lg">
              <Layers className="text-white w-6 h-6" />
            </div>
            <h2 className="text-3xl font-black tracking-tight">
              5. Architecture & Limits
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Rate Limiting",
                desc: "Endpoints allow up to 30 requests per minute per SDK Key. Overages return a 429 status. Batch processing is recommended for high traffic.",
                num: "01",
                icon: ShieldAlert,
              },
              {
                title: "AI Analysis",
                desc: "Incident payloads trigger an asynchronous Gemini queue for root cause identification. Complex stack traces may take up to 2 seconds to process.",
                num: "02",
                icon: Cpu,
              },
              {
                title: "Data Integrity",
                desc: "Payloads exceeding 256KB are truncated to ensure high performance ingestion. Always ensure log rotation for extreme trace lengths.",
                num: "03",
                icon: LayoutList,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-8 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent group hover:from-white/[0.05] hover:to-white/[0.01] transition-all shadow-xl relative overflow-hidden"
              >
                <item.icon className="w-8 h-8 text-white/20 mb-6 group-hover:text-white/60 transition-colors" />
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                  {item.desc}
                </p>
                <div className="absolute -bottom-6 -right-6 text-8xl font-black text-white/[0.02] group-hover:text-white/[0.05] transition-colors rotate-12">
                  {item.num}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER CTA */}
        <section className="py-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">Still have questions?</h3>
            <p className="text-zinc-400">
              Join our Discord community or reach out to enterprise support.
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/auth/register"
              className="px-6 py-3 rounded-full bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
