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

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teamsData = await api.getTeams();
        console.log('Teams loaded:', teamsData);
        setTeams(teamsData);
      } catch (error) {
        console.error('Failed to load teams:', error);
        setTeams([]);
      }
    };
    loadTeams();
  }, []);

  const handleTeamASelect = async (team: TeamSummary) => {
    console.log('handleTeamASelect called with team:', team);
    try {
      setTeamAId(team.id);
      const fullTeam = await api.getTeam(team.id);
      console.log('Team A loaded:', fullTeam);
      setTeamA(fullTeam);
    } catch (error) {
      console.error('Failed to load Team A:', error);
      alert(`Failed to load Team A: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTeamBSelect = async (team: TeamSummary) => {
    console.log('handleTeamBSelect called with team:', team);
    try {
      setTeamBId(team.id);
      const fullTeam = await api.getTeam(team.id);
      console.log('Team B loaded:', fullTeam);
      setTeamB(fullTeam);
    } catch (error) {
      console.error('Failed to load Team B:', error);
      alert(`Failed to load Team B: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSimulate = async () => {
    if (!teamAId || !teamBId || !teamA || !teamB) {
      console.warn('Teams not fully selected or loaded', { teamAId, teamBId, teamA: !!teamA, teamB: !!teamB });
      return;
    }
    setLoading(true);
    try {
      console.log('Starting simulation with teams:', { teamAId, teamBId, teamA, teamB });
      console.log('Team A structure:', teamA);
      console.log('Team B structure:', teamB);
      const matchResult = await api.simulateMatch(teamAId, teamBId, false);
      console.log('Match result received:', matchResult);

      // Ensure teams have proper structure before navigation
      if (!teamA.players || !teamB.players) {
        console.error('Team objects missing players array!');
        throw new Error('Team data incomplete - players array missing');
      }

      navigate('/broadcast', {
        state: {
          matchResult,
          teamA,
          teamB
        }
      });
    } catch (error) {
      console.error('Simulation failed:', error);
      alert(`Simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-6 pt-16 pb-12 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
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
          <div className="flex items-center justify-center gap-6">
            {!teamAId && <p className="text-red-500 text-sm min-w-[140px] text-left">Please select Team A</p>}
            {teamAId && <div className="min-w-[140px]"></div>}

            <button
              onClick={handleSimulate}
              disabled={!teamAId || !teamBId || loading}
              className={`btn-primary text-lg py-3 px-8 font-bold rounded-lg transition ${
                !teamAId || !teamBId
                  ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? '⏳ Starting Simulation...' : '▶️ Simulate Match'}
            </button>

            {!teamBId && <p className="text-red-500 text-sm min-w-[140px] text-right">Please select Team B</p>}
            {teamBId && <div className="min-w-[140px]"></div>}
          </div>

          <div className="pt-4 border-t border-gray-300">
            <p className="text-muted text-sm mb-3">Or build your own legend</p>
            <button
              onClick={() => navigate('/custom-xi')}
              className="bg-secondary text-white font-semibold py-3 px-8 rounded-lg hover:opacity-90 transition"
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
