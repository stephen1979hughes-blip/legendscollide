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
    <div className="card">
      <h3 className="text-lg font-bold text-primary mb-4">Match Stats</h3>
      <div className="space-y-3">
        {statRows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-text">{row.a}</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-xs text-muted font-bold">{row.label}</p>
            </div>
            <div className="flex-1 text-right">
              <p className="text-sm font-semibold text-text">{row.b}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
