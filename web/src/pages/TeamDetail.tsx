import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { TeamPitch } from '../components/TeamPitch';
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
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-black to-black/95">
        <Header showBack />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-white/70">Loading team details...</p>
        </main>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-black to-black/95">
        <Header showBack />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-white/70">Team not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-black to-black/95">
      <Header showBack />

      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
        <div className="mb-12">
          <h1 className="text-5xl font-heading font-bold text-white mb-2">
            {team.name}
          </h1>
          <p className="text-xl text-white/70">{team.year}</p>
        </div>

        <TeamPitch players={team.players} />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-md text-center">
            <p className="text-sm text-white/70 mb-2">Total Players</p>
            <p className="text-4xl font-bold text-white">{team.players.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-md text-center">
            <p className="text-sm text-white/70 mb-2">Avg Overall</p>
            <p className="text-4xl font-bold text-white">
              {(
                team.players.reduce((sum, p) => sum + p.overallRating, 0) /
                team.players.length
              ).toFixed(1)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-md text-center">
            <p className="text-sm text-white/70 mb-2">Avg Attack</p>
            <p className="text-4xl font-bold text-white">
              {(() => {
                const fwPlayers = team.players.filter((p) => p.position === 'FW').slice(0, 3);
                return fwPlayers.length > 0
                  ? (
                      fwPlayers.reduce((sum, p) => sum + p.overallRating, 0) /
                      fwPlayers.length
                    ).toFixed(1)
                  : 'N/A';
              })()}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-md text-center">
            <p className="text-sm text-white/70 mb-2">Avg Defence</p>
            <p className="text-4xl font-bold text-white">
              {(() => {
                const dfPlayers = team.players.filter((p) => p.position === 'DF').slice(0, 5);
                return dfPlayers.length > 0
                  ? (
                      dfPlayers.reduce((sum, p) => sum + p.overallRating, 0) /
                      dfPlayers.length
                    ).toFixed(1)
                  : 'N/A';
              })()}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-md text-center">
            <p className="text-sm text-white/70 mb-2">Avg Midfield</p>
            <p className="text-4xl font-bold text-white">
              {(() => {
                const mfPlayers = team.players.filter((p) => p.position === 'MF').slice(0, 5);
                return mfPlayers.length > 0
                  ? (
                      mfPlayers.reduce((sum, p) => sum + p.overallRating, 0) /
                      mfPlayers.length
                    ).toFixed(1)
                  : 'N/A';
              })()}
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
