import React from 'react';
import { Link } from 'react-router-dom';
import { Player } from '../types';

interface PlayerGridCardProps {
  player: Player;
}

export const PlayerGridCard: React.FC<PlayerGridCardProps> = ({ player }) => {
  return (
    <Link
      to={`/player/${player.id}`}
      className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-4 shadow-md hover:bg-white/10 transition relative"
    >
      <div className="text-center">
        <div className="absolute top-2 right-2 text-xs font-semibold text-white/60 bg-white/5 rounded px-2 py-1">
          {player.position}
        </div>
        <div className="mt-6">
          <h3 className="text-white font-semibold truncate">{player.name}</h3>
          <p className="text-4xl font-bold text-white mt-2">{player.overallRating}</p>
          <p className="text-xs text-white/60">Overall</p>
        </div>
      </div>
    </Link>
  );
};
