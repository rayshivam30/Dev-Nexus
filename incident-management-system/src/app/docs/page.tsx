import Link from "next/link";
import { ArrowLeft, Terminal, LayoutList, ShieldAlert, Cpu } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#F0F0F0] text-black font-mono selection:bg-black selection:text-white pb-24">
      {/* Brutalist Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
      
      {/* HEADER */}
      <div className="bg-black text-white pt-24 pb-16 relative z-10 border-b-8 border-black shadow-[0_8px_0_0_rgba(0,0,0,1)]">
        <div className="max-w-5xl mx-auto px-6">
          <Link href="/" className="inline-flex items-center space-x-2 text-[#FFD700] hover:text-white transition-colors mb-12 font-black uppercase text-sm group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>RETURN_TO_NEXUS</span>
          </Link>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-[#FF00FF] border-2 border-white shadow-[4px_4px_0_0_white] transform -rotate-3">
               <Terminal className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">SDK_REFERENCE</h1>
          </div>
          <p className="text-xl md:text-2xl text-white/80 max-w-2xl font-bold uppercase tracking-widest border-l-4 border-[#00D1FF] pl-4">
             Integrate DevNexus Incident tracking directly into your React, Node, or Edge environments.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-16 space-y-16 relative z-10">
        
        {/* INSTALLATION */}
        <section className="bg-white p-8 md:p-12 border-4 border-black shadow-[8px_8px_0_0_black]">
          <h2 className="text-3xl font-black uppercase mb-6 flex items-center gap-3">
             <Cpu className="text-[#00D1FF] w-8 h-8" />
             Core Installation
          </h2>
          <p className="font-bold opacity-80 mb-6">Currently the SDK is available locally or via the root ingest protocol. To push an event via standard fetch, use the endpoint mapping.</p>
          
          <div className="bg-black text-[#FFD700] p-6 border-2 border-black font-mono text-sm overflow-x-auto selection:bg-[#FF00FF] selection:text-white shadow-inner">
            <code className="text-green-400"># Next.js / Node Environment</code><br/>
            <code>npm install @devnexus/sdk</code>
          </div>
        </section>

        {/* INGEST API */}
        <section className="bg-white p-8 md:p-12 border-4 border-black shadow-[8px_8px_0_0_black]">
          <h2 className="text-3xl font-black uppercase mb-6 flex items-center gap-3">
             <LayoutList className="text-[#FF00FF] w-8 h-8" />
             Ingest API
          </h2>

          <div className="mb-6 pb-6 border-b-2 border-black/10">
            <div className="flex items-center gap-4 mb-4">
               <span className="bg-[#FFD700] text-black font-black px-3 py-1 border-2 border-black text-xs uppercase shadow-[2px_2px_0_0_black]">POST</span>
               <span className="font-bold text-lg">/api/ingest</span>
            </div>
            <p className="font-bold opacity-80">Requires an <code className="bg-black text-white px-2 py-0.5 text-xs">Authorization: Bearer [SDK_API_KEY]</code> header.</p>
          </div>

          <h3 className="text-xl font-black uppercase mb-4">Payload Interface</h3>
          <div className="bg-[#F0F0F0] border-2 border-black p-6 font-mono text-sm mb-6">
            <pre className="overflow-x-auto text-black">
{`{
  // Required
  "message": "Error details or incident description",
  
  // Optional (Highly Recommended for Context)
  "stack": "Stack trace string",
  "browserInfo": {
    "userAgent": "string",
    "url": "string"
  },
  "osInfo": {
    "platform": "string"
  },
  "tags": {
    "component": "cart",
    "action": "checkout"
  },
  "metadata": {
    "userId": "123",
    "theme": "dark"
  }
}`}
            </pre>
          </div>
        </section>

        {/* SECURITY & RATES */}
        <section className="bg-white p-8 md:p-12 border-4 border-black shadow-[8px_8px_0_0_black]">
           <h2 className="text-3xl font-black uppercase mb-6 flex items-center gap-3">
             <ShieldAlert className="text-[#FFD700] w-8 h-8" />
             Limits & Architecture
          </h2>
          <ul className="space-y-4 font-bold opacity-90">
             <li className="flex items-start gap-3">
                <span className="bg-black text-white w-6 h-6 flex items-center justify-center flex-shrink-0 border border-black shadow-[2px_2px_0_0_#FFD700] text-xs">1</span>
                <div>
                   <span className="text-[#FF00FF] font-black uppercase">Rate Limiting:</span> Endpoints allow up to 30 requests per minute per SDK Key. Overages return a 429 Retry-After.
                </div>
             </li>
             <li className="flex items-start gap-3">
                <span className="bg-black text-white w-6 h-6 flex items-center justify-center flex-shrink-0 border border-black shadow-[2px_2px_0_0_#00D1FF] text-xs">2</span>
                <div>
                   <span className="text-[#00D1FF] font-black uppercase">Background AI Analysis:</span> Incident payloads trigger an asynchronous queue. Google Gemini calculates root cause, severity, and assignments based on the team&apos;s tech stack.
                </div>
             </li>
             <li className="flex items-start gap-3">
                <span className="bg-black text-white w-6 h-6 flex items-center justify-center flex-shrink-0 border border-black shadow-[2px_2px_0_0_#00D1FF] text-xs">3</span>
                <div>
                   <span className="text-[#FFD700] font-black uppercase">Data Size Restraints:</span> Payloads exceeding 256KB are heavily truncated or summarily blocked to prevent database blowout. Keep stack traces clean.
                </div>
             </li>
          </ul>
        </section>
      </div>

    </div>
  );
}
