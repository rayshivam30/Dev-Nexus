import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Command, ArrowLeft, Hexagon } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen flex flex-col relative bg-black text-white selection:bg-white/10 overflow-hidden">
      
      {/* Auth Forms Container */}
      <div className="w-full flex-1 flex flex-col relative z-20 items-center justify-between">
        
        {/* Framer-style Vibrant Mesh Gradients behind the form */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-fuchsia-600 via-blue-600 to-cyan-400 rounded-full blur-[140px] opacity-20 pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600 rounded-full blur-[140px] opacity-20 pointer-events-none" />

        <div className="w-full flex justify-center pt-6 px-6">
          <header className="w-full max-w-5xl flex items-center justify-between bg-white/5 border border-white/10 backdrop-blur-2xl rounded-full px-6 h-14 shadow-2xl relative z-50">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-7 h-7 bg-white flex items-center justify-center rounded-full transition-all group-hover:scale-110">
                <Command className="w-3.5 h-3.5 text-black" />
              </div>
              <span className="font-bold tracking-tight text-base">DevNexus</span>
            </Link>
            <Link href="/" className="text-xs font-bold text-white/60 hover:text-white px-4 py-2 transition-all flex items-center gap-2 border border-white/10 rounded-full hover:bg-white/10">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Link>
          </header>
        </div>

        <main className="relative z-10 flex-1 flex flex-col justify-center w-full px-6 min-h-0">
          <div className="w-full max-w-lg mx-auto">
            {children}
          </div>
        </main>

        <footer className="relative z-10 w-full px-6 py-6 text-xs flex flex-col sm:flex-row justify-center items-center gap-6 text-white/40 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse" />
            <span>Systems operational</span>
          </div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-white/20" />
          <div className="flex space-x-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
