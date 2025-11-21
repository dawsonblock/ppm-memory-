import React from 'react';
import { ArrowDown, ArrowRight, Brain, Database, Cpu, Activity, MessageSquare } from 'lucide-react';

interface ArchitectureDiagramProps {
  thoughtVector: number[];
  lastAction: string;
  pressure: number;
}

export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({ thoughtVector, lastAction, pressure }) => {
  return (
    <div className="relative w-full h-full bg-slate-900/50 rounded-lg border border-slate-700 flex flex-col items-center justify-center p-8">
      
      {/* Top: Inputs */}
      <div className="flex gap-12 mb-12">
        <div className="flex flex-col items-center">
          <div className="w-24 h-12 bg-slate-800 border border-slate-600 rounded flex items-center justify-center text-xs text-slate-300 shadow-lg">
            OBSERVATION
            <br/>
            (96 floats)
          </div>
          <ArrowDown className="text-slate-500 mt-2 animate-pulse" />
        </div>
        <div className="flex flex-col items-center">
           <div className="w-24 h-12 bg-indigo-900/30 border border-indigo-500/50 rounded flex items-center justify-center text-xs text-indigo-300 shadow-lg">
            PREV THOUGHT
            <br/>
            (Recurrent)
          </div>
          <ArrowDown className="text-indigo-500 mt-2 animate-pulse" />
        </div>
      </div>

      {/* Middle: The Brain Core */}
      <div className="relative flex items-center gap-8 z-10">
        
        {/* Encoder & LSTM */}
        <div className="w-48 h-32 bg-slate-800 border-2 border-cyan-500 rounded-xl flex flex-col items-center justify-center relative shadow-[0_0_20px_rgba(6,182,212,0.2)]">
           <div className="absolute -top-3 bg-slate-900 px-2 text-cyan-400 text-xs font-bold">NEURAL_CONTROLLER</div>
           <Cpu className="w-8 h-8 text-cyan-400 mb-2" />
           <div className="text-xs text-center text-slate-300">
             Encoder + LSTM<br/>
             <span className="text-[10px] text-slate-500">Hidden Dim: 256</span>
           </div>
        </div>

        {/* Connections */}
        <div className="h-[2px] w-12 bg-slate-600"></div>

        {/* Memory Module */}
        <div className={`w-40 h-32 bg-slate-800 border-2 ${pressure > 0.85 ? 'border-red-500 animate-pulse' : 'border-green-500'} rounded-xl flex flex-col items-center justify-center relative shadow-lg`}>
           <div className="absolute -top-3 bg-slate-900 px-2 text-green-400 text-xs font-bold">PMM_MODULE</div>
           <Database className={`w-8 h-8 ${pressure > 0.85 ? 'text-red-500' : 'text-green-500'} mb-2`} />
           <div className="text-xs text-center text-slate-300">
             Differentiable<br/>Memory Bank
           </div>
           <div className="mt-2 w-full px-4">
             <div className="w-full h-1 bg-slate-700 rounded overflow-hidden">
               <div className={`h-full ${pressure > 0.85 ? 'bg-red-500' : 'bg-green-500'} transition-all duration-300`} style={{ width: `${pressure * 100}%` }}></div>
             </div>
           </div>
        </div>

      </div>

      {/* Bottom: Outputs */}
      <div className="flex gap-12 mt-12">
        <div className="flex flex-col items-center">
          <ArrowDown className="text-slate-500 mb-2 animate-pulse" />
          <div className="w-32 h-12 bg-slate-800 border border-slate-600 rounded flex items-center justify-center text-xs text-slate-300 shadow-lg gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-cyan-400">{lastAction}</span>
          </div>
        </div>
        
        <div className="flex flex-col items-center">
          <ArrowDown className="text-indigo-500 mb-2 animate-pulse" />
          <div className="w-32 h-12 bg-indigo-900/30 border border-indigo-500/50 rounded flex flex-col items-center justify-center text-xs text-indigo-300 shadow-lg p-1">
            <div className="flex items-center gap-1 mb-1">
              <MessageSquare className="w-3 h-3" /> THOUGHT_VEC
            </div>
            <div className="flex gap-[1px] h-3">
              {thoughtVector.slice(0, 8).map((val, i) => (
                <div key={i} className="w-2 bg-indigo-500" style={{ opacity: Math.abs(val) }}></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Loop Line (Decorative) */}
      <svg className="absolute inset-0 pointer-events-none w-full h-full" style={{zIndex: 0}}>
        <path d="M 60% 80% L 60% 90% L 95% 90% L 95% 10% L 55% 10% L 55% 20%" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="5,5" strokeOpacity="0.3" />
      </svg>
    </div>
  );
};