import React from 'react';
import { MatchStats } from '../types';

interface StatsPanelProps {
  stats: MatchStats;
}

/**
 * Each row is a split bar rather than two bare numbers — the shape carries the
 * comparison at a glance and the figures confirm it, instead of the reader
 * having to do the arithmetic.
 */
export const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  const rows = [
    { label: 'Shots', a: stats.shotsA, b: stats.shotsB, suffix: '' },
    { label: 'On target', a: stats.shotsOnTargetA, b: stats.shotsOnTargetB, suffix: '' },
    { label: 'Possession', a: stats.possessionA, b: stats.possessionB, suffix: '%' },
  ];

  return (
    <div className="panel p-5">
      <h3 className="rule-heading mb-4">Match stats</h3>
      <div className="space-y-4">
        {rows.map((row) => {
          const total = row.a + row.b;
          const share = total > 0 ? (row.a / total) * 100 : 50;
          return (
            <div key={row.label} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="num text-sm font-semibold text-ink">
                  {row.a}
                  {row.suffix}
                </span>
                <span className="text-xs uppercase tracking-wider text-ink-3">{row.label}</span>
                <span className="num text-sm font-semibold text-ink">
                  {row.b}
                  {row.suffix}
                </span>
              </div>
              <div className="flex h-1.5 overflow-hidden rounded-full bg-raised">
                <div className="bg-accent" style={{ width: `${share}%` }} />
                <div className="flex-1 bg-line-strong" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
