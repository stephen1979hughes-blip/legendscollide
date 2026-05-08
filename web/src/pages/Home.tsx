import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { TeamSelectCard } from '../components/TeamSelectCard';
import { api } from '../services/api';
import { TeamSummary, Team } from '../types';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [teamAId, setTeamAId] = useState<string>('');
  const [teamBId, setTeamBId] = useState<string>('');
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [useAI, setUseAI] = useState(false);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teamsData = await api.getTeams();
        setTeams(teamsData);
      } catch (error) {
        console.error('Failed to load teams:', error);
        setTeams([]);
      }
    };
    loadTeams();
  }, []);

  const handleTeamASelect = async (team: TeamSummary) => {
    try {
      setTeamAId(team.id);
      const fullTeam = await api.getTeam(team.id);
      setTeamA(fullTeam);
    } catch (error) {
      console.error('Failed to load Team A:', error);
      alert(`Failed to load Team A: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTeamBSelect = async (team: TeamSummary) => {
    try {
      setTeamBId(team.id);
      const fullTeam = await api.getTeam(team.id);
      setTeamB(fullTeam);
    } catch (error) {
      console.error('Failed to load Team B:', error);
      alert(`Failed to load Team B: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSimulate = () => {
    if (!teamAId || !teamBId || !teamA || !teamB) return;
    setLoading(true);
    const modeParam = useAI ? '?mode=ai' : '';
    navigate(`/simulate${modeParam}`, {
      state: {
        teamAId,
        teamBId
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-6 pt-12 pb-12 w-full">
        <div className="text-center mb-12">
          <h2 className="text-primary text-4xl font-black tracking-widest mb-2">SELECT YOUR TEAMS</h2>
          <div className="h-1 w-32 bg-gradient-to-r from-primary to-secondary mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <TeamSelectCard
            label="Team A"
            teams={teams}
            selectedTeam={teams.find((t) => t.id === teamAId) || null}
            onSelect={handleTeamASelect}
          />
          <TeamSelectCard
            label="Team B"
            teams={teams}
            selectedTeam={teams.find((t) => t.id === teamBId) || null}
            onSelect={handleTeamBSelect}
          />
        </div>

        <div className="text-center space-y-4">
          {/* AI Mode Toggle */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useAI}
                onChange={(e) => setUseAI(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-text">Use AI-Powered Engine (Claude)</span>
            </label>
          </div>

          <div className="flex items-center justify-center gap-6">
            {!teamAId && <p className="text-secondary font-bold text-sm min-w-[140px] text-left uppercase tracking-wide">Select Team A</p>}
            {teamAId && <div className="min-w-[140px]"></div>}

            <button
              onClick={handleSimulate}
              disabled={!teamAId || !teamBId || loading}
              className={`btn-primary text-lg py-3 px-12 font-black transition uppercase tracking-wider ${
                !teamAId || !teamBId
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              {loading ? '⏳ Starting...' : `▶️ SIMULATE MATCH${useAI ? ' (AI)' : ''}`}
            </button>

            {!teamBId && <p className="text-secondary font-bold text-sm min-w-[140px] text-right uppercase tracking-wide">Select Team B</p>}
            {teamBId && <div className="min-w-[140px]"></div>}
          </div>

          <div className="pt-8 border-t-4 border-primary mt-8">
            <p className="text-muted text-sm mb-4 uppercase tracking-widest font-bold">Or build your own legend</p>
            <button
              onClick={() => navigate('/custom-xi')}
              className="btn-secondary text-lg py-3 px-12 font-black uppercase tracking-wider"
            >
              Build Your All-Time XI
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
