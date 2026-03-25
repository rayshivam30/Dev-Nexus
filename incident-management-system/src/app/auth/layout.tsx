import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Shield, Activity } from "lucide-react";


export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen flex overflow-hidden bg-[#020408] text-[#FAFAFA] font-sans selection:bg-violet-500/30">
      
      {/* Left Side: Auth Forms */}
      <div className="w-full lg:w-[45%] flex flex-col relative z-20 bg-[#020408] border-r border-white/[0.05]">
        <header className="px-10 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group transition-all">
            <div className="w-8 h-8 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold tracking-tight text-xl">DevNexus.</span>
          </Link>
          <Link href="/" className="text-xs font-medium text-white/40 hover:text-white transition-colors uppercase tracking-widest">
            Back to home
          </Link>
        </header>

        <main className="flex-1 flex flex-col justify-center p-8">
          <div className="w-full max-w-md mx-auto">
            {children}
          </div>
        </main>

        <footer className="px-10 py-4 border-t border-white/[0.05] text-[10px] text-white/20 font-mono uppercase tracking-[0.2em] flex justify-between">
          <span>&copy; 2026 DevNexus</span>
          <div className="flex space-x-4">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </footer>
      </div>

      {/* Right Side: Decorative Branding */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <Image 
          src="/assets/auth_bg.png" 
          alt="Auth Background" 
          fill 
          className="object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-1000 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-violet-600/10 mix-blend-overlay" />
        
        <div className="relative z-10 p-20 flex flex-col justify-end h-full">
          <div className="space-y-8 max-w-xl">
             <div className="inline-flex items-center bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-violet-400">
               <Shield className="w-3 h-3 mr-2" /> Enterprise Ready
             </div>
             
             <h2 className="text-5xl font-black leading-tight tracking-tight">
               Build resilient systems <br /> 
               <span className="text-white/40 italic">without the friction.</span>
             </h2>
             
             <div className="space-y-4 pt-4">
                {[
                  "Native SDK for instantaneous error catching",
                  "Automated SLA monitoring & escalations",
                  "AI-driven root cause identification",
                  "Bespoke incident resolution workflows"
                ].map((text) => (
                  <div key={text} className="flex items-center space-x-3 text-white/60">
                    <CheckCircle className="w-5 h-5 text-violet-500" />
                    <span className="text-base font-medium">{text}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Floating Abstract Element */}
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-violet-600/20 blur-[120px] rounded-full -mr-48 animate-pulse" />
      </div>
    </div>
  );
}

