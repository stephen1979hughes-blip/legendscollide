import React, { useState } from 'react';
import { TeamSummary } from '../types';

interface TeamSelectCardProps {
  label: string;
  teams: TeamSummary[];
  selectedTeam: TeamSummary | null;
  onSelect: (team: TeamSummary) => void;
}

export const TeamSelectCard: React.FC<TeamSelectCardProps> = ({
  label,
  teams,
  selectedTeam,
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = teams.filter((t) =>
    `${t.name} ${t.year}`.toLowerCase().includes(searchTerm.toLowerCase()) &&
    t.id !== selectedTeam?.id
  );

  return (
    <div className="card w-full">
      <h3 className="text-2xl font-black text-primary mb-1 tracking-wider">{label}</h3>
      <div className="h-1 w-12 bg-secondary mb-4"></div>

      <input
        type="text"
        placeholder="Search teams or years..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 border-2 border-primary rounded mb-4 text-sm font-body"
        style={{boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.1)'}}
      />

      {selectedTeam && (
        <div className="mb-4 p-3 bg-primary text-white border-3 border-secondary" style={{boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.2)'}}>
          <p className="font-black tracking-wide">{selectedTeam.name}</p>
          <p className="text-sm text-secondary font-bold">{selectedTeam.year}</p>
        </div>
      )}

      <div className="max-h-64 overflow-y-auto space-y-2">
        {filtered.map((team) => (
          <button
            key={team.id}
            onClick={() => onSelect(team)}
            className={`w-full text-left px-3 py-2 border-2 transition font-body ${
              selectedTeam?.id === team.id
                ? 'bg-primary text-white border-secondary'
                : 'bg-white border-primary hover:bg-gray-100'
            }`}
          >
            <p className="font-bold">{team.name}</p>
            <p className="text-xs">{team.year}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
