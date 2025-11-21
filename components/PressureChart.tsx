import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PressureChartProps {
  data: { tick: number; pressure: number }[];
  threshold: number;
}

export const PressureChart: React.FC<PressureChartProps> = ({ data, threshold }) => {
  return (
    <div className="w-full h-48 bg-slate-900 border border-slate-700 p-2 rounded-lg">
      <h3 className="text-slate-400 text-xs font-bold mb-2 ml-2">MEMORY_PRESSURE_OVER_TIME</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="tick" hide />
          <YAxis domain={[0, 1]} hide />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
            itemStyle={{ color: '#22d3ee' }}
            formatter={(value: number) => [(value * 100).toFixed(1) + '%', 'Pressure']}
          />
          <ReferenceLine y={threshold} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top',  value: 'EXPANSION_THRESHOLD', fill: '#ef4444', fontSize: 10 }} />
          <Line 
            type="monotone" 
            dataKey="pressure" 
            stroke="#22d3ee" 
            strokeWidth={2} 
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};