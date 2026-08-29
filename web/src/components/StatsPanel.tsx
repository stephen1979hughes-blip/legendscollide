import React from 'react';
import { MatchStats } from '../types';

interface StatsPanelProps {
  stats: MatchStats;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  const statRows = [
    { label: 'Shots', a: stats.shotsA, b: stats.shotsB },
    { label: 'On Target', a: stats.shotsOnTargetA, b: stats.shotsOnTargetB },
    { label: 'Possession', a: `${stats.possessionA}%`, b: `${stats.possessionB}%` },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-md">
      <h3 className="text-lg font-bold text-white mb-4">Match Stats</h3>
      <div className="space-y-3">
        {statRows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{row.a}</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-xs text-white/70 font-bold">{row.label}</p>
            </div>
            <div className="flex-1 text-right">
              <p className="text-sm font-semibold text-white">{row.b}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
