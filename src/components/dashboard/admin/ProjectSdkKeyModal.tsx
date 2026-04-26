import { CheckCircle2, Copy, Layers } from "lucide-react";

interface ProjectSdkKeyModalProps {
  sdkKey: string;
  onConfirm: () => void;
}

export function ProjectSdkKeyModal({ sdkKey, onConfirm }: ProjectSdkKeyModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80">
      <div className="bg-white border-8 border-black shadow-[40px_40px_0_0_#32CD32] w-full max-w-xl p-0 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-[#32CD32] p-12 border-b-8 border-black flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-white border-4 border-black flex items-center justify-center mb-6 shadow-[8px_8px_0_0_black]">
            <CheckCircle2 className="w-14 h-14 text-black stroke-[3px]" />
          </div>
          <h2 className="text-4xl font-[900] uppercase italic tracking-tighter text-black">PROJECT_STABLE</h2>
          <p className="text-black font-black text-xs uppercase tracking-widest mt-4">
            Operational container successfully deployed to the nexus.
          </p>
        </div>
        
        <div className="p-12 space-y-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40">MASTER_SDK_KEY</label>
            <div className="relative">
              <div className="absolute inset-0 bg-black translate-x-2 translate-y-2"></div>
              <div className="relative bg-white border-4 border-black p-6 flex items-center justify-between gap-6 overflow-hidden">
                <code className="text-sm font-black text-black break-all select-all font-mono italic">
                   {sdkKey}
                </code>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(sdkKey);
                    alert("API_KEY_COPIED_TO_CLIPBOARD");
                  }}
                  className="p-3 bg-black text-white hover:bg-[#FFD700] hover:text-black transition-colors"
                  title="Copy Key"
                >
                  <Copy className="w-6 h-6" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-[#FF3131] font-black uppercase tracking-widest text-center mt-4">
              !!! CRITICAL: COPY KEY NOW. RECORD WILL BE PURGED FROM THIS VIEW !!!
            </p>
          </div>
          
          <div className="bg-[#F0F0F0] p-8 border-4 border-black space-y-6">
            <div className="flex items-center gap-3 text-xs font-black uppercase">
              <div className="p-2 bg-black text-white">
                <Layers className="w-4 h-4" />
              </div>
              INJECTION_GUIDE
            </div>
            <div className="text-[11px] font-bold text-black bg-white p-6 border-2 border-black overflow-x-auto whitespace-pre font-mono italic">
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
            className="w-full py-6 bg-black text-white font-black uppercase italic tracking-widest hover:bg-[#FFD700] hover:text-black transition-colors shadow-[8px_8px_0_0_#32CD32]"
          >
            CONFIRM_RECEIPT_&_CONTINUE
          </button>
        </div>
      </div>
    </div>
  );
}
