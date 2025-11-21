import React, { useRef, useEffect, useState } from 'react';
import { Search, X, Trash2, Layers, Activity } from 'lucide-react';

interface MemoryGridProps {
  slots: number[]; // Usage 0-1
  capacity: number;
  onResetSlots?: (indices: number[]) => void;
}

export const MemoryGrid: React.FC<MemoryGridProps> = ({ slots, capacity, onResetSlots }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef({ cols: 0, rows: 0, cellW: 0, cellH: 0, gap: 0 });
  const [tooltip, setTooltip] = useState<{ x: number, y: number, index: number, value: number, latency: number } | null>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  // Selection State (Multi-select)
  const [selectedSlots, setSelectedSlots] = useState<Set<number>>(new Set());

  // Animation state for flushed effect (supports multiple)
  const [flushedAnims, setFlushedAnims] = useState<Array<{ index: number, startTime: number }>>([]);

  // New: Latency State (Simulated in ms, 0-100)
  const [latencies, setLatencies] = useState<number[]>([]);

  // Initialize & Resize Latencies based on Capacity
  useEffect(() => {
    setLatencies(prev => {
      if (prev.length === capacity) return prev;
      // Create new array, preserve old values if expanding, fill new with random base
      const newArr = new Array(capacity).fill(0).map((_, i) => {
         return prev[i] !== undefined ? prev[i] : 10 + Math.random() * 20;
      });
      return newArr;
    });
  }, [capacity]);

  // Simulate Latency Fluctuation (Bus Noise)
  useEffect(() => {
    const interval = setInterval(() => {
      setLatencies(prev => {
        if (prev.length === 0) return prev;
        // Randomly update a subset to save perf vs mapping 2048 items every tick
        const next = [...prev];
        for(let i=0; i < next.length; i++) {
             if (Math.random() > 0.7) {
                 const delta = (Math.random() - 0.5) * 15;
                 next[i] = Math.max(5, Math.min(100, next[i] + delta));
             }
        }
        return next;
      });
    }, 1000);
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

  // Helper to determine status properties
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

      // Handle resize
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }

      // Clear
      ctx.clearRect(0, 0, rect.width, rect.height);

      if (slots.length === 0) return;

      // Grid Logic
      const area = rect.width * rect.height;
      const cellArea = area / capacity;
      const cellSide = Math.sqrt(cellArea);
      
      let cols = Math.floor(rect.width / cellSide);
      let rows = Math.ceil(capacity / cols);

      // Safety adjustments
      if (rows * cellSide > rect.height) {
        cols = Math.ceil(Math.sqrt(capacity * (rect.width / rect.height)));
        rows = Math.ceil(capacity / cols);
      }

      const gap = capacity > 512 ? 0 : 1;
      const cellW = (rect.width - (cols - 1) * gap) / cols;
      const cellH = (rect.height - (rows - 1) * gap) / rows;

      // Update layout ref for mouse interaction
      layoutRef.current = { cols, rows, cellW, cellH, gap };

      slots.forEach((usage, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        const x = col * (cellW + gap);
        const y = row * (cellH + gap);
        const latency = latencies[i] || 0;

        // Color mapping matching getStatus thresholds
        let color = '#1e293b'; // slate-800 (IDLE)
        
        if (usage > 0.8 || latency > 75) color = '#ef4444'; // red-500 (CRITICAL)
        else if (usage > 0.4 || latency > 50) color = '#22d3ee'; // cyan-400 (HIGH)
        else if (usage > 0.05) color = '#155e75'; // cyan-800 (ACTIVE)

        ctx.fillStyle = color;
        ctx.fillRect(x, y, cellW, cellH);

        // Critical threshold border
        if (usage > 0.8 || latency > 75) {
           ctx.strokeStyle = '#fca5a5'; // red-300
           ctx.lineWidth = 1;
           ctx.strokeRect(x, y, cellW, cellH);
        }

        // Selected State Border (Override)
        if (selectedSlots.has(i)) {
           ctx.strokeStyle = '#818cf8'; // Indigo-400
           ctx.lineWidth = 2;
           ctx.strokeRect(x, y, cellW, cellH);
           
           // Subtle overlay
           ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
           ctx.fillRect(x, y, cellW, cellH);
        }
      });

      // Render Highlight if Search Active
      if (highlightedIndex !== null && highlightedIndex < capacity) {
          const i = highlightedIndex;
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = col * (cellW + gap);
          const y = row * (cellH + gap);
          
          // Pulsing effect
          const time = performance.now();
          const pulse = (Math.sin(time / 200) + 1) / 2; // 0 to 1

          ctx.strokeStyle = '#fbbf24'; // amber-400
          ctx.lineWidth = 2;
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 8 * pulse;
          ctx.strokeRect(x, y, cellW, cellH);
          ctx.shadowBlur = 0; // Reset shadow

          ctx.fillStyle = `rgba(251, 191, 36, ${0.2 + pulse * 0.2})`;
          ctx.fillRect(x, y, cellW, cellH);
      }

      // Render Animations (Implosion)
      // Filter out old animations
      const now = performance.now();
      const activeAnims = flushedAnims.filter(a => now - a.startTime < 500);
      
      activeAnims.forEach(anim => {
          const elapsed = now - anim.startTime;
          const i = anim.index;
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = col * (cellW + gap) + cellW / 2;
          const y = row * (cellH + gap) + cellH / 2;
          
          const radius = (elapsed / 500) * (cellW * 2);
          const alpha = 1 - (elapsed / 500);
          
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`; // Cyan dissolve
          ctx.lineWidth = 2;
          ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [slots, capacity, flushedAnims, highlightedIndex, selectedSlots, latencies]);

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
        latency: latencies[index] || 0
      });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const handleClick = (e: React.MouseEvent) => {
      let targetIndex = -1;

      // If clicking via tooltip logic (sometimes easier to hit small cells)
      if (tooltip) {
          targetIndex = tooltip.index;
      } else {
          // Calculate manually
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
              // Multi-select toggle
              const newSet = new Set(selectedSlots);
              if (newSet.has(targetIndex)) {
                  newSet.delete(targetIndex);
              } else {
                  newSet.add(targetIndex);
              }
              setSelectedSlots(newSet);
          } else {
              // Single select (replace)
              setSelectedSlots(new Set([targetIndex]));
          }
          setTooltip(null); // Hide tooltip on click to reduce clutter
      }
  };

  const handleFlush = () => {
      if (selectedSlots.size === 0 || !onResetSlots) return;

      const indices = Array.from(selectedSlots);
      const now = performance.now();
      
      // Trigger Animations
      const newAnims = indices.map(idx => ({ index: idx, startTime: now }));
      setFlushedAnims(prev => [...prev, ...newAnims].slice(-50)); // Keep buffer manageable

      onResetSlots(indices);
      setSelectedSlots(new Set()); // Clear selection after action
  };

  const clearSelection = () => setSelectedSlots(new Set());

  // Calculated Metrics
  const usedSlots = slots.filter(u => u > 0.01).length;
  const usagePercent = capacity > 0 ? (usedSlots / capacity) * 100 : 0;
  
  // Get the single selected slot if only one is selected
  const singleSelectedSlot: number | null = selectedSlots.size === 1 ? (Array.from(selectedSlots)[0] as number) : null;

  return (
    <div className="w-full h-full bg-slate-900 border border-slate-700 rounded-lg p-4 relative flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-slate-400 text-xs font-bold">PMM_MEMORY_MATRIX</h3>
        <div className="flex gap-3 text-[10px] font-mono">
           <div className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-800"></div>IDLE</div>
           <div className="flex items-center gap-1"><div className="w-2 h-2 bg-cyan-800"></div>ACTIVE</div>
           <div className="flex items-center gap-1"><div className="w-2 h-2 bg-cyan-400"></div>HIGH</div>
           <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 border border-red-300"></div>CRITICAL</div>
        </div>
      </div>

      {/* Capacity Bar */}
      <div className="mb-4">
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
            <div className="text-[10px] text-cyan-600 font-bold tracking-widest uppercase mb-1">Memory Address</div>
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

            <div className="mt-2 text-[10px] text-center text-slate-600 bg-slate-900/50 rounded py-1">
                CLICK TO SELECT • SHIFT+CLICK TO ADD
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal (Single Selection) */}
      {singleSelectedSlot !== null && slots[singleSelectedSlot] !== undefined && (
        <div className="absolute bottom-4 right-4 z-40 w-64 bg-slate-900 border border-cyan-500/50 rounded-xl shadow-2xl p-5 overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
             {/* Status Stripe */}
             <div className={`absolute top-0 left-0 w-1 h-full ${getStatus(slots[singleSelectedSlot], latencies[singleSelectedSlot] || 0).bar}`} />

             <button 
               onClick={clearSelection} 
               className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
             >
               <X className="w-5 h-5" />
             </button>

             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Segment Details</h4>
             <div className="text-4xl font-mono font-bold text-white mb-4">
                0x{singleSelectedSlot.toString(16).toUpperCase().padStart(4, '0')}
             </div>

             <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs text-slate-400">Decimal Index</span>
                    <span className="font-mono text-cyan-400">{singleSelectedSlot}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs text-slate-400">Memory Load</span>
                    <span className={`font-mono font-bold ${(slots[singleSelectedSlot] * 100) > 80 ? 'text-red-400' : 'text-white'}`}>
                        {(slots[singleSelectedSlot] * 100).toFixed(2)}%
                    </span>
                </div>
                
                {/* Latency Detail */}
                <div className="flex flex-col gap-1 border-b border-slate-800 pb-2">
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>Access Latency</span>
                        <span className={`font-mono font-bold ${(latencies[singleSelectedSlot] || 0) > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {(latencies[singleSelectedSlot] || 0).toFixed(1)} ms
                        </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                         <div 
                            className={`h-full transition-all ${(latencies[singleSelectedSlot] || 0) > 50 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${Math.min(100, latencies[singleSelectedSlot] || 0)}%` }}
                         />
                    </div>
                </div>

                <div className="flex justify-between items-center pb-2">
                    <span className="text-xs text-slate-400">Status</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${getStatus(slots[singleSelectedSlot], latencies[singleSelectedSlot] || 0).bg} ${getStatus(slots[singleSelectedSlot], latencies[singleSelectedSlot] || 0).color} border ${getStatus(slots[singleSelectedSlot], latencies[singleSelectedSlot] || 0).border}`}>
                        {getStatus(slots[singleSelectedSlot], latencies[singleSelectedSlot] || 0).label}
                    </span>
                </div>
             </div>

             <div className="flex gap-2">
                <button 
                    onClick={handleFlush}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-900/20 hover:bg-red-900/40 border border-red-500/50 text-red-400 py-2 rounded transition-colors text-xs font-bold tracking-wider group"
                >
                    <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    FLUSH
                </button>
             </div>
        </div>
      )}

      {/* Bulk Action Bar (Multiple Selections) */}
      {selectedSlots.size > 1