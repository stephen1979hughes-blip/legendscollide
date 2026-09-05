import React, { useState } from 'react';
import { Icon } from './Icon';
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
    <div className="card flex flex-col gap-3">
      <p className="eyebrow">{label}</p>

      {selectedTeam ? (
        <div className="inset flex items-center justify-between gap-3 border-accent/50 px-3.5 py-3">
          <span className="display truncate text-lg">{selectedTeam.name}</span>
          <span className="num flex-shrink-0 text-sm font-semibold text-ink-2">
            {selectedTeam.year}
          </span>
        </div>
      ) : (
        <div className="inset flex items-center gap-2 px-3.5 py-3 text-sm text-ink-3">
          <Icon name="search" size={14} />
          No side picked yet
        </div>
      )}

      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3">
          <Icon name="search" size={14} />
        </span>
        <input
          type="text"
          placeholder={selectedTeam ? 'Search to change…' : 'Search teams or years…'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="field pl-9"
        />
      </div>

      {searchTerm && (
        <div className="-mx-1 max-h-64 space-y-1 overflow-y-auto px-1">
          {filtered.length > 0 ? (
            filtered.map((team) => (
              <button
                key={team.id}
                onClick={() => {
                  onSelect(team);
                  setSearchTerm('');
                }}
                className="group flex w-full items-center justify-between gap-3 rounded-ctl border border-transparent px-3 py-2.5 text-left transition-colors duration-150 hover:border-line hover:bg-raised"
              >
                <span className="min-w-0">
                  <span className="block truncate font-heading text-sm font-medium text-ink">
                    {team.name}
                  </span>
                  <span className="num block text-xs text-ink-3">{team.year}</span>
                </span>
                <span className="flex-shrink-0 text-ink-3 transition-colors group-hover:text-accent">
                  <Icon name="right" size={14} />
                </span>
              </button>
            ))
          ) : (
            <p className="px-3 py-4 text-center text-sm text-ink-3">No teams match “{searchTerm}”</p>
          )}
        </div>
      )}
    </div>
  );
};
