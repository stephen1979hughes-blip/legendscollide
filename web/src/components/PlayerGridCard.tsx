import React from 'react';
import { Link } from 'react-router-dom';
import { Player } from '../types';

export const PlayerGridCard: React.FC<{ player: Player }> = ({ player }) => (
  <Link to={`/player/${player.id}`} className="card-link flex items-center gap-3 p-4">
    <span className="num inset flex h-11 w-11 flex-shrink-0 items-center justify-center text-base font-semibold text-ink">
      {player.overallRating}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate font-heading text-sm font-medium text-ink">{player.name}</span>
      <span className="mt-0.5 block text-xs uppercase tracking-wider text-ink-3">
        {player.position}
      </span>
    </span>
  </Link>
);
