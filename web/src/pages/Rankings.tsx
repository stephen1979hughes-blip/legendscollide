import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell, PageHeading } from '../components/PageShell';
import { Icon } from '../components/Icon';
import { api } from '../services/api';
import { coarsePosition } from '../utils/position';
import { Team, Player } from '../types';

type RankingMetric = 'overall' | 'attack' | 'defence' | 'midfield' | 'goalkeeper';

const METRICS: { id: RankingMetric; label: string }[] = [
  { id: 'overall', label: 'Overall' },
  { id: 'attack', label: 'Attack' },
  { id: 'defence', label: 'Defence' },
  { id: 'midfield', label: 'Midfield' },
  { id: 'goalkeeper', label: 'Goalkeeper' },
];

const METRIC_LEDE: Record<RankingMetric, string> = {
  overall: 'Mean overall rating across the whole squad.',
  attack: 'Mean rating of the three highest-rated forwards.',
  defence: 'Mean rating of the five highest-rated defenders.',
  midfield: 'Mean rating of the five highest-rated midfielders.',
  goalkeeper: 'Mean rating of the goalkeepers in the squad.',
};

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
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, []);

  const mean = (players: Player[]) =>
    players.length > 0
      ? players.reduce((sum, p) => sum + p.overallRating, 0) / players.length
      : 0;

  /**
   * Take the best `n` of a position group. These used to filter on
   * `p.position === 'FW'`, but the dataset stores specific positions (ST, RW,
   * CB…) rather than the coarse groups the `Player` type claims — so every tab
   * except Overall ranked the entire list at 0.0.
   */
  const bestOfGroup = (team: Team, group: 'GK' | 'DF' | 'MF' | 'FW', take: number) =>
    mean(
      team.players
        .filter((p) => coarsePosition(p.position) === group)
        .sort((a, b) => b.overallRating - a.overallRating)
        .slice(0, take)
    );

  const getMetricValue = (team: Team, metric: RankingMetric): number => {
    if (!team.players || team.players.length === 0) return 0;

    switch (metric) {
      case 'overall': return mean(team.players);
      case 'attack': return bestOfGroup(team, 'FW', 3);
      case 'defence': return bestOfGroup(team, 'DF', 5);
      case 'midfield': return bestOfGroup(team, 'MF', 5);
      case 'goalkeeper': return bestOfGroup(team, 'GK', 1);
    }
  };

  const rankedTeams = teams
    .map((team) => ({ team, value: getMetricValue(team, metric) }))
    .sort((a, b) => b.value - a.value);

  const top = rankedTeams[0]?.value ?? 0;

  if (loading) {
    return (
      <PageShell showBack centered>
        <p className="text-sm text-ink-3">Loading rankings…</p>
      </PageShell>
    );
  }

  return (
    <PageShell showBack>
      <PageHeading eyebrow="Squad ratings" title="Rankings" lede={METRIC_LEDE[metric]} />

      <div className="mb-block flex flex-wrap gap-1.5" role="tablist" aria-label="Ranking metric">
        {METRICS.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={metric === m.id}
            onClick={() => setMetric(m.id)}
            className={
              metric === m.id
                ? 'btn-accent btn-sm'
                : 'btn-ghost btn-sm border border-line'
            }
          >
            {m.label}
          </button>
        ))}
      </div>

      <ol className="space-y-1.5">
        {rankedTeams.map((ranked, index) => (
          <li key={ranked.team.id}>
            <Link
              to={`/team/${ranked.team.id}`}
              className="group flex items-center gap-4 rounded-card border border-line bg-surface px-4 py-3.5 transition-colors duration-150 hover:border-line-strong hover:bg-raised"
            >
              <span
                className={`num w-7 flex-shrink-0 text-right text-sm font-semibold ${
                  index === 0 ? 'text-accent' : 'text-ink-3'
                }`}
              >
                {index + 1}
              </span>

              <span className="min-w-0 flex-1">
                <span className="display block truncate text-lg">{ranked.team.name}</span>
                <span className="num block text-xs text-ink-3">{ranked.team.year}</span>
              </span>

              {/* Bar makes the gaps between sides visible; the rating confirms it. */}
              <span className="hidden h-1 w-24 flex-shrink-0 overflow-hidden rounded-full bg-raised sm:block">
                <span
                  className={`block h-full ${index === 0 ? 'bg-accent' : 'bg-line-strong'}`}
                  style={{ width: top > 0 ? `${(ranked.value / top) * 100}%` : '0%' }}
                />
              </span>

              <span className="num w-14 flex-shrink-0 text-right text-xl font-semibold text-ink">
                {ranked.value.toFixed(1)}
              </span>

              <span className="flex-shrink-0 text-ink-3 transition-colors group-hover:text-accent">
                <Icon name="right" size={15} />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </PageShell>
  );
};
