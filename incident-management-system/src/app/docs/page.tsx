import Link from "next/link";
import { ArrowLeft, Terminal, LayoutList, ShieldAlert, Cpu, Copy, Command } from "lucide-react";

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
          <Link href="/" className="text-xs font-medium text-zinc-500 hover:text-white flex items-center gap-2 border border-white/[0.06] rounded-full px-4 py-2 hover:bg-white/5 transition-all">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
        </div>
      </nav>

      {/* HEADER */}
      <div className="relative z-10 pt-32 pb-16 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start gap-6 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
               <Terminal className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">SDK Reference</h1>
              <p className="text-lg text-zinc-500 max-w-2xl font-medium leading-relaxed">
                Integrate DevNexus incident tracking into your engineering stack.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-16 space-y-16 relative z-10">
        
        {/* INSTALLATION */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <Cpu className="text-white w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Installation</h2>
          </div>
          
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 space-y-6">
            <p className="text-zinc-500 leading-relaxed text-sm">The SDK is optimized for modern JavaScript environments, including Node.js, Next.js, and Edge Runtimes.</p>
            
            <div className="bg-[#111113] rounded-xl border border-white/[0.06] p-5 font-mono text-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-medium">Bash</span>
                <Copy className="w-4 h-4 text-zinc-700 hover:text-white cursor-pointer transition-colors" />
              </div>
              <div className="text-zinc-500 italic text-xs"># Install core SDK</div>
              <div className="mt-1 text-zinc-300">npm install <span className="text-white">@devnexus/sdk</span></div>
            </div>
          </div>
        </section>

        {/* INGEST API */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <LayoutList className="text-white w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Ingest API</h2>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
            <div className="mb-8 pb-8 border-b border-white/[0.04]">
              <div className="flex items-center gap-4 mb-4">
                 <span className="bg-white/10 text-white font-semibold px-3 py-1 rounded-lg border border-white/20 text-xs uppercase tracking-wider">POST</span>
                 <span className="font-mono text-base text-zinc-300">/api/ingest</span>
              </div>
              <p className="text-zinc-500 text-sm">Secure your requests by including your project token in the Authorization header.</p>
              <div className="mt-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.04] font-mono text-xs text-zinc-500">
                Authorization: Bearer [SDK_API_KEY]
              </div>
            </div>

            <h3 className="text-base font-bold mb-4 text-zinc-300">Payload Schema</h3>
            <div className="bg-[#111113] rounded-xl border border-white/[0.06] p-6 font-mono text-sm relative">
              <div className="absolute top-4 right-4 text-[10px] font-medium uppercase tracking-widest text-zinc-700">JSON</div>
              <pre className="text-zinc-400 leading-relaxed overflow-x-auto">
{`{
  // Required
  "message": `}<span className="text-zinc-300">&quot;Error details or incident description&quot;</span>{`,
  
  // Optional Context
  "stack": `}<span className="text-zinc-300">&quot;Full stack trace string&quot;</span>{`,
  "tags": {
    "component": `}<span className="text-zinc-300">&quot;cart&quot;</span>{`,
    "environment": `}<span className="text-zinc-300">&quot;production&quot;</span>{`
  },
  "metadata": {
    "userId": `}<span className="text-zinc-300">&quot;user_9210&quot;</span>{`
  }
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* ARCHITECTURE */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <ShieldAlert className="text-white w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Limits &amp; Reliability</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { 
                title: "Rate Limiting", 
                desc: "Endpoints allow up to 30 requests per minute per SDK Key. Overages return a 429 status.",
                num: "01"
              },
              { 
                title: "AI Analysis", 
                desc: "Incident payloads trigger an asynchronous Gemini queue for root cause identification.",
                num: "02"
              },
              { 
                title: "Data Integrity", 
                desc: "Payloads exceeding 256KB are truncated to ensure high performance ingestion.",
                num: "03"
              }
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] group hover:bg-white/[0.04] transition-all">
                <div className="text-3xl font-extrabold text-white/[0.04] mb-4 group-hover:text-white/10 transition-colors">{item.num}</div>
                <h3 className="text-base font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
