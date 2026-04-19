import React from 'react';
import { Player } from '../types';

interface LineupProps {
  teamName: string;
  teamYear: number;
  players: Player[];
}

export const Lineup: React.FC<LineupProps> = ({ teamName, teamYear, players }) => {
  if (!players || players.length === 0) {
    return <div>Loading lineup...</div>;
  }

  return (
    <div style={{ marginBottom: '30px' }}>
      <h3>{teamName} ({teamYear})</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              Name
            </th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              Position
            </th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              Overall
            </th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              Attack
            </th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              Defence
            </th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.id}>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{player.name}</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{player.position}</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{player.overallRating}</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{player.attackRating}</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{player.defenceRating}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
