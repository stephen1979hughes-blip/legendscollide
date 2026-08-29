import React from 'react';
import { Link } from 'react-router-dom';
import { Player } from '../types';

interface LineupCardProps {
  teamName: string;
  teamYear: number;
  players: Player[];
}

export const LineupCard: React.FC<LineupCardProps> = ({
  teamName,
  teamYear,
  players,
}) => {
  if (!players || players.length === 0) {
    return <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-md text-center text-white/70">Loading lineup...</div>;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-md">
      <div className="border-b border-white/10 pb-3 mb-4">
        <h2 className="text-xl font-bold text-white">{teamName}</h2>
        <p className="text-sm text-white/70">{teamYear}</p>
      </div>

      <div className="space-y-3">
        {players.map((player) => (
          <div key={player.id} className="border-b border-white/10 pb-3 last:border-b-0">
            <div className="flex items-center justify-between mb-2">
              <div>
                <Link
                  to={`/player/${player.id}`}
                  className="font-semibold text-white hover:text-primary transition"
                >
                  {player.name}
                </Link>
                <p className="text-xs text-white/60">{player.position}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-white text-lg">{player.overallRating}</p>
                <p className="text-xs text-white/60">Overall</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white/10 rounded p-2">
                <p className="font-semibold text-white">{player.attackRating}</p>
                <p className="text-white/60 text-xs">Attack</p>
              </div>
              <div className="bg-white/10 rounded p-2">
                <p className="font-semibold text-white">{player.defenceRating}</p>
                <p className="text-white/60 text-xs">Defence</p>
              </div>
              <div className="bg-white/10 rounded p-2">
                <p className="font-semibold text-white">{player.stamina}</p>
                <p className="text-white/60 text-xs">Stamina</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
