import React, { useEffect, useState } from 'react';
import { PageShell, PageHeading } from '../components/PageShell';
import { TeamCard } from '../components/TeamCard';
import { api } from '../services/api';
import { TeamSummary } from '../types';

export const Teams: React.FC = () => {
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        setTeams(await api.getTeams());
      } catch (error) {
        console.error('Failed to load teams:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTeams();
  }, []);

  if (loading) {
    return (
      <PageShell showBack centered>
        <p className="text-sm text-ink-3">Loading teams…</p>
      </PageShell>
    );
  }

  return (
    <PageShell showBack>
      <PageHeading
        eyebrow="Squad archive"
        title="Teams"
        lede={`${teams.length} classic sides, each with the XI that made them.`}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
      </div>
    </PageShell>
  );
};
