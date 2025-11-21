import React, { useState, useEffect, useCallback } from 'react';
import { Brain, Zap, Play, Pause, RefreshCw, AlertTriangle, Plus, Maximize, Settings } from 'lucide-react';
import { DEFAULT_CONFIG, SimulationState, BrainConfig } from './types';
import { generateInitialState, processTick } from './services/simulationService';
import { MemoryGrid } from './components/MemoryGrid';
import { PressureChart } from './components/PressureChart';
import { SystemLogs } from './components/SystemLogs';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import { ConfigPanel } from './components/ConfigPanel';

const App: React.FC = () => {
  const [config, setConfig] = useState<BrainConfig>(DEFAULT_CONFIG);
  const [gameState, setGameState] = useState<SimulationState>(generateInitialState(DEFAULT_CONFIG));
  const [isRunning, setIsRunning] = useState(false);
  const [forceFlood, setForceFlood] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const tick = useCallback(() => {
    setGameState(prev => processTick(prev, config, forceFlood));
  }, [config, forceFlood]);

  // Auto-run effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(tick, 500); // 2 ticks per second for demo visibility
    }
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  const handleReset = () => {
    setGameState(generateInitialState(config));
    setIsRunning(false);
    setForceFlood(false);
  };

  const toggleFlood = () => {
    setForceFlood(prev => !prev);
  };

  const handleResetSlots = (indices: number[]) => {
    setGameState(prev => {
      const newSlots = [...prev.memorySlots];
      let flushedCount = 0;
      
      indices.forEach(index => {
        if (index >= 0 && index < newSlots.length) {
          newSlots[index] = 0; // Flush the memory slot
          flushedCount++;
        }
      });

      if (flushedCount === 0) return prev;

      // Add a log for the manual action
      const logMsg = indices.length === 1 
        ? `[MANUAL] Flushed memory slot 0x${indices[0].toString(16).toUpperCase().padStart(4, '0')}`
        : `[MANUAL] Bulk flushed ${flushedCount} memory slots`;

      const newLogs = [...prev.logs, logMsg];
      if (newLogs.length > 20) newLogs.shift();

      return { ...prev, memorySlots: newSlots, logs: newLogs };
    });
  };

  const handleManualExpand = () => {
    setGameState(prev => {
      if (prev.memoryCapacity >= config.maxMemSlots) return prev;

      const newCapacity = prev.memoryCapacity * 2;
      const newLogs = [...prev.logs];
      
      newLogs.push(`[MANUAL] Override: Force Expansion Triggered.`);
      newLogs.push(`[SYSTEM] Hot-swap complete. New Capacity: ${newCapacity} slots.`);
      
      // Trim logs if needed
      while (newLogs.length > 20) newLogs.shift();

      // Resize slots array
      const newSlots = [...prev.memorySlots];
      const expansionSize = newCapacity - newSlots.length;
      const emptySlots = Array(expansionSize).fill(0);
      newSlots.push(...emptySlots);

      return {
        ...prev,
        memoryCapacity: newCapacity,
        memorySlots: newSlots,
        logs: newLogs,
        isExpanding: true,
      };
    });
  };

  const handleConfigSave = (newConfig: BrainConfig) => {
    setConfig(newConfig);
    setGameState(generateInitialState(newConfig));
    setIsRunning(false);
    setForceFlood(false);
    setIsSettingsOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans relative">
      
      <ConfigPanel 
        config={config} 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSave={handleConfigSave} 
      />

      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400 flex items-center gap-3">
            <Brain className="w-8 h-8" />
            DYNAMIC BRAIN PMM
          </h1>
          <p className="text-slate-500 text-sm font-mono mt-1">
            NEURO-SYMBOLIC ARCHITECTURE // SELF-EXPANDING MEMORY SYSTEM
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-6 font-mono text-xs">
           <div className="flex flex-col items-end">
             <span className="text-slate-500">DEVICE_TARGET</span>
             <span className="text-green-400">NVIDIA_H100_EMULATOR</span>
           </div>
           <div className="w-[1px] h-8 bg-slate-800"></div>
           <div className="flex flex-col items-end">
             <span className="text-slate-500">STATUS</span>
             <span className={isRunning ? "text-green-400 animate-pulse" : "text-yellow-500"}>
               {isRunning ? "RUNNING" : "STANDBY"}
             </span>
           </div>
           <div className="w-[1px] h-8 bg-slate-800"></div>
           <button 
             onClick={() => setIsSettingsOpen(true)}
             className="group flex flex-col items-center justify-center text-slate-400 hover:text-cyan-400 transition-colors"
           >
             <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
             <span className="mt-1 text-[10px]">CONFIG</span>
           </button>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Controls & Logs */}
        <div className="space-y-6">
          
          {/* Controls Panel */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <h2 className="text-sm font-bold text-slate-400 mb-4 tracking-wider">MANUAL_OVERRIDE</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setIsRunning(!isRunning)}
                className={`flex items-center justify-center gap-2 p-3 rounded font-bold text-sm transition-all ${isRunning ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isRunning ? "HALT_SYSTEM" : "INIT_SEQUENCE"}
              </button>

              <button 
                onClick={tick}
                disabled={isRunning}
                className="flex items-center justify-center gap-2 p-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                SINGLE_STEP
              </button>
              
              <button 
                onClick={handleManualExpand}
                disabled={gameState.memoryCapacity >= config.maxMemSlots}
                className="col-span-2 flex items-center justify-center gap-2 p-3 bg-indigo-900/30 hover:bg-indigo-800/40 border border-indigo-500/30 text-indigo-200 rounded font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Maximize className="w-4 h-4" />
                FORCE_EXPANSION
              </button>

              <button 
                onClick={toggleFlood}
                className={`col-span-2 flex items-center justify-center gap-2 p-3 border rounded font-bold text-sm transition-all ${forceFlood ? 'bg-red-900/50 border-red-500 text-red-400 animate-pulse' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}
              >
                <AlertTriangle className="w-4 h-4" />
                {forceFlood ? "STRESS_TEST_ACTIVE (DISENGAGE)" : "SIMULATE_MEMORY_FLOOD"}
              </button>

               <button 
                onClick={handleReset}
                className="col-span-2 flex items-center justify-center gap-2 p-2 text-slate-500 hover:text-slate-300 text-xs uppercase tracking-widest mt-2"
              >
                <RefreshCw className="w-3 h-3" />
                System_Reboot
              </button>
            </div>
          </div>

          {/* Stats Panel */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-4">
            <h2 className="text-sm font-bold text-slate-400 tracking-wider">TELEMETRY</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">MEM_CAPACITY</div>
                <div className="text-2xl font-mono text-cyan-400">{gameState.memoryCapacity}</div>
                <div className="text-xs text-slate-600">SLOTS</div>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                 <div className="text-slate-500 text-[10px]">PRESSURE_INDEX</div>
                 <div className={`text-2xl font-mono ${gameState.currentPressure > config.expansionThreshold ? 'text-red-500' : 'text-green-400'}`}>
                   {(gameState.currentPressure * 100).toFixed(1)}%
                 </div>
                 <div className="text-xs text-slate-600">UTILIZATION</div>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px] mb-1">CURRENT_ACTION_OUTPUT</div>
                <div className="text-xl font-mono text-white tracking-widest">{gameState.lastAction}</div>
            </div>
          </div>

           {/* Logs */}
           <SystemLogs logs={gameState.logs} />

        </div>

        {/* CENTER COLUMN: Architecture Flow */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Visual Diagram */}
          <div className="flex-1 min-h-[400px]">
            <ArchitectureDiagram 
              thoughtVector={gameState.thoughtVector} 
              lastAction={gameState.lastAction}
              pressure={gameState.currentPressure}
            />
          </div>

          {/* Bottom Row: Grid & Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-64">
            <MemoryGrid 
              slots={gameState.memorySlots} 
              capacity={gameState.memoryCapacity} 
              onResetSlots={handleResetSlots}
            />
            <PressureChart data={gameState.pressureHistory} threshold={config.expansionThreshold} />
          </div>
          
        </div>
      </main>
    </div>
  );
};

export default App;