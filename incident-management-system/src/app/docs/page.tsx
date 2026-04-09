import Link from "next/link";
import { ArrowLeft, Terminal } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-12">
        <Terminal className="w-16 h-16 text-[#FFD700] mx-auto mb-4" />
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">API & SDK Docs</h1>
        <p className="text-xl text-white/70 italic border-l-4 border-[#00D1FF] pl-4 max-w-xl mx-auto">
          Documentation is currently being built. Check back soon for full integration guides and API references.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-[#111] border-2 border-white/20 p-6 max-w-2xl mx-auto text-left">
          <h2 className="text-[#FF00FF] font-black uppercase mb-2">Quick Install</h2>
          <code className="text-sm block">npm install @devnexus/sdk</code>
        </div>
      </div>

      <Link 
        href="/"
        className="mt-16 flex items-center gap-2 hover:text-[#FFD700] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Home
      </Link>
    </div>
  );
}
