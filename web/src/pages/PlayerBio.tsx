import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { api } from '../services/api';
import { Player, Team } from '../types';
import { playerBios } from '../data/playerBios';

export const PlayerBio: React.FC = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) {
      navigate('/');
      return;
    }

    const loadPlayerData = async () => {
      try {
        const teams = await api.getTeams();
        let foundPlayer: Player | null = null;
        let foundTeam: Team | null = null;

        for (const teamSummary of teams) {
          const teamData = await api.getTeam(teamSummary.id);
          const playerData = teamData.players.find((p) => p.id === playerId);
          if (playerData) {
            foundPlayer = playerData;
            foundTeam = teamData;
            break;
          }
        }

        if (foundPlayer && foundTeam) {
          setPlayer(foundPlayer);
          setTeam(foundTeam);
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Failed to load player data:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadPlayerData();
  }, [playerId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header showBack />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted">Loading player profile...</p>
        </main>
      </div>
    );
  }

  if (!player || !team) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header showBack />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted">Player not found</p>
        </main>
      </div>
    );
  }

  const bio = playerBios[playerId!] || 'A talented player in football history.';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showBack />

      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
        {/* Player Header */}
        <div className="card mb-8">
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h1 className="text-5xl font-heading font-bold text-primary mb-2">
              {player.name}
            </h1>
            <div className="flex items-center gap-6 mt-4">
              <div>
                <p className="text-sm text-muted mb-1">Position</p>
                <p className="text-xl font-semibold text-text">{player.position}</p>
              </div>
              <div>
                <p className="text-sm text-muted mb-1">Team</p>
                <p className="text-xl font-semibold text-text">{team.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted mb-1">Era</p>
                <p className="text-xl font-semibold text-text">{team.year}</p>
              </div>
            </div>
          </div>

          {/* Biography */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <p className="text-lg text-text leading-relaxed italic">{bio}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-sm text-muted mb-2">Overall Rating</p>
            <p className="text-4xl font-bold text-primary">{player.overallRating}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-muted mb-2">Attack</p>
            <p className="text-4xl font-bold text-primary">{player.attackRating}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-muted mb-2">Defence</p>
            <p className="text-4xl font-bold text-primary">{player.defenceRating}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-muted mb-2">Stamina</p>
            <p className="text-4xl font-bold text-primary">{player.stamina}</p>
          </div>
        </div>

        {/* Back Button */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate(-1)}
            className="btn-primary"
          >
            ← Back to Team
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};
