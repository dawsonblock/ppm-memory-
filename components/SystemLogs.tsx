import React, { useEffect, useRef } from 'react';

interface SystemLogsProps {
  logs: string[];
}

export const SystemLogs: React.FC<SystemLogsProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  return (
    <div className="bg-black border border-slate-700 rounded-lg p-4 h-48 overflow-y-auto font-mono text-xs shadow-inner">
       <h3 className="text-slate-500 font-bold mb-2 sticky top-0 bg-black pb-2 border-b border-slate-800">SYSTEM_KERNEL_LOGS</h3>
       <div className="flex flex-col gap-1">
         {logs.map((log, i) => {
           const isAlert = log.includes("[ALERT]");
           const isSystem = log.includes("[SYSTEM]");
           return (
             <div key={i} className={`${isAlert ? "text-red-400" : isSystem ? "text-green-400" : "text-slate-300"}`}>
               <span className="opacity-50 mr-2">{new Date().toLocaleTimeString().split(' ')[0]}</span>
               {log}
             </div>
           )
         })}
         <div ref={bottomRef} />
       </div>
    </div>
  );
};