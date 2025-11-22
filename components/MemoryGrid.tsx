import React, { useRef, useEffect, useState } from 'react';
import { Search, Layers, Activity, Minimize2, PenTool, Trash2 } from 'lucide-react';
import { MemoryReader } from './MemoryReader';

interface MemoryGridProps {
  slots: number[]; // Usage 0-1
  capacity: number;
  onResetSlots?: (indices: number[]) => void;
}

export const MemoryGrid: React.FC<MemoryGridProps> = ({ slots, capacity, onResetSlots }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef({ cols: 0, rows: 0, cellW: 0, cellH: 0, gap: 0 });
  const [tooltip, setTooltip] = useState<{ x: number, y: number, index: number, value: number, latency: number, magnitude: number } | null>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  // Selection State (Multi-select)
  const [selectedSlots, setSelectedSlots] = useState<Set<number>>(new Set());

  // Animation state for flushed effect
  const [flushedAnims, setFlushedAnims] = useState<Array<{ index: number, startTime: number }>>([]);

  // Compression/Optimization State
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Latency State (Simulated in ms, 0-100)
  const [latencies, setLatencies] = useState<number[]>([]);
  
  // Write Magnitude State (Simulated 0-1)
  const [writeMagnitudes, setWriteMagnitudes] = useState<number[]>([]);

  // Initialize & Resize Latencies/Magnitudes based on Capacity
  useEffect(() => {
    setLatencies(prev => {
      if (prev.length === capacity) return prev;
      const newArr = new Array(capacity).fill(0).map((_, i) => {
         return prev[i] !== undefined ? prev[i] : 10 + Math.random() * 20;
      });
      return newArr;
    });
    
    setWriteMagnitudes(prev => {
      if (prev.length === capacity) return prev;
      const newArr = new Array(capacity).fill(0).map((_, i) => {
         return prev[i] !== undefined ? prev[i] : 0;
      });
      return newArr;
    });
  }, [capacity]);

  // Simulate Fluctuations (Bus Noise & Write Ops)
  useEffect(() => {
    const interval = setInterval(() => {
      // Update Latencies
      setLatencies(prev => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        for(let i=0; i < next.length; i++) {
             if (Math.random() > 0.9) {
                 const delta = (Math.random() - 0.5) * 15;
                 next[i] = Math.max(5, Math.min(100, next[i] + delta));
             }
        }
        return next;
      });

      // Update Write Magnitudes (Organic movement)
      setWriteMagnitudes(prev => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        for(let i=0; i < next.length; i++) {
             // Decay existing magnitude slowly
             next[i] = Math.max(0, next[i] - 0.06);
             
             // Random spikes for activity
             if (Math.random() > 0.93) { 
                 next[i] = Math.min(1.0, next[i] + 0.4 + Math.random() * 0.6);
             }
        }
        return next;
      });
    }, 100); 
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (!val.trim()) {
      setHighlightedIndex(null);
      return;
    }

    let idx = NaN;
    if (val.toLowerCase().startsWith('0x')) {
      idx = parseInt(val, 16);
    } else {
      idx = parseInt(val, 10);
    }

    if (!isNaN(idx) && idx >= 0 && idx < capacity) {
      setHighlightedIndex(idx);
    } else {
      setHighlightedIndex(null);
    }
  };

  const getStatus = (usage: number, latency: number) => {
    const isLaggy = latency > 75;
    const isSlow = latency > 50;

    if (usage > 0.8 || isLaggy) return { label: isLaggy ? 'CRITICAL (LAG)' : 'CRITICAL', color: 'text-red-500', border: 'border-red-500', bg: 'bg-red-500/20', bar: 'bg-red-500' };
    if (usage > 0.4 || isSlow) return { label: 'HIGH USAGE', color: 'text-cyan-400', border: 'border-cyan-400', bg: 'bg-cyan-400/20', bar: 'bg-cyan-400' };
    if (usage > 0.05) return { label: 'ACTIVE', color: 'text-cyan-600', border: 'border-cyan-600', bg: 'bg-cyan-600/20', bar: 'bg-cyan-600' };
    return { label: 'IDLE', color: 'text-slate-500', border: 'border-slate-600', bg: 'bg-slate-800', bar: 'bg-slate-600' };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, rect.width, rect.height);

      if (slots.length === 0) return;

      const area = rect.width * rect.height;
      const cellArea = area / capacity;
      const cellSide = Math.sqrt(cellArea);
      
      let cols = Math.floor(rect.width / cellSide);
      let rows = Math.ceil(capacity / cols);

      if (rows * cellSide > rect.height) {
        cols = Math.ceil(Math.sqrt(capacity * (rect.width / rect.height)));
        rows = Math.ceil(capacity / cols);
      }

      const gap = capacity > 512 ? 0 : 1;
      const cellW = (rect.width - (cols - 1) * gap) / cols;
      const cellH = (rect.height - (rows - 1) * gap) / rows;

      layoutRef.current = { cols, rows, cellW, cellH, gap };

      const time = performance.now();

      slots.forEach((usage, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        const x = Math.floor(col * (cellW + gap));
        const y = Math.floor(row * (cellH + gap));
        const w = Math.floor(cellW);
        const h = Math.floor(cellH);

        const latency = latencies[i] || 0;
        const magnitude = writeMagnitudes[i] || 0;

        // Base Status Color
        let color = '#1e293b'; // slate-800 (IDLE)
        if (usage > 0.8 || latency > 75) color = '#ef4444'; 
        else if (usage > 0.4 || latency > 50) color = '#22d3ee'; 
        else if (usage > 0.05) color = '#155e75'; 

        // Optimization Animation Override
        let isOptimizingSlot = false;
        if (isOptimizing && usage <= 0.05) {
           isOptimizingSlot = true;
           const scanPos = (time % 1000) / 1000; // 0 to 1
           const rowNorm = row / rows;
           if (Math.abs(rowNorm - scanPos) < 0.1) {
              color = '#ffffff'; 
           } else {
              color = '#0f172a'; 
           }
        }

        // --- DUAL BAR RENDERING ---
        // Usage (Left 65%) | Separator (1px) | Write Magnitude (Right 35%)
        const magBarWidth = Math.max(4, Math.floor(w * 0.35)); 
        const separatorWidth = 1;
        const usageWidth = Math.max(0, w - magBarWidth - separatorWidth);

        if (isOptimizingSlot || usageWidth <= 2) {
            // Fallback for very small cells: Single block color
            ctx.fillStyle = color;
            ctx.fillRect(x, y, w, h);
        } else {
            // 1. Usage Bar (Left)
            ctx.fillStyle = color;
            ctx.fillRect(x, y, usageWidth, h);

            // 2. Separator (Black)
            ctx.fillStyle = '#000000';
            ctx.fillRect(x + usageWidth, y, separatorWidth, h);

            // 3. Magnitude Track (Right)
            const magX = x + usageWidth + separatorWidth;
            
            // Solid black background to create a distinct "slot"
            ctx.fillStyle = '#000000'; 
            ctx.fillRect(magX, y, magBarWidth, h);

            // Active Magnitude Bar
            if (magnitude > 0.01) {
               const barHeight = Math.max(1, h * magnitude);
               
               // Gradient Fill for style
               const gradient = ctx.createLinearGradient(magX, y + h, magX, y + h - barHeight);
               gradient.addColorStop(0, '#7c3aed'); // Violet-600
               gradient.addColorStop(1, '#e879f9'); // Fuchsia-400
               
               ctx.fillStyle = gradient;
               ctx.fillRect(magX, y + (h - barHeight), magBarWidth, barHeight);
               
               // Bright Top Line
               ctx.fillStyle = '#ffffff';
               ctx.fillRect(magX, y + (h - barHeight), magBarWidth, 1);
            }
        }

        // Critical Border (Over entire cell)
        if ((usage > 0.8 || latency > 75) && (!isOptimizing || usage > 0.05)) {
           ctx.strokeStyle = '#fca5a5'; // red-300
           ctx.lineWidth = 1;
           ctx.strokeRect(x, y, w, h);
        }

        // Selection Highlight
        if (selectedSlots.has(i)) {
           ctx.strokeStyle = '#818cf8'; // Indigo-400
           ctx.lineWidth = 2;
           ctx.strokeRect(x, y, w, h);
           ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
           ctx.fillRect(x, y, w, h);
        }
      });

      // Search Highlight
      if (highlightedIndex !== null && highlightedIndex < capacity) {
          const i = highlightedIndex;
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = Math.floor(col * (cellW + gap));
          const y = Math.floor(row * (cellH + gap));
          const w = Math.floor(cellW);
          const h = Math.floor(cellH);
          
          const pulse = (Math.sin(time / 200) + 1) / 2; 

          ctx.strokeStyle = '#fbbf24'; 
          ctx.lineWidth = 2;
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 8 * pulse;
          ctx.strokeRect(x, y, w, h);
          ctx.shadowBlur = 0; 

          ctx.fillStyle = `rgba(251, 191, 36, ${0.2 + pulse * 0.2})`;
          ctx.fillRect(x, y, w, h);
      }

      // Implosion Animations
      const activeAnims = flushedAnims.filter(a => time - a.startTime < 500);
      activeAnims.forEach(anim => {
          const elapsed = time - anim.startTime;
          const i = anim.index;
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = col * (cellW + gap) + cellW / 2;
          const y = row * (cellH + gap) + cellH / 2;
          
          const radius = (elapsed / 500) * (cellW * 2);
          const alpha = 1 - (elapsed / 500);
          
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [slots, capacity, flushedAnims, highlightedIndex, selectedSlots, latencies, writeMagnitudes, isOptimizing]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { cols, cellW, cellH, gap } = layoutRef.current;
    if (cols === 0) return;

    const rect = containerRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.floor(x / (cellW + gap));
    const row = Math.floor(y / (cellH + gap));
    const index = row * cols + col;

    if (index >= 0 && index < slots.length) {
      setTooltip({
        x: e.clientX,
        y: e.clientY,
        index,
        value: slots[index],
        latency: latencies[index] || 0,
        magnitude: writeMagnitudes[index] || 0
      });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => setTooltip(null);

  const handleClick = (e: React.MouseEvent) => {
      let targetIndex = -1;
      if (tooltip) {
          targetIndex = tooltip.index;
      } else {
          const { cols, cellW, cellH, gap } = layoutRef.current;
          if (cols === 0) return;
          const rect = containerRef.current!.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const col = Math.floor(x / (cellW + gap));
          const row = Math.floor(y / (cellH + gap));
          targetIndex = row * cols + col;
      }

      if (targetIndex >= 0 && targetIndex < slots.length) {
          if (e.shiftKey) {
              const newSet = new Set(selectedSlots);
              if (newSet.has(targetIndex)) newSet.delete(targetIndex);
              else newSet.add(targetIndex);
              setSelectedSlots(newSet);
          } else {
              setSelectedSlots(new Set([targetIndex]));
          }
          setTooltip(null); 
      }
  };

  const handleFlush = () => {
      if (selectedSlots.size === 0 || !onResetSlots) return;
      const indices = Array.from(selectedSlots);
      const now = performance.now();
      const newAnims = indices.map(idx => ({ index: idx, startTime: now }));
      setFlushedAnims(prev => [...prev, ...newAnims].slice(-50)); 
      onResetSlots(indices);
      setSelectedSlots(new Set()); 
  };
  
  const handleOptimize = () => {
      if (!onResetSlots || isOptimizing) return;
      const idleIndices = slots.map((u, i) => u <= 0.05 ? i : -1).filter(i => i !== -1);
      if (idleIndices.length === 0) return;
      setIsOptimizing(true);
      setTimeout(() => {
          onResetSlots(idleIndices);
          setIsOptimizing(false);
          const now = performance.now();
          const subset = idleIndices.slice(0, 100); 
          const newAnims = subset.map(idx => ({ index: idx, startTime: now }));
          setFlushedAnims(prev => [...prev, ...newAnims].slice(-100));
      }, 800);
  };

  const clearSelection = () => setSelectedSlots(new Set());

  const usedSlots = slots.filter(u => u > 0.01).length;
  const idleSlots = capacity - usedSlots;
  const usagePercent = capacity > 0 ? (usedSlots / capacity) * 100 : 0;
  const fragmentation = capacity > 0 ? (idleSlots / capacity) * 100 : 0;
  const singleSelectedSlot: number | null = selectedSlots.size === 1 ? (Array.from(selectedSlots)[0] as number) : null;

  return (
    <div className="w-full h-full bg-slate-900 border border-slate-700 rounded-lg p-4 relative flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-slate-400 text-xs font-bold">PMM_MEMORY_MATRIX</h3>
        {/* Legend with Tooltips */}
        <div className="flex gap-3 text-[10px] font-mono">
           <div className="flex items-center gap-1 cursor-help" title="Usage < 5%">
             <div className="w-2 h-2 bg-slate-800 border border-slate-700"></div>IDLE
           </div>
           <div className="flex items-center gap-1 cursor-help" title="Usage > 5%">
             <div className="w-2 h-2 bg-cyan-800 border border-cyan-700"></div>ACTIVE
           </div>
           <div className="flex items-center gap-1 cursor-help" title="Usage > 40%">
             <div className="w-2 h-2 bg-cyan-400 border border-cyan-300"></div>HIGH
           </div>
           <div className="flex items-center gap-1 cursor-help" title="Write Magnitude Indicator (Split View)">
             <div className="flex h-2 border border-slate-600">
                <div className="w-2 bg-cyan-700"></div>
                <div className="w-1 bg-black"></div>
                <div className="w-1 bg-purple-500"></div>
             </div>
             USAGE|WRITE
           </div>
        </div>
      </div>

      {/* Capacity & Compression Control */}
      <div className="mb-4 flex items-end gap-4">
        <div className="flex-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
                <span>CAPACITY: <span className="text-slate-300">{usedSlots}</span> / {capacity}</span>
                <span className={usagePercent > 85 ? 'text-red-400' : 'text-cyan-400'}>{usagePercent.toFixed(1)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                <div 
                    className={`h-full transition-all duration-500 ease-out ${usagePercent > 85 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]'}`} 
                    style={{ width: `${Math.min(100, usagePercent)}%` }}
                />
            </div>
        </div>
        
        {/* Compression Button */}
        <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-500 font-mono mb-1">FRAGMENTATION: {fragmentation.toFixed(0)}%</span>
            <button 
                onClick={handleOptimize}
                disabled={isOptimizing || fragmentation < 1}
                className="flex items-center gap-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors group"
                title="Compress unused slots"
            >
                <Minimize2 className={`w-3 h-3 ${isOptimizing ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
                {isOptimizing ? 'COMPRESSING...' : 'COMPRESS'}
            </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-3 group">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
          <input 
             type="text" 
             value={searchQuery}
             onChange={handleSearch}
             placeholder="Locate Address (e.g. 0x00A1 or 128)"
             className="w-full bg-slate-950 border border-slate-800 rounded pl-9 pr-16 py-1.5 text-xs font-mono text-cyan-400 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors shadow-inner"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono">
             {highlightedIndex !== null ? (
                <span className="text-green-500 font-bold px-1 bg-green-900/20 rounded">FOUND</span>
             ) : searchQuery && (
                <span className="text-red-500 font-bold px-1 bg-red-900/20 rounded">INVALID</span>
             )}
          </div>
      </div>
      
      <div 
        ref={containerRef} 
        className="flex-1 cursor-crosshair relative overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <canvas ref={canvasRef} className="block" />
      </div>

      {/* Hover Tooltip */}
      {tooltip && selectedSlots.size === 0 && (
        <div 
            className="fixed z-50 bg-slate-950/90 backdrop-blur-md border border-cyan-500/50 rounded-lg p-5 shadow-[0_0_30px_rgba(6,182,212,0.2)] pointer-events-none min-w-[220px] animate-in fade-in zoom-in duration-150"
            style={{ 
                left: tooltip.x + 20, 
                top: tooltip.y + 20,
            }}
        >
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center mb-1">
               <span className="text-[10px] text-cyan-600 font-bold tracking-widest uppercase">ADDR</span>
               {(() => {
                 const status = getStatus(tooltip.value, tooltip.latency);
                 return (
                   <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${status.bg} ${status.color} border ${status.border}`}>
                      {status.label}
                   </span>
                 );
               })()}
            </div>
            {/* STRICT HEX FORMATTING: 0x#### */}
            <div className="text-3xl font-mono text-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                0x{tooltip.index.toString(16).toUpperCase().padStart(4, '0')}
            </div>
            <div className="flex justify-between items-end mt-2 border-t border-slate-800 pt-2">
                 <span className="text-slate-500 text-xs font-mono">ID: {tooltip.index}</span>
                 <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">LOAD</span>
                    <span className={`font-mono font-bold text-lg ${tooltip.value > 0.8 ? 'text-red-400' : 'text-slate-200'}`}>
                        {(tooltip.value * 100).toFixed(1)}%
                    </span>
                 </div>
            </div>
            
            {/* Latency Mini Bar in Tooltip */}
            <div className="mt-2 flex items-center gap-2">
                <Activity className="w-3 h-3 text-slate-500" />
                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${tooltip.latency > 50 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${Math.min(100, tooltip.latency)}%` }} 
                    />
                </div>
                <span className={`text-[10px] font-mono ${tooltip.latency > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {tooltip.latency.toFixed(0)}ms
                </span>
            </div>
            
            {/* Write Magnitude Mini Bar in Tooltip */}
            <div className="mt-1 flex items-center gap-2">
                <PenTool className="w-3 h-3 text-slate-500" />
                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-purple-500" 
                        style={{ width: `${Math.min(100, tooltip.magnitude * 100)}%` }} 
                    />
                </div>
                <span className="text-[10px] font-mono text-purple-400">
                    {(tooltip.magnitude * 100).toFixed(0)}%
                </span>
            </div>

            <div className="mt-2 text-[10px] text-center text-slate-600 bg-slate-900/50 rounded py-1">
                CLICK TO DECODE • SHIFT+CLICK TO ADD
            </div>
          </div>
        </div>
      )}

      {/* Memory Reader Module (Single Selection) */}
      {singleSelectedSlot !== null && slots[singleSelectedSlot] !== undefined && (
          <MemoryReader 
             index={singleSelectedSlot}
             usage={slots[singleSelectedSlot]}
             latency={latencies[singleSelectedSlot] || 0}
             writeMagnitude={writeMagnitudes[singleSelectedSlot] || 0}
             status={getStatus(slots[singleSelectedSlot], latencies[singleSelectedSlot] || 0)}
             onClose={clearSelection}
             onFlush={handleFlush}
          />
      )}

      {/* Bulk Action Bar (Multiple Selections) */}
      {selectedSlots.size > 1 && (
          <div className="absolute bottom-4 left-4 right-4 z-40 bg-indigo-900/90 backdrop-blur border border-indigo-500 rounded-xl p-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-300">
                      <Layers className="w-6 h-6" />
                  </div>
                  <div>
                      <div className="text-indigo-200 font-bold text-lg leading-none">{selectedSlots.size}</div>
                      <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Slots Selected</div>
                  </div>
              </div>
              
              <div className="flex gap-3">
                  <button 
                    onClick={clearSelection}
                    className="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold tracking-wider transition-colors"
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={handleFlush}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold tracking-wider rounded shadow-lg shadow-red-900/20 flex items-center gap-2 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    FLUSH SELECTION
                  </button>
              </div>
          </div>
      )}

    </div>
  );
};