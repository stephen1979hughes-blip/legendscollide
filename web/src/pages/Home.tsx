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
    navigate('/simulate', {
      state: {
        teamAId,
        teamBId
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-black to-black/95">
      <Header />

      <main className="flex-1 max-w-screen-lg mx-auto px-4 py-12 w-full space-y-12">
        {/* Daily Challenge CTA */}
        <div className="rounded-xl bg-gradient-to-r from-primary to-secondary p-[1px] shadow-lg">
          <div className="rounded-xl bg-black/90 backdrop-blur p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-secondary text-xs font-bold uppercase tracking-widest mb-1">New: Daily Fixture</p>
              <h3 className="text-2xl font-bold text-white mb-1">One Match. Every Day. Everyone.</h3>
              <p className="text-white/60 text-sm max-w-md">
                Predict today's scoreline and scorer before kickoff, then watch it play out. Same fixture for the whole world.
              </p>
            </div>
            <button
              onClick={() => navigate('/daily')}
              className="flex-shrink-0 px-8 py-3 rounded-lg bg-white text-black font-bold transition-all duration-200 hover:-translate-y-0.5 shadow-lg hover:shadow-xl whitespace-nowrap"
            >
              ⚡ Play Today's Fixture
            </button>
          </div>
        </div>

        {/* Section: Team Selection */}
        <div className="text-center space-y-4">
          <h2 className="text-white text-4xl md:text-5xl font-black tracking-tight">Select Your Teams</h2>
          <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto">
            Choose two legendary squads to do battle. Will it be the invincible 1970 Brazil vs the tactical genius of 2014 Germany? The choice is yours!
          </p>
          <div className="flex justify-center">
            <div className="h-1 w-20 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
          </div>
        </div>

        {/* Team Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
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

        {/* Primary CTA: Simulate Match */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleSimulate}
            disabled={!teamAId || !teamBId || loading}
            className={`w-full md:w-auto px-8 md:px-16 py-4 rounded-xl font-semibold text-lg tracking-wide transition-all duration-200 flex items-center justify-center gap-2 ${
              !teamAId || !teamBId
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
            }`}
          >
            <span className="text-xl">⚽</span>
            {loading ? '⏳ Starting...' : 'Simulate Match'}
          </button>
          <p className="text-white/50 text-sm text-center max-w-xs">
            {!teamAId || !teamBId
              ? 'Select both teams to begin'
              : 'Watch the match unfold with real-time commentary'}
          </p>
        </div>

        {/* Secondary CTA: Build Custom XI */}
        <div className="border-t border-white/10 pt-12">
          <div className="rounded-xl bg-white/5 border border-white/10 backdrop-blur p-8 md:p-12 text-center space-y-6">
            <div className="space-y-2">
              <p className="text-white/60 text-sm uppercase tracking-widest font-semibold">Create your fantasy</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white">Build Your All-Time XI</h3>
              <p className="text-white/60 text-base max-w-lg mx-auto">
                Hand-pick players from across history to create your perfect squad and test their mettle
              </p>
            </div>
            <button
              onClick={() => navigate('/custom-xi')}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-secondary hover:bg-secondary/90 text-white font-semibold transition-all duration-200 hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
            >
              <span>✨</span>
              Build Custom XI
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
