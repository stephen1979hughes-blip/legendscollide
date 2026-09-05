import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Icon } from '../components/Icon';
import { api } from '../services/api';
import { Player, Team } from '../types';

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
      <PageShell width="narrow" showBack centered>
        <p className="text-sm text-ink-3">Loading player profile…</p>
      </PageShell>
    );
  }

  if (!player || !team) {
    return (
      <PageShell width="narrow" showBack centered>
        <p className="text-sm text-ink-3">Player not found</p>
      </PageShell>
    );
  }

  const bio = player.bio || 'A talented player in football history.';

  const ratings = [
    { label: 'Overall', value: player.overallRating, lead: true },
    { label: 'Attack', value: player.attackRating },
    { label: 'Defence', value: player.defenceRating },
    { label: 'Stamina', value: player.stamina },
  ];

  return (
    <PageShell width="narrow" showBack>
      <div className="space-y-section">
        <header className="space-y-4 border-b border-line pb-6">
          <div className="space-y-1.5">
            <p className="eyebrow">{player.position}</p>
            <h1 className="display text-4xl md:text-5xl">{player.name}</h1>
          </div>
          <Link
            to={`/team/${team.id}`}
            className="chip transition-colors hover:border-line-strong hover:text-ink"
          >
            {team.name}
            <span className="num text-ink-3">{team.year}</span>
            <Icon name="right" size={12} />
          </Link>
        </header>

        <p className="border-l-2 border-accent pl-5 text-[17px] leading-relaxed text-ink-2">
          {bio}
        </p>

        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {ratings.map((r) => (
            <div key={r.label} className={r.lead ? 'card border-accent/40 p-4' : 'card p-4'}>
              <dt className="eyebrow">{r.label}</dt>
              <dd
                className={`num mt-1.5 text-3xl font-semibold ${r.lead ? 'text-accent' : 'text-ink'}`}
              >
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </PageShell>
  );
};
