import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-64 w-full items-center justify-center p-12">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-black animate-spin" />
        <p className="font-black text-xs uppercase tracking-widest text-black/50">AUTHORIZING HACKER_PROTOCOL...</p>
      </div>
    </div>
  );
}
