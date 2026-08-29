import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { LineupCard } from '../components/LineupCard';
import { StatsPanel } from '../components/StatsPanel';
import { CommentaryFeed } from '../components/CommentaryFeed';
import { MatchResult, Team } from '../types';
import { api } from '../services/api';
import { useState, useEffect } from 'react';

export const Result: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { result, teamAId, teamBId, teamA: preloadedTeamA, teamB: preloadedTeamB } = location.state || {};
  const [teamA, setTeamA] = useState<Team | null>(preloadedTeamA || null);
  const [teamB, setTeamB] = useState<Team | null>(preloadedTeamB || null);

  useEffect(() => {
    if (!result || !teamAId || !teamBId) {
      navigate('/');
      return;
    }

    // If teams were pre-loaded (e.g. from Broadcast), skip the API calls
    if (preloadedTeamA && preloadedTeamB) return;

    const loadTeams = async () => {
      const a = await api.getTeam(teamAId);
      const b = await api.getTeam(teamBId);
      setTeamA(a);
      setTeamB(b);
    };

    loadTeams();
  }, [result, teamAId, teamBId, navigate, preloadedTeamA, preloadedTeamB]);

  if (!result || !teamA || !teamB) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-black to-black/95">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-white/70">Loading result...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-black to-black/95">
      <Header
        showBack
        rightButton={{
          label: 'New Match',
          onClick: () => navigate('/'),
        }}
      />

      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
        {/* Scoreline */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-md mb-8">
          <div className="flex items-center justify-center gap-8">
            <div className="text-center flex-1">
              <h2 className="text-2xl font-bold text-white">{teamA.name}</h2>
              <p className="text-sm text-white/70">{teamA.year}</p>
            </div>
            <div className="text-center">
              <div className="text-6xl font-heading font-bold text-white">
                {result.scoreA} — {result.scoreB}
              </div>
              <p className="text-sm text-white/70 mt-2">{result.stadiumName}</p>
            </div>
            <div className="text-center flex-1">
              <h2 className="text-2xl font-bold text-white">{teamB.name}</h2>
              <p className="text-sm text-white/70">{teamB.year}</p>
            </div>
          </div>
        </div>

        {/* Goals */}
        {((result.goalsA || []).length > 0 || (result.goalsB || []).length > 0) && (
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-md mb-8">
            <h3 className="text-lg font-bold text-white mb-4">Goals</h3>
            <div className="space-y-2">
              {(result.goalsA || []).map((goal: any, idx: number) => (
                <div key={idx} className="flex justify-between text-white/90">
                  <span className="font-semibold">⚽ {goal.minute}' {goal.playerName}</span>
                  <span className="text-primary font-bold">{teamA.name}</span>
                </div>
              ))}
              {(result.goalsB || []).map((goal: any, idx: number) => (
                <div key={idx} className="flex justify-between text-white/90">
                  <span className="text-primary font-bold">{teamB.name}</span>
                  <span className="font-semibold">{goal.playerName} {goal.minute}' ⚽</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mb-8">
          <StatsPanel stats={result.stats} />
        </div>

        {/* Era Flavour */}
        {result.eraFlavour && (
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-md mb-8 border-l-4 border-secondary">
            <p className="italic text-white/90">{result.eraFlavour}</p>
          </div>
        )}

        {/* Man of the Match */}
        <div className="rounded-xl border border-white/10 mb-8 text-center bg-gradient-to-r from-primary to-primary/80 p-6 shadow-md">
          <p className="text-white text-sm font-bold mb-2">MAN OF THE MATCH</p>
          <p className="text-red-300 text-2xl font-heading font-bold">
            {result.manOfTheMatch}
          </p>
        </div>

        {/* Commentary */}
        <div className="mb-8">
          <CommentaryFeed commentary={result.commentary} />
        </div>

        {/* Lineups */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <LineupCard
            teamName={teamA.name}
            teamYear={teamA.year}
            players={teamA.players}
          />
          <LineupCard
            teamName={teamB.name}
            teamYear={teamB.year}
            players={teamB.players}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-center">
          <button onClick={() => navigate('/')} className="btn-primary">
            ▶ New Match
          </button>
          <button
            onClick={() => {
              const text = `${teamA.name} ${result.scoreA} – ${result.scoreB} ${teamB.name} | Man of the Match: ${result.manOfTheMatch} | Legends Collide`;
              if (navigator.share) {
                navigator.share({ title: 'Legends Collide Result', text });
              } else {
                navigator.clipboard.writeText(text);
                alert('Result copied to clipboard!');
              }
            }}
            className="btn-secondary"
          >
            📤 Share Result
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};
