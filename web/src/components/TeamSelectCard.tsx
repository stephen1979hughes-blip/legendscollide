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
    <div className="card w-full max-w-sm">
      <h3 className="text-lg font-bold text-primary mb-4">{label}</h3>

      <input
        type="text"
        placeholder="Search teams or years..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 border border-muted rounded mb-4 text-sm"
      />

      {selectedTeam && (
        <div className="mb-4 p-3 bg-primary text-white rounded">
          <p className="font-bold">{selectedTeam.name}</p>
          <p className="text-sm text-secondary">{selectedTeam.year}</p>
        </div>
      )}

      <div className="max-h-64 overflow-y-auto space-y-2">
        {filtered.map((team) => (
          <button
            key={team.id}
            onClick={() => onSelect(team)}
            className={`w-full text-left px-3 py-2 rounded transition ${
              selectedTeam?.id === team.id
                ? 'bg-primary text-white'
                : 'bg-background hover:bg-gray-200'
            }`}
          >
            <p className="font-semibold">{team.name}</p>
            <p className="text-xs text-muted">{team.year}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
