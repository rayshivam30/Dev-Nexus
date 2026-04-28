import { CheckCircle2, Copy, Layers } from "lucide-react";

interface ProjectSdkKeyModalProps {
  sdkKey: string;
  onConfirm: () => void;
}

export function ProjectSdkKeyModal({ sdkKey, onConfirm }: ProjectSdkKeyModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
      <div className="bg-[#111113] border border-white/[0.08] rounded-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-white/[0.06] flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Project Created</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Save your SDK key before continuing.
          </p>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-medium text-zinc-500 ml-1">SDK API Key</label>
            <div className="flex items-center gap-2 p-4 bg-[#0a0a0c] border border-white/[0.06] rounded-xl">
              <code className="text-sm font-mono text-emerald-400 break-all select-all flex-1">
                 {sdkKey}
              </code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(sdkKey);
                  alert("Copied to clipboard!");
                }}
                className="p-2 text-zinc-600 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all shrink-0"
                title="Copy Key"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-red-400 font-medium text-center">
              Save this key now. It won&apos;t be shown again.
            </p>
          </div>
          
          <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
              <Layers className="w-4 h-4" />
              Quick Start
            </div>
            <div className="text-sm font-mono text-zinc-400 bg-[#0a0a0c] p-4 rounded-lg border border-white/[0.04] overflow-x-auto whitespace-pre">
{`npm install @devnexus/sdk

import { DevNexus } from '@devnexus/sdk';

DevNexus.init({
  apiKey: '${sdkKey}',
  baseUrl: 'https://your-app.com/api/ingest'
});`}
            </div>
          </div>

          <button 
            onClick={onConfirm} 
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-500 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
