import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import { TeamSummary } from '../types';

export const TeamCard: React.FC<{ team: TeamSummary }> = ({ team }) => (
  <Link to={`/team/${team.id}`} className="card-link group flex items-center justify-between gap-4">
    <span className="min-w-0">
      <span className="display block truncate text-xl">{team.name}</span>
      <span className="num mt-0.5 block text-sm text-ink-3">{team.year}</span>
    </span>
    <span className="flex-shrink-0 text-ink-3 transition-colors group-hover:text-accent">
      <Icon name="right" size={16} />
    </span>
  </Link>
);
