import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageShell, PageHeading } from '../components/PageShell';
import { TeamPitch } from '../components/TeamPitch';
import { api } from '../services/api';
import { coarsePosition } from '../utils/position';
import { Team, Player } from '../types';

const mean = (players: Player[]) =>
  players.length > 0
    ? (players.reduce((sum, p) => sum + p.overallRating, 0) / players.length).toFixed(1)
    : '—';

/**
 * These used to filter on `p.position === 'FW'`, which never matched: the
 * dataset stores specific positions (ST, RW, CB…), not the coarse groups the
 * `Player` type claims. Every average below "Overall" rendered as N/A.
 */
const groupMean = (players: Player[], group: 'DF' | 'MF' | 'FW', take: number) =>
  mean(
    players
      .filter((p) => coarsePosition(p.position) === group)
      .sort((a, b) => b.overallRating - a.overallRating)
      .slice(0, take)
  );

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
        setTeam(await api.getTeam(teamId));
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
      <PageShell showBack centered>
        <p className="text-sm text-ink-3">Loading team details…</p>
      </PageShell>
    );
  }

  if (!team) {
    return (
      <PageShell showBack centered>
        <p className="text-sm text-ink-3">Team not found</p>
      </PageShell>
    );
  }

  const stats = [
    { label: 'Squad', value: String(team.players.length) },
    { label: 'Overall', value: mean(team.players) },
    { label: 'Attack', value: groupMean(team.players, 'FW', 3) },
    { label: 'Midfield', value: groupMean(team.players, 'MF', 5) },
    { label: 'Defence', value: groupMean(team.players, 'DF', 5) },
  ];

  return (
    <PageShell showBack>
      <PageHeading eyebrow={String(team.year)} title={team.name} />

      <TeamPitch players={team.players} />

      <dl className="mt-section grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-4">
            <dt className="eyebrow">{stat.label}</dt>
            <dd className="num mt-1.5 text-3xl font-semibold text-ink">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </PageShell>
  );
};
