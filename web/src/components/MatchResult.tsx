import React from 'react';
import { MatchResult } from '../types';

interface MatchResultProps {
  result: MatchResult;
  teamAName: string;
  teamBName: string;
}

export const MatchResultComponent: React.FC<MatchResultProps> = ({
  result,
  teamAName,
  teamBName
}) => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>{result.stadiumName}, {result.kickOffTime}</h2>

      {result.eraFlavour && (
        <p style={{ fontStyle: 'italic', color: '#666' }}>{result.eraFlavour}</p>
      )}

      <div style={{
        fontSize: '48px',
        fontWeight: 'bold',
        textAlign: 'center',
        margin: '30px 0',
        backgroundColor: '#f9f9f9',
        padding: '20px'
      }}>
        <span>{teamAName}</span>
        <span style={{ margin: '0 30px' }}>{result.scoreA} - {result.scoreB}</span>
        <span>{teamBName}</span>
      </div>

      <div style={{ marginBottom: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h4>Statistics</h4>
          <p>Possession: {result.stats.possessionA}%</p>
          <p>Shots: {result.stats.shotsA}</p>
          <p>Shots on Target: {result.stats.shotsOnTargetA}</p>
        </div>
        <div>
          <h4>Statistics</h4>
          <p>Possession: {result.stats.possessionB}%</p>
          <p>Shots: {result.stats.shotsB}</p>
          <p>Shots on Target: {result.stats.shotsOnTargetB}</p>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h4>Man of the Match</h4>
        <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{result.manOfTheMatch}</p>
      </div>

      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '20px',
        borderRadius: '5px',
        maxHeight: '300px',
        overflowY: 'auto'
      }}>
        <h4>Commentary</h4>
        {result.commentary.map((comment, idx) => (
          <p key={idx} style={{ margin: '8px 0', lineHeight: '1.6' }}>
            {comment}
          </p>
        ))}
      </div>
    </div>
  );
};
