import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, AlertCircle, Info } from 'lucide-react';
import { BrainConfig } from '../types';

interface ConfigPanelProps {
  config: BrainConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newConfig: BrainConfig) => void;
}

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-slate-800 border border-cyan-900/50 rounded shadow-xl text-[10px] leading-relaxed text-slate-300 z-20 hidden group-hover:block animate-in fade-in zoom-in duration-150 pointer-events-none">
    {text}
    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-800" />
  </div>
);

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, isOpen, onClose, onSave }) => {
  const [localConfig, setLocalConfig] = useState<BrainConfig>(config);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
      setError(null);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleChange = (key: keyof BrainConfig, value: string) => {
    const numValue = parseFloat(value);
    setLocalConfig(prev => ({
      ...prev,
      [key]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const handleSave = () => {
    // Validation
    if (localConfig.startMemSlots > localConfig.maxMemSlots) {
      setError("Start Memory cannot be greater than Max Memory.");
      return;
    }
    if (localConfig.expansionThreshold < 0.1 || localConfig.expansionThreshold > 0.99) {
      setError("Threshold must be between 0.1 and 0.99.");
      return;
    }
    if (localConfig.startMemSlots < 1) {
      setError("Memory slots must be positive.");
      return;
    }

    onSave(localConfig);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950/50">
          <h2 className="text-cyan-400 font-bold text-lg tracking-wide flex items-center gap-2">
            SYSTEM_CONFIGURATION
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Start Memory */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Start Memory Slots
                </label>
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-slate-600 hover:text-cyan-400 cursor-help transition-colors" />
                  <Tooltip text="Initial capacity (INT) of the PMM module on system boot. Defines the number of memory slots available before any expansion occurs." />
                </div>
              </div>
              <span className="text-slate-600 font-mono text-[10px]">INT</span>
            </div>
            <input 
              type="number" 
              value={localConfig.startMemSlots}
              onChange={(e) => handleChange('startMemSlots', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Max Memory */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Max Memory Ceiling
                </label>
                 <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-slate-600 hover:text-cyan-400 cursor-help transition-colors" />
                  <Tooltip text="The absolute hardware limit (INT) for memory expansion. The system will not allocate more slots than this, even if pressure is critical." />
                </div>
              </div>
              <span className="text-slate-600 font-mono text-[10px]">INT</span>
            </div>
            <input 
              type="number" 
              value={localConfig.maxMemSlots}
              onChange={(e) => handleChange('maxMemSlots', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Threshold */}
          <div className="space-y-2">
             <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Expansion Threshold
                </label>
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-slate-600 hover:text-cyan-400 cursor-help transition-colors" />
                  <Tooltip text="The pressure percentage (FLOAT 0.0-1.0) that triggers an automatic hot-swap expansion. Lower values trigger expansion sooner." />
                </div>
              </div>
              <span className="text-slate-600 font-mono text-[10px]">FLOAT</span>
            </div>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="0.1" 
                max="0.99" 
                step="0.01"
                value={localConfig.expansionThreshold}
                onChange={(e) => handleChange('expansionThreshold', e.target.value)}
                className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <span className="text-cyan-400 font-mono font-bold w-12 text-right">
                {(localConfig.expansionThreshold * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-900/20 p-3 rounded border border-red-500/30">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="text-xs text-yellow-600/80 bg-yellow-900/10 p-3 rounded border border-yellow-700/20 flex gap-2">
            <RotateCcw className="w-4 h-4 shrink-0" />
            Saving will restart the simulation and flush all current memory.
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-slate-200 text-xs font-bold tracking-wider transition-colors"
          >
            CANCEL
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold tracking-wider rounded flex items-center gap-2 transition-colors shadow-lg shadow-cyan-900/20"
          >
            <Save className="w-4 h-4" />
            APPLY CONFIG
          </button>
        </div>
      </div>
    </div>
  );
};