import React from 'react';
import { Link } from 'react-router-dom';
import { Player } from '../types';

interface LineupCardProps {
  teamName: string;
  teamYear: number;
  players: Player[];
}

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="inset px-2 py-1.5 text-center">
    <p className="num text-sm font-semibold text-ink">{value}</p>
    <p className="text-[10px] uppercase tracking-wider text-ink-3">{label}</p>
  </div>
);

export const LineupCard: React.FC<LineupCardProps> = ({ teamName, teamYear, players }) => {
  if (!players || players.length === 0) {
    return <div className="panel p-5 text-center text-sm text-ink-3">Loading lineup…</div>;
  }

  return (
    <div className="panel p-5">
      <div className="mb-4 border-b border-line pb-3">
        <h2 className="display text-xl">{teamName}</h2>
        <p className="num text-sm text-ink-3">{teamYear}</p>
      </div>

      <div className="space-y-3">
        {players.map((player) => (
          <div key={player.id} className="space-y-2 border-b border-line pb-3 last:border-b-0 last:pb-0">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Link
                  to={`/player/${player.id}`}
                  className="block truncate rounded font-heading text-sm font-medium text-ink transition-colors hover:text-accent"
                >
                  {player.name}
                </Link>
                <p className="text-xs uppercase tracking-wider text-ink-3">{player.position}</p>
              </div>
              <p className="num flex-shrink-0 text-lg font-semibold text-ink">
                {player.overallRating}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <Stat label="Attack" value={player.attackRating} />
              <Stat label="Defence" value={player.defenceRating} />
              <Stat label="Stamina" value={player.stamina} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
