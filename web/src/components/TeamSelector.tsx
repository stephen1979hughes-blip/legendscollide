import React from 'react';
import { TeamSummary } from '../types';

interface TeamSelectorProps {
  teams: TeamSummary[];
  teamAId: string;
  teamBId: string;
  onTeamAChange: (id: string) => void;
  onTeamBChange: (id: string) => void;
  onSimulate: () => void;
  isLoading: boolean;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  teams,
  teamAId,
  teamBId,
  onTeamAChange,
  onTeamBChange,
  onSimulate,
  isLoading
}) => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Football Match Simulator</h1>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>
          Team A:
          <select
            value={teamAId}
            onChange={(e) => onTeamAChange(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option key="__select__" value="">Select a team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name} ({team.year})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>
          Team B:
          <select
            value={teamBId}
            onChange={(e) => onTeamBChange(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option key="__select__" value="">Select a team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name} ({team.year})
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        onClick={onSimulate}
        disabled={!teamAId || !teamBId || isLoading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.6 : 1
        }}
      >
        {isLoading ? 'Simulating...' : 'Simulate Match'}
      </button>
    </div>
  );
};
