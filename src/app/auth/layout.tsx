import { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle, Shield, Activity, ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen flex overflow-hidden bg-[#F0F0F0] text-black font-mono selection:bg-black selection:text-white">
      
      {/* Left Side: Auth Forms */}
      <div className="w-full lg:w-[45%] flex flex-col relative z-20 bg-white border-r-[6px] border-black shadow-[10px_0_0_0_rgba(0,0,0,0.05)]">
        
        {/* Brutalist Grid Background Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.05]" 
             style={{ backgroundImage: `radial-gradient(#000 1px, transparent 0)`, backgroundSize: '16px 16px' }}>
        </div>

        <header className="relative z-10 px-10 py-3 flex items-center justify-between border-b-2 border-black/10">
          <Link href="/" className="flex items-center space-x-2 group transform -rotate-1 hover:rotate-0 transition-transform">
            <div className="w-8 h-8 bg-[#FFD700] border-2 border-black flex items-center justify-center shadow-[3px_3px_0_0_black]">
              <Activity className="w-5 h-5 text-black" />
            </div>
            <span className="font-black tracking-tighter text-xl uppercase italic">DevNexus_</span>
          </Link>
          <Link href="/" className="text-[9px] font-black underline decoration-2 underline-offset-2 hover:bg-black hover:text-white px-2 py-0.5 transition-colors uppercase tracking-widest flex items-center gap-2">
            <ArrowLeft className="w-3 h-3" /> HOME.EXE
          </Link>
        </header>

        <main className="relative z-10 flex-1 flex flex-col justify-center py-4 px-8 overflow-y-auto">
          <div className="w-full max-w-md mx-auto">
            {children}
          </div>
        </main>

        <footer className="relative z-10 px-10 py-3 border-t-2 border-black/10 text-[9px] font-black uppercase tracking-[0.2em] flex flex-col sm:flex-row justify-between gap-2">
          <span className="bg-[#FFD700] px-2 py-0.5 border border-black italic">v0.1.0_PROD</span>
          <div className="flex space-x-6">
            <Link href="#" className="hover:underline underline-offset-2 decoration-2">Privacy_Policy</Link>
            <Link href="#" className="hover:underline underline-offset-2 decoration-2">EULA</Link>
          </div>
        </footer>
      </div>

      {/* Right Side: Decorative Branding */}
      <div className="hidden lg:flex flex-1 relative bg-black overflow-hidden flex-col justify-center items-center p-20">
        {/* Abstract Brutalist Background */}
        <div className="absolute inset-0 opacity-20" 
             style={{ backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`, backgroundSize: '40px 40px' }}>
        </div>
        
        <div className="relative z-10 space-y-12 max-w-2xl text-white">
           <div className="inline-flex items-center bg-white text-black border-[3px] border-[#FFD700] px-6 py-2 text-xs font-black uppercase tracking-widest shadow-[8px_8px_0_0_#FFD700]">
             <Shield className="w-4 h-4 mr-3" /> SECURITY_OVERSIGHT: ACTIVE
           </div>
           
           <h2 className="text-6xl md:text-8xl font-[900] leading-[0.8] tracking-tighter uppercase italic">
             Build <br /> 
             <span className="text-[#FFD700] border-l-8 border-[#FFD700] pl-6">Resilient</span> <br /> 
             Systems.
           </h2>
           
           <div className="space-y-6 pt-10">
              {[
                "NATIVE_SDK: INSTANT_ERROR_CATCHING",
                "SLA_MONITOR: AUTO_ESCALATE",
                "AI_LOGIC: ROOT_CAUSE_ID",
                "BESPOKE_FLOWS: FIXED_IN_MINUTES"
              ].map((text) => (
                <div key={text} className="flex items-start space-x-4 group">
                  <div className="w-6 h-6 bg-white border-2 border-white flex-shrink-0 flex items-center justify-center group-hover:bg-[#FFD700] transition-colors">
                    <CheckCircle className="w-4 h-4 text-black" />
                  </div>
                  <span className="text-lg font-black tracking-tight leading-none uppercase pt-1">{text}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Decorative Skewed Boxes */}
        <div className="absolute top-10 right-10 w-40 h-40 border-4 border-[#FF00FF] -rotate-12 opacity-40" />
        <div className="absolute bottom-20 left-10 w-64 h-64 border-4 border-[#00D1FF] rotate-12 opacity-40" />
      </div>
    </div>
  );
}

