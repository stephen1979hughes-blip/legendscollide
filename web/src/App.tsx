import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { TeamSelector } from './components/TeamSelector';
import { MatchResultComponent } from './components/MatchResult';
import { Lineup } from './components/Lineup';
import { TeamSummary, Team, MatchResult } from './types';

type View = 'selector' | 'result';

function App() {
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [teamAData, setTeamAData] = useState<Team | null>(null);
  const [teamBData, setTeamBData] = useState<Team | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [view, setView] = useState<View>('selector');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getTeams()
      .then(setTeams)
      .catch(err => setError('Failed to load teams: ' + err.message));
  }, []);

  const handleTeamAChange = async (id: string) => {
    setTeamAId(id);
    if (id) {
      try {
        const team = await api.getTeam(id);
        setTeamAData(team);
      } catch (err) {
        setError('Failed to load team A');
      }
    } else {
      setTeamAData(null);
    }
  };

  const handleTeamBChange = async (id: string) => {
    setTeamBId(id);
    if (id) {
      try {
        const team = await api.getTeam(id);
        setTeamBData(team);
      } catch (err) {
        setError('Failed to load team B');
      }
    } else {
      setTeamBData(null);
    }
  };

  const handleSimulate = async () => {
    if (!teamAId || !teamBId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.simulateMatch(teamAId, teamBId, false);
      setMatchResult(result);
      setView('result');
    } catch (err) {
      setError('Failed to simulate match: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSelector = () => {
    setView('selector');
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      {error && (
        <div style={{
          backgroundColor: '#fee',
          color: '#c00',
          padding: '15px',
          marginBottom: '20px',
          borderRadius: '5px'
        }}>
          {error}
        </div>
      )}

      {view === 'selector' ? (
        <div>
          <TeamSelector
            teams={teams}
            teamAId={teamAId}
            teamBId={teamBId}
            onTeamAChange={handleTeamAChange}
            onTeamBChange={handleTeamBChange}
            onSimulate={handleSimulate}
            isLoading={isLoading}
          />

          {teamAData && teamBData && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', padding: '20px' }}>
              <Lineup
                teamName={teamAData.name}
                teamYear={teamAData.year}
                players={teamAData.players}
              />
              <Lineup
                teamName={teamBData.name}
                teamYear={teamBData.year}
                players={teamBData.players}
              />
            </div>
          )}
        </div>
      ) : (
        <div>
          {matchResult && (
            <div>
              <MatchResultComponent
                result={matchResult}
                teamAName={teamAData?.name || 'Team A'}
                teamBName={teamBData?.name || 'Team B'}
              />

              <div style={{ padding: '20px', textAlign: 'center' }}>
                <button
                  onClick={handleBackToSelector}
                  style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  ← Back to Team Selection
                </button>
              </div>

              {teamAData && teamBData && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', padding: '20px' }}>
                  <Lineup
                    teamName={teamAData.name}
                    teamYear={teamAData.year}
                    players={teamAData.players}
                  />
                  <Lineup
                    teamName={teamBData.name}
                    teamYear={teamBData.year}
                    players={teamBData.players}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
