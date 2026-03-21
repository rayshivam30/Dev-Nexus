import { ReactNode } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-foreground selection:text-background">
      <header className="px-6 py-4 flex items-center border-b border-border">
        <Link href="/" className="flex items-center space-x-2 transition-opacity hover:opacity-80">
          <div className="w-6 h-6 bg-foreground rounded-sm flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-background" />
          </div>
          <span className="font-bold tracking-tight">Incident.</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        {children}
      </main>
    </div>
  );
}
