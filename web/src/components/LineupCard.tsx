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
    return <div className="card text-center text-muted">Loading lineup...</div>;
  }

  return (
    <div className="card">
      <div className="border-b border-gray-200 pb-3 mb-4">
        <h2 className="text-xl font-bold text-primary">{teamName}</h2>
        <p className="text-sm text-muted">{teamYear}</p>
      </div>

      <div className="space-y-3">
        {players.map((player) => (
          <div key={player.id} className="border-b border-gray-100 pb-3 last:border-b-0">
            <div className="flex items-center justify-between mb-2">
              <div>
                <Link
                  to={`/player/${player.id}`}
                  className="font-semibold text-primary hover:text-secondary transition"
                >
                  {player.name}
                </Link>
                <p className="text-xs text-muted">{player.position}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary text-lg">{player.overallRating}</p>
                <p className="text-xs text-muted">Overall</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-background rounded p-2">
                <p className="font-semibold text-primary">{player.attackRating}</p>
                <p className="text-muted text-xs">Attack</p>
              </div>
              <div className="bg-background rounded p-2">
                <p className="font-semibold text-primary">{player.defenceRating}</p>
                <p className="text-muted text-xs">Defence</p>
              </div>
              <div className="bg-background rounded p-2">
                <p className="font-semibold text-primary">{player.stamina}</p>
                <p className="text-muted text-xs">Stamina</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
