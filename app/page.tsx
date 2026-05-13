"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [isObfuscated, setIsObfuscated] = useState(false);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();
    const handleCut = (e: ClipboardEvent) => e.preventDefault();
    const handleDragStart = (e: DragEvent) => e.preventDefault();
    const handleSelectStart = (e: Event) => e.preventDefault();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent PrintScreen, Ctrl+P, Mac Cmd+Shift+3/4/5
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && e.key.toLowerCase() === "p") ||
        (e.metaKey && e.shiftKey && ["3", "4", "5", "s"].includes(e.key.toLowerCase())) ||
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") || 
        (e.ctrlKey && e.key.toLowerCase() === "c") || 
        (e.metaKey && e.key.toLowerCase() === "c")
      ) {
        e.preventDefault();
        setIsObfuscated(true);
        setTimeout(() => setIsObfuscated(false), 3000);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsObfuscated(true);
      } else {
        setIsObfuscated(false);
      }
    };

    const handleBlur = () => setIsObfuscated(true);
    const handleFocus = () => setIsObfuscated(false);

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCut);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return (
    <div 
      className="h-screen w-full bg-[#050505] text-zinc-400 flex flex-col font-sans select-none overflow-hidden relative"
      style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
    >
      {isObfuscated && (
        <div className="absolute inset-0 z-[9999] bg-black/95 backdrop-blur-2xl flex items-center justify-center flex-col gap-6" style={{ backgroundImage: "repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), repeating-linear-gradient(45deg, #000 25%, #111 25%, #111 75%, #000 75%, #000)", backgroundSize: "4px 4px", backgroundPosition: "0 0, 2px 2px" }}>
           <div className="w-16 h-16 border-2 border-red-600/50 border-t-red-600 rounded-full animate-spin"></div>
           <div className="text-center">
             <div className="text-red-500 font-mono text-sm tracking-[0.2em] font-bold uppercase animate-pulse mb-2">Security Protocol Engaged</div>
             <div className="text-zinc-600 font-mono text-[10px] uppercase tracking-wider">Unrecognized capture device or environment focus lost</div>
           </div>
        </div>
      )}
      <div className="flex-none h-14 border-b border-zinc-800 flex items-center justify-between px-4 sm:px-6 bg-[#080808]">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
          <span className="text-zinc-100 font-bold tracking-widest uppercase text-xs sm:text-sm">SocioCipher</span>
          <span className="text-[10px] sm:text-xs text-zinc-600 font-mono ml-2 hidden sm:inline-block">v1.0.4-STABLE</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-[10px] uppercase text-zinc-500 leading-none">Active Identity</span>
            <span className="text-[10px] sm:text-xs font-mono text-zinc-300">ed25519:9f2...8a1c</span>
          </div>
          <div className="w-8 h-8 border border-zinc-700 bg-zinc-900 rounded flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-zinc-500 rounded-sm"></div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r border-zinc-800 flex-col bg-[#080808] hidden md:flex">
          <div className="p-4 flex-none border-b border-zinc-800">
            <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-3">Encrypted Channels</div>
            <div className="space-y-1">
              <div className="px-3 py-2 bg-zinc-900 text-zinc-100 rounded text-xs flex justify-between items-center">
                <span>#red-room-01</span>
                <span className="text-[9px] text-red-500">4m</span>
              </div>
              <div className="px-3 py-2 text-zinc-500 hover:bg-zinc-900 rounded text-xs transition-colors cursor-pointer">#leak-dump-alpha</div>
              <div className="px-3 py-2 text-zinc-500 hover:bg-zinc-900 rounded text-xs transition-colors cursor-pointer">#cipher-comms</div>
            </div>
          </div>
          <div className="p-4 flex-1">
            <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-3">Active Nodes</div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 opacity-60">
                <div className="w-1 h-8 bg-zinc-700"></div>
                <div>
                  <div className="text-[10px] font-mono text-zinc-300">Node_812-Singapore</div>
                  <div className="text-[9px] text-zinc-600 italic">Latency: 14ms</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-zinc-700"></div>
                <div>
                  <div className="text-[10px] font-mono text-zinc-300">Node_044-Zurich</div>
                  <div className="text-[9px] text-zinc-600 italic">Latency: 42ms</div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-zinc-800">
            <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
              <div className="text-[9px] uppercase text-zinc-600 mb-1">Entropy Status</div>
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-zinc-400 w-3/4"></div>
              </div>
              <div className="text-[9px] text-right mt-1 text-zinc-500">78% Pool Strength</div>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col relative min-w-0">
          <div className="absolute inset-0 pointer-events-none z-50 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 2px)" }}></div>
          <div className="p-4 sm:p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-zinc-800 flex-none"></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-bold text-zinc-200 truncate">anon-7712</span>
                  <span className="text-[9px] font-mono text-zinc-600 shrink-0">T-12m Purge</span>
                </div>
                <div className="bg-zinc-900/80 p-3 sm:p-4 rounded-xl border border-zinc-800 text-xs sm:text-sm leading-relaxed text-zinc-300 shadow-xl break-words">
                  The broadcast signal has been decentralized across nodes 04 and 09. Verify the checksums before establishing a peer link. Documentation will self-destruct in 400 seconds.
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 sm:gap-4 opacity-50">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-zinc-800 flex-none"></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-bold text-zinc-200 truncate">system_msg</span>
                  <span className="text-[9px] font-mono text-zinc-600 shrink-0">EXPIRED</span>
                </div>
                <div className="bg-zinc-900/30 p-3 sm:p-4 rounded-xl border border-zinc-800/30 text-xs sm:text-sm italic font-mono text-zinc-600 break-words">
                  [DATA ENCRYPTED - KEY ROTATED]
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-zinc-800 flex-none"></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-bold text-zinc-200 truncate">val_kyrie</span>
                  <span className="text-[9px] font-mono text-zinc-600 shrink-0">T-2m Purge</span>
                </div>
                <div className="bg-zinc-900/80 p-3 sm:p-4 rounded-xl border border-zinc-800 text-xs sm:text-sm leading-relaxed text-zinc-300 shadow-xl break-words">
                  Confirmed. Zero-knowledge proof accepted by coordinator. Ready for dark-mode transmission.
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 sm:p-6 pt-0 flex-none bg-gradient-to-t from-[#050505] to-transparent">
            <div className="bg-[#111111] border border-zinc-800 rounded-xl p-2 sm:p-3 flex items-center gap-2 sm:gap-4 focus-within:border-zinc-600 transition-all shadow-2xl relative z-10 w-full">
              <div className="p-1.5 sm:p-2 bg-zinc-800 rounded text-zinc-400 hidden sm:block">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <input type="text" placeholder="Inject digital noise..." className="bg-transparent border-none outline-none flex-1 text-xs sm:text-sm text-zinc-200 placeholder-zinc-700 font-mono w-full px-2 sm:px-0" />
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1 text-[8px] sm:text-[10px] text-zinc-600 uppercase font-bold px-1.5 py-1 border border-zinc-800 rounded bg-black hidden sm:flex">
                  <span>TTL: 15m</span>
                </div>
                <button className="bg-zinc-200 text-black px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-tighter hover:bg-white cursor-pointer whitespace-nowrap">
                  Transmit
                </button>
              </div>
            </div>
          </div>
        </main>

        <aside className="w-64 border-l border-zinc-800 bg-[#080808] flex-col p-4 hidden lg:flex">
          <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-6">Security Metrics</div>
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-500 uppercase">Node Integrity</span>
                <span className="text-[10px] font-mono text-green-500">100%</span>
              </div>
              <div className="grid grid-cols-10 gap-0.5">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="h-1 bg-green-900 rounded-full"></div>
                ))}
                <div className="h-1 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="bg-red-950/20 border border-red-900/30 p-3 rounded-lg">
              <div className="text-[10px] text-red-500 font-bold mb-1 uppercase">Screenshot Alert</div>
              <div className="text-[9px] text-zinc-500 leading-tight">External capture device detected. UI obfuscation engaged. Rendering digital noise layer.</div>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] uppercase text-zinc-600 font-bold tracking-widest">Recent Purges</div>
              <div className="font-mono text-[9px] text-zinc-700">0xFA12... Purged (0.4s ago)</div>
              <div className="font-mono text-[9px] text-zinc-700">0xBC88... Purged (1.2s ago)</div>
              <div className="font-mono text-[9px] text-zinc-700">0xDE11... Purged (4.8s ago)</div>
            </div>
          </div>
          <div className="mt-auto pt-6 border-t border-zinc-900 flex justify-center">
            <div className="w-24 h-24 border border-zinc-800 rounded p-1 opacity-20">
              <div className="w-full h-full bg-zinc-900 flex flex-wrap gap-px overflow-hidden">
                {[...Array(64)].map((_, i) => (
                  <div key={i} className={`w-1 h-1 ${i % 7 === 0 ? 'bg-white' : i % 3 === 0 ? 'bg-zinc-400' : 'bg-zinc-800'}`}></div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
