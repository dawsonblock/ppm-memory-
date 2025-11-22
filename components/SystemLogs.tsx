
import React, { useEffect, useRef, useState } from 'react';

interface SystemLogsProps {
  logs: string[];
}

export const SystemLogs: React.FC<SystemLogsProps> = ({ logs }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

  // Check if user has scrolled up
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      // If the distance from bottom is less than 50px, enable auto-scroll
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setIsAutoScrollEnabled(distanceFromBottom < 50);
    }
  };

  useEffect(() => {
    if (containerRef.current && isAutoScrollEnabled) {
      // Only scroll if the user is already at the bottom
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, isAutoScrollEnabled]);

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="bg-black border border-slate-700 rounded-lg p-4 h-48 overflow-y-auto font-mono text-xs shadow-inner scroll-smooth"
    >
       <div className="flex justify-between items-center sticky top-0 bg-black pb-2 border-b border-slate-800 mb-2">
         <h3 className="text-slate-500 font-bold">SYSTEM_KERNEL_LOGS</h3>
         {!isAutoScrollEnabled && (
           <button 
             onClick={() => {
               setIsAutoScrollEnabled(true);
               if(containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
             }}
             className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-cyan-400 animate-pulse hover:bg-slate-700"
           >
             RESUME AUTO-SCROLL
           </button>
         )}
       </div>
       <div className="flex flex-col gap-1">
         {logs.map((log, i) => {
           const isAlert = log.includes("[ALERT]");
           const isSystem = log.includes("[SYSTEM]");
           const isManual = log.includes("[MANUAL]");
           const isTrainer = log.includes("[TRAINER]");
           return (
             <div key={i} className={`${isAlert ? "text-red-400" : isSystem ? "text-green-400" : isManual ? "text-yellow-400" : isTrainer ? "text-pink-400" : "text-slate-300"}`}>
               <span className="opacity-50 mr-2">{new Date().toLocaleTimeString().split(' ')[0]}</span>
               {log}
             </div>
           )
         })}
       </div>
    </div>
  );
};
