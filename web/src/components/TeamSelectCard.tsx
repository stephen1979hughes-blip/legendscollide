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
    `${t.name} ${t.year}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-md hover:shadow-lg transition-shadow duration-200 animate-fadeIn">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">{label}</h3>
        <div className="h-0.5 w-12 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
      </div>

      <input
        type="text"
        placeholder="Search teams or years..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/50 text-sm font-body focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 mb-4"
      />

      {selectedTeam && (
        <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-white shadow-md">
          <p className="font-semibold tracking-wide">{selectedTeam.name}</p>
          <p className="text-xs text-white/80 mt-1">
            <span className="inline-block bg-white/20 px-2 py-1 rounded text-xs font-semibold">
              {selectedTeam.year}
            </span>
          </p>
        </div>
      )}

      {searchTerm && (
        <div className="max-h-64 overflow-y-auto space-y-2">
          {filtered.length > 0 ? (
            filtered.map((team) => (
              <button
                key={team.id}
                onClick={() => {
                  onSelect(team);
                  setSearchTerm('');
                }}
                className="w-full text-left px-4 py-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all duration-150 font-body group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm group-hover:text-primary transition-colors">{team.name}</p>
                    <p className="text-xs text-white/60 mt-0.5">{team.year}</p>
                  </div>
                  <span className="text-white/30 group-hover:text-primary transition-colors">→</span>
                </div>
              </button>
            ))
          ) : (
            <p className="text-center text-white/50 text-sm py-4">No teams found</p>
          )}
        </div>
      )}
    </div>
  );
};
