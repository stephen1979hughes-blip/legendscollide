import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { LineupCard } from '../components/LineupCard';
import { api } from '../services/api';
import { Team } from '../types';

export const TeamDetail: React.FC = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) {
      navigate('/');
      return;
    }

    const loadTeam = async () => {
      try {
        const teamData = await api.getTeam(teamId);
        setTeam(teamData);
      } catch (error) {
        console.error('Failed to load team:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, [teamId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header showBack />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted">Loading team details...</p>
        </main>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header showBack />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted">Team not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showBack />

      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
        <div className="mb-12">
          <h1 className="text-5xl font-heading font-bold text-primary mb-2">
            {team.name}
          </h1>
          <p className="text-xl text-muted">{team.year}</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <LineupCard
            teamName={team.name}
            teamYear={team.year}
            players={team.players}
          />
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card text-center">
            <p className="text-sm text-muted mb-2">Total Players</p>
            <p className="text-4xl font-bold text-primary">{team.players.length}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-muted mb-2">Avg Overall</p>
            <p className="text-4xl font-bold text-primary">
              {(
                team.players.reduce((sum, p) => sum + p.overallRating, 0) /
                team.players.length
              ).toFixed(1)}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-muted mb-2">Avg Attack</p>
            <p className="text-4xl font-bold text-primary">
              {(
                team.players.reduce((sum, p) => sum + p.attackRating, 0) /
                team.players.length
              ).toFixed(1)}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-muted mb-2">Avg Defence</p>
            <p className="text-4xl font-bold text-primary">
              {(
                team.players.reduce((sum, p) => sum + p.defenceRating, 0) /
                team.players.length
              ).toFixed(1)}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-muted mb-2">Avg Stamina</p>
            <p className="text-4xl font-bold text-primary">
              {(
                team.players.reduce((sum, p) => sum + p.stamina, 0) /
                team.players.length
              ).toFixed(1)}
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
