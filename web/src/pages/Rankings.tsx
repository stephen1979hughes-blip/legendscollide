import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { api } from '../services/api';
import { Team } from '../types';

type RankingMetric = 'overall' | 'attack' | 'defence' | 'midfield' | 'goalkeeper';

export const Rankings: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<RankingMetric>('overall');

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teamSummaries = await api.getTeams();
        // Fetch full team data sequentially to avoid overwhelming the API
        const fullTeams = [];
        for (const summary of teamSummaries) {
          const fullTeam = await api.getTeam(summary.id);
          fullTeams.push(fullTeam);
        }
        setTeams(fullTeams);
      } catch (error) {
        console.error('Failed to load teams:', error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, []);

  const getMetricValue = (team: Team, metric: RankingMetric): number => {
    if (!team.players || team.players.length === 0) return 0;

    if (metric === 'overall') {
      return team.players.reduce((sum, p) => sum + p.overallRating, 0) / team.players.length;
    } else if (metric === 'attack') {
      const fwPlayers = team.players.filter((p) => p.position === 'FW').slice(0, 3);
      return fwPlayers.length > 0
        ? fwPlayers.reduce((sum, p) => sum + p.overallRating, 0) / fwPlayers.length
        : 0;
    } else if (metric === 'defence') {
      const dfPlayers = team.players.filter((p) => p.position === 'DF').slice(0, 5);
      return dfPlayers.length > 0
        ? dfPlayers.reduce((sum, p) => sum + p.overallRating, 0) / dfPlayers.length
        : 0;
    } else if (metric === 'midfield') {
      const mfPlayers = team.players.filter((p) => p.position === 'MF').slice(0, 5);
      return mfPlayers.length > 0
        ? mfPlayers.reduce((sum, p) => sum + p.overallRating, 0) / mfPlayers.length
        : 0;
    } else {
      const gkPlayers = team.players.filter((p) => p.position === 'GK');
      return gkPlayers.length > 0
        ? gkPlayers.reduce((sum, p) => sum + p.overallRating, 0) / gkPlayers.length
        : 0;
    }
  };

  const rankedTeams = teams
    .map((team) => ({
      team,
      value: getMetricValue(team, metric),
    }))
    .sort((a, b) => b.value - a.value);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-black to-black/95">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-white/70">Loading rankings...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-black to-black/95">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <div className="mb-12">
          <h1 className="text-5xl font-heading font-bold text-white mb-8">Rankings</h1>

          <div className="flex gap-3 flex-wrap mb-8">
            <button
              onClick={() => setMetric('overall')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                metric === 'overall'
                  ? 'bg-white/20 border border-white/40 text-white'
                  : 'bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              Overall
            </button>
            <button
              onClick={() => setMetric('attack')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                metric === 'attack'
                  ? 'bg-white/20 border border-white/40 text-white'
                  : 'bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              Attack
            </button>
            <button
              onClick={() => setMetric('defence')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                metric === 'defence'
                  ? 'bg-white/20 border border-white/40 text-white'
                  : 'bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              Defence
            </button>
            <button
              onClick={() => setMetric('midfield')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                metric === 'midfield'
                  ? 'bg-white/20 border border-white/40 text-white'
                  : 'bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              Midfield
            </button>
            <button
              onClick={() => setMetric('goalkeeper')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                metric === 'goalkeeper'
                  ? 'bg-white/20 border border-white/40 text-white'
                  : 'bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              Goalkeeper
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {rankedTeams.map((ranked, index) => (
            <Link
              key={ranked.team.id}
              to={`/team/${ranked.team.id}`}
              className="flex items-center gap-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 hover:bg-white/10 transition"
            >
              <div className="text-2xl font-bold text-white/50 w-8 text-right">#{index + 1}</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">{ranked.team.name}</h3>
                <p className="text-white/60">{ranked.team.year}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">{ranked.value.toFixed(1)}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};
