import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { api } from '../services/api';
import { parseMatchup, decodeSeed } from '../utils/matchPermalink';

/**
 * /m/<teamA>-v-<teamB>/<seed> — reconstructs and replays a match with no
 * prior navigation state. Nothing is stored anywhere: the permalink *is*
 * the state, and `simulate` being pure is what makes this work at all.
 *
 * Classic teams only. A custom XI's id (`custom-xi-*`) isn't resolvable
 * through the teams dataset, so api.getTeam() throws for it the same way it
 * would for a typo'd or since-removed team id — both land on the same
 * friendly "not found" state below rather than a crash.
 */
export const MatchPermalink: React.FC = () => {
  const { matchup, seed: seedParam } = useParams<{ matchup: string; seed: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const parts = matchup ? parseMatchup(matchup) : null;
      const seed = seedParam ? decodeSeed(seedParam) : null;

      if (!parts || seed === null) {
        setError("That link isn't a valid match link.");
        return;
      }

      try {
        const [teamA, teamB] = await Promise.all([api.getTeam(parts.teamAId), api.getTeam(parts.teamBId)]);
        if (cancelled) return;

        const matchResult = await api.simulateMatch(
          parts.teamAId,
          parts.teamBId,
          false,
          undefined,
          undefined,
          seed
        );
        if (cancelled) return;

        navigate('/broadcast', { replace: true, state: { matchResult, teamA, teamB } });
      } catch (e) {
        if (!cancelled) {
          console.error('Failed to load permalink match:', e);
          setError(
            "This match couldn't be found. It may reference a custom XI, which isn't supported by match links."
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [matchup, seedParam, navigate]);

  return (
    <PageShell showBack centered hideFooter>
      <div className="max-w-md text-center">
        {error ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Match not found</h1>
            <p className="text-sm leading-relaxed text-ink-2">{error}</p>
            <Link to="/" className="btn-accent">Pick two teams</Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center">
              <span className="h-12 w-12 animate-spin rounded-full border-2 border-line border-t-accent" />
            </div>
            <div className="space-y-1">
              <p className="eyebrow">Permalink</p>
              <h1 className="text-2xl font-semibold">Replaying match</h1>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
};
