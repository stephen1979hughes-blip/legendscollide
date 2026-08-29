import React from 'react';
import { Link } from 'react-router-dom';
import { TeamSummary } from '../types';

interface TeamCardProps {
  team: TeamSummary;
}

export const TeamCard: React.FC<TeamCardProps> = ({ team }) => {
  return (
    <Link
      to={`/team/${team.id}`}
      className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-md hover:bg-white/10 transition"
    >
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">{team.name}</h3>
        <p className="text-white/70">{team.year}</p>
      </div>
    </Link>
  );
};
