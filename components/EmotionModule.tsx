
import React from 'react';
import { Heart, Zap, Crown } from 'lucide-react';
import { EmotionVector } from '../types';

interface EmotionModuleProps {
  emotion: EmotionVector;
  onManualOverride?: (type: 'valence' | 'arousal' | 'dominance', value: number) => void;
}

// Helper to map -1..1 to 0..100 for progress bars
const toPercent = (val: number) => ((val + 1) / 2) * 100;

const EmotionBar: React.FC<{ 
  label: string; 
  value: number; 
  color: string; 
  icon: React.ReactNode;
  descLow: string;
  descHigh: string;
  onChange?: (val: number) => void;
}> = ({ label, value, color, icon, descLow, descHigh, onChange }) => {
  const percent = toPercent(value);
  
  return (
    <div className="space-y-1 group relative">
      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase">
        <div className="flex items-center gap-1">
          {icon} {label}
        </div>
        <span className="text-slate-300 group-hover:text-cyan-400 transition-colors">{value.toFixed(2)}</span>
      </div>
      
      <div className="relative h-2 w-full">
        {/* Visual Bar */}
        <div className="absolute inset-0 bg-slate-800 rounded-full overflow-hidden border border-slate-700 pointer-events-none">
           {/* Center Marker */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-600 z-10"></div>
          <div 
            className={`h-full transition-all duration-500 ${color}`}
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Interaction Layer */}
        {onChange && (
            <input 
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                title={`Adjust ${label}`}
            />
        )}
      </div>

      <div className="flex justify-between text-[9px] text-slate-600 font-mono uppercase">
        <span>{descLow}</span>
        <span>{descHigh}</span>
      </div>
    </div>
  );
};

const getMoodLabel = (e: EmotionVector) => {
    if (e.arousal > 0.6 && e.valence < -0.2) return "PANIC / STRESS";
    if (e.arousal > 0.5 && e.valence > 0.5) return "EUPHORIC";
    if (e.valence > 0.6 && e.arousal < 0.0) return "CONTENT";
    if (e.valence < -0.6) return "DEPRESSED";
    if (e.dominance > 0.7) return "CONFIDENT";
    if (e.arousal < -0.6) return "LETHARGIC";
    return "NEUTRAL / OBSERVING";
};

export const EmotionModule: React.FC<EmotionModuleProps> = ({ emotion, onManualOverride }) => {
  const mood = getMoodLabel(emotion);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
        <h2 className="text-sm font-bold text-pink-400 tracking-wider flex items-center gap-2">
            <Heart className="w-4 h-4" />
            EMOTION_ENGINE
        </h2>
        <div className="text-[10px] font-mono bg-slate-800 px-2 py-1 rounded text-cyan-300 border border-cyan-900/50 animate-pulse">
            STATE: {mood}
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <EmotionBar 
            label="Valence" 
            value={emotion.valence} 
            color="bg-gradient-to-r from-red-500 via-slate-500 to-green-500"
            icon={<Heart className="w-3 h-3" />}
            descLow="Negative"
            descHigh="Positive"
            onChange={onManualOverride ? (val) => onManualOverride('valence', val) : undefined}
        />
        <EmotionBar 
            label="Arousal" 
            value={emotion.arousal} 
            color="bg-gradient-to-r from-blue-500 via-slate-500 to-yellow-500"
            icon={<Zap className="w-3 h-3" />}
            descLow="Calm"
            descHigh="Excited"
            onChange={onManualOverride ? (val) => onManualOverride('arousal', val) : undefined}
        />
        <EmotionBar 
            label="Dominance" 
            value={emotion.dominance} 
            color="bg-gradient-to-r from-slate-600 via-purple-500 to-purple-400"
            icon={<Crown className="w-3 h-3" />}
            descLow="Submissive"
            descHigh="Dominant"
            onChange={onManualOverride ? (val) => onManualOverride('dominance', val) : undefined}
        />
      </div>
      
      {/* 3D Vector Visualization (Simulated) */}
      <div className="mt-auto pt-2 relative">
          <div className="p-2 bg-black/50 rounded border border-slate-800 flex items-center justify-center h-24 relative overflow-hidden">
              {/* Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-20 pointer-events-none">
                  <div className="border-r border-b border-slate-600"></div>
                  <div className="border-b border-slate-600"></div>
                  <div className="border-r border-slate-600"></div>
                  <div></div>
              </div>
              
              {/* Center Crosshair */}
              <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-700/50"></div>
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-700/50"></div>

              {/* Axis Labels */}
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] text-slate-500 font-mono opacity-60">NEG</span>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-slate-500 font-mono opacity-60">POS</span>
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-slate-500 font-mono opacity-60">VALENCE (X)</span>
              
              <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] text-slate-500 font-mono opacity-60">HIGH</span>
              <span className="absolute top-1/2 right-2 rotate-90 text-[8px] text-slate-500 font-mono opacity-60 origin-right translate-x-full">AROUSAL (Y)</span>

              {/* Data Point */}
              <div 
                className="w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.8)] transition-all duration-500 absolute border border-white/50"
                style={{
                    left: `${toPercent(emotion.valence)}%`,
                    top: `${100 - toPercent(emotion.arousal)}%`,
                    transform: `scale(${1 + (emotion.dominance + 1)}) translate(-50%, -50%)` 
                }}
              />
          </div>
          
          {/* Legend */}
          <div className="flex justify-between items-center px-1 mt-1">
             <span className="text-[9px] text-slate-600 font-mono">V/A PLOT</span>
             <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
                <span className="text-[9px] text-slate-500 font-mono">SIZE = DOMINANCE</span>
             </div>
          </div>
      </div>
    </div>
  );
};
