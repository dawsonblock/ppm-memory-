
import React, { useEffect, useState } from 'react';
import { X, Trash2, Zap, Eye, Activity, Database, Hash, PenTool } from 'lucide-react';
import { decodeMemory, DecodedMemory } from '../services/memoryDecoder';

interface MemoryReaderProps {
  index: number;
  usage: number;
  latency: number;
  writeMagnitude: number;
  status: { label: string, color: string, bg: string, border: string, bar: string };
  onClose: () => void;
  onFlush: () => void;
}

export const MemoryReader: React.FC<MemoryReaderProps> = ({ index, usage, latency, writeMagnitude, status, onClose, onFlush }) => {
  const [data, setData] = useState<DecodedMemory | null>(null);
  const [hexDump, setHexDump] = useState<string[]>([]);

  useEffect(() => {
    // Decode memory
    const decoded = decodeMemory(index, usage, Date.now());
    setData(decoded);

    // Generate fake hex dump
    const dump = Array.from({ length: 4 }, (_, i) => 
      Array.from({ length: 4 }, () => 
        Math.floor(Math.random() * 255).toString(16).toUpperCase().padStart(2, '0')
      ).join(' ')
    );
    setHexDump(dump);

  }, [index, usage]);

  if (!data) return null;

  return (
    <div className="absolute bottom-4 right-4 z-40 w-80 bg-slate-900/95 backdrop-blur-md border border-cyan-500/50 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden animate-in slide-in-from-right-10 duration-300 flex flex-col">
      
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center gap-2">
           <Eye className="w-4 h-4 text-cyan-400" />
           <span className="text-xs font-bold text-cyan-400 tracking-widest uppercase">Memory Reader</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
        
        {/* Identity Block */}
        <div>
           <div className="flex justify-between items-baseline mb-1">
              <span className="text-[10px] text-slate-500 font-mono">ADDRESS</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${status.bg} ${status.color} border ${status.border}`}>
                  {status.label}
              </span>
           </div>
           <div className="text-3xl font-mono font-bold text-white drop-shadow-md">
              0x{index.toString(16).toUpperCase().padStart(4, '0')}
           </div>
           <div className="text-xs text-slate-500 font-mono">Dec: {index}</div>
        </div>

        {/* Neuro-Symbolic Decoder */}
        <div className="bg-slate-950/50 rounded border border-slate-800 p-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-100 transition-opacity">
                <Database className="w-12 h-12 text-slate-700" />
            </div>
            <div className="relative z-10">
                <h4 className="text-[10px] text-slate-400 font-bold uppercase mb-2 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-500" /> Decoding Content
                </h4>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">TYPE</span>
                        <span className="text-xs font-bold text-cyan-300">{data.type}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {data.concepts.map((c, i) => (
                            <span key={i} className="text-xs bg-cyan-900/30 border border-cyan-500/30 text-cyan-200 px-2 py-1 rounded">
                                {c}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Vector Visualization */}
        <div>
            <h4 className="text-[10px] text-slate-500 font-bold uppercase mb-2 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Vector Embeddings
            </h4>
            <div className="flex items-end gap-1 h-12 border-b border-slate-800 pb-1">
                {data.vector.map((v, i) => (
                    <div key={i} className="flex-1 bg-slate-700/50 hover:bg-cyan-500 transition-colors rounded-t relative group">
                         <div 
                            className="absolute bottom-0 left-0 w-full bg-cyan-500/80 rounded-t transition-all duration-500"
                            style={{ height: `${v * 100}%` }}
                         />
                    </div>
                ))}
            </div>
        </div>

        {/* Raw Hex Dump */}
        <div className="bg-black rounded p-3 font-mono text-[10px] text-green-500/80 border border-slate-800 shadow-inner">
            <h4 className="text-[10px] text-slate-600 font-bold uppercase mb-2 flex items-center gap-1">
                <Hash className="w-3 h-3" /> Raw Stream
            </h4>
            {hexDump.map((line, i) => (
                <div key={i} className="flex gap-3">
                    <span className="text-slate-700 select-none">{(index + i * 4).toString(16).toUpperCase().padStart(4, '0')}:</span>
                    <span className="tracking-widest">{line}</span>
                </div>
            ))}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-900 border border-slate-800 p-2 rounded text-center">
                <div className="text-[8px] text-slate-500 uppercase mb-1">Load</div>
                <div className={`text-sm font-mono font-bold ${usage > 0.8 ? 'text-red-400' : 'text-white'}`}>
                    {(usage * 100).toFixed(0)}%
                </div>
            </div>
             <div className="bg-slate-900 border border-slate-800 p-2 rounded text-center">
                <div className="text-[8px] text-slate-500 uppercase mb-1">Latency</div>
                <div className={`text-sm font-mono font-bold ${latency > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {latency.toFixed(0)}ms
                </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-2 rounded text-center">
                <div className="text-[8px] text-slate-500 uppercase mb-1 flex justify-center items-center gap-1">
                    <PenTool className="w-2 h-2" /> Write
                </div>
                <div className="text-sm font-mono font-bold text-purple-400">
                    {(writeMagnitude * 100).toFixed(0)}%
                </div>
            </div>
        </div>

      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-800/50">
        <button 
            onClick={onFlush}
            className="w-full flex items-center justify-center gap-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/50 text-red-400 hover:text-red-300 py-3 rounded-lg transition-all text-xs font-bold tracking-wider group"
        >
            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            FLUSH MEMORY SECTOR
        </button>
      </div>

    </div>
  );
};
