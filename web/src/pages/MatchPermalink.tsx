import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-black to-black/95">
      <Header showBack />
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          {error ? (
            <>
              <h1 className="text-3xl font-heading font-bold text-red-400 mb-4">Match Not Found</h1>
              <p className="text-white/60 mb-6">{error}</p>
              <Link to="/" className="btn-primary">
                Back to Home
              </Link>
            </>
          ) : (
            <>
              <div className="mb-8 flex justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-primary border-t-secondary animate-spin"></div>
              </div>
              <h1 className="text-2xl font-heading font-bold text-white">Replaying Match...</h1>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};
