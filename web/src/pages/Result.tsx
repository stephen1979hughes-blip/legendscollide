import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Scoreline } from '../components/Scoreline';
import { LineupCard } from '../components/LineupCard';
import { StatsPanel } from '../components/StatsPanel';
import { CommentaryFeed } from '../components/CommentaryFeed';
import { Icon } from '../components/Icon';
import { Team } from '../types';
import { api } from '../services/api';
import { buildMatchPermalinkPath, isPermalinkEligible } from '../utils/matchPermalink';
import { SITE_URL } from '../config';

export const Result: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { result, teamAId, teamBId, teamA: preloadedTeamA, teamB: preloadedTeamB } = location.state || {};
  const [teamA, setTeamA] = useState<Team | null>(preloadedTeamA || null);
  const [teamB, setTeamB] = useState<Team | null>(preloadedTeamB || null);
  const [copied, setCopied] = useState(false);
  const [shareFallback, setShareFallback] = useState<string | null>(null);

  useEffect(() => {
    if (!result || !teamAId || !teamBId) {
      navigate('/');
      return;
    }

    // If teams were pre-loaded (e.g. from Broadcast), skip the API calls
    if (preloadedTeamA && preloadedTeamB) return;

    const loadTeams = async () => {
      const a = await api.getTeam(teamAId);
      const b = await api.getTeam(teamBId);
      setTeamA(a);
      setTeamB(b);
    };

    loadTeams();
  }, [result, teamAId, teamBId, navigate, preloadedTeamA, preloadedTeamB]);

  const handleShare = async () => {
    if (!result || !teamA || !teamB) return;

    // Custom XIs aren't derivable from an id, so they don't get a permalink —
    // fall back to the old plain-text summary rather than sharing a link
    // that can never resolve.
    const eligible = isPermalinkEligible(teamA.id, teamB.id);
    const permalink = eligible ? `${SITE_URL}${buildMatchPermalinkPath(teamA.id, teamB.id, result.seed)}` : null;
    const text = permalink
      ? `${teamA.name} ${result.scoreA} – ${result.scoreB} ${teamB.name} — watch it: ${permalink}`
      : `${teamA.name} ${result.scoreA} – ${result.scoreB} ${teamB.name} | Man of the Match: ${result.manOfTheMatch} | Legends Collide`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Legends Collide', text, url: permalink ?? undefined });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked (permissions, insecure context) —
      // fall back to showing the text so it can still be copied by hand.
      setShareFallback(text);
    }
  };

  if (!result || !teamA || !teamB) {
    return (
      <PageShell centered>
        <p className="text-sm text-ink-3">Loading result…</p>
      </PageShell>
    );
  }

  const goalsA = result.goalsA || [];
  const goalsB = result.goalsB || [];

  return (
    <PageShell showBack rightButton={{ label: 'New match', onClick: () => navigate('/') }}>
      <div className="space-y-section">
        <Scoreline
          status="Full time"
          teamAName={teamA.name}
          teamAYear={teamA.year}
          scoreA={result.scoreA}
          teamBName={teamB.name}
          teamBYear={teamB.year}
          scoreB={result.scoreB}
          meta={result.stadiumName}
        />

        {(goalsA.length > 0 || goalsB.length > 0) && (
          <section className="panel p-5">
            <h2 className="rule-heading mb-3">Goals</h2>
            <div className="grid gap-x-8 sm:grid-cols-2">
              <div>
                {goalsA.map((goal: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2.5 border-b border-line py-2 text-sm last:border-b-0">
                    <span className="text-accent"><Icon name="ball" size={13} /></span>
                    <span className="num w-8 flex-shrink-0 text-ink-3">{goal.minute}'</span>
                    <span className="truncate text-ink">{goal.playerName}</span>
                  </div>
                ))}
              </div>
              <div>
                {goalsB.map((goal: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2.5 border-b border-line py-2 text-sm last:border-b-0">
                    <span className="text-accent"><Icon name="ball" size={13} /></span>
                    <span className="num w-8 flex-shrink-0 text-ink-3">{goal.minute}'</span>
                    <span className="truncate text-ink">{goal.playerName}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-block md:grid-cols-2">
          <StatsPanel stats={result.stats} />

          <div className="card flex flex-col justify-center gap-1.5 text-center">
            <p className="eyebrow">Man of the match</p>
            <p className="display text-2xl text-accent md:text-3xl">{result.manOfTheMatch}</p>
          </div>
        </div>

        {result.eraFlavour && (
          <p className="border-l-2 border-accent pl-5 text-[15px] italic leading-relaxed text-ink-2">
            {result.eraFlavour}
          </p>
        )}

        <CommentaryFeed commentary={result.commentary} />

        <div className="grid gap-block md:grid-cols-2">
          <LineupCard teamName={teamA.name} teamYear={teamA.year} players={teamA.players} />
          <LineupCard teamName={teamB.name} teamYear={teamB.year} players={teamB.players} />
        </div>

        <div className="flex flex-col items-center gap-4 border-t border-line pt-8">
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => navigate('/')} className="btn-accent">
              <Icon name="ball" />
              New match
            </button>
            <button onClick={handleShare} className="btn-quiet">
              <Icon name={copied ? 'check' : 'share'} />
              {copied ? 'Copied' : 'Share result'}
            </button>
          </div>
          {shareFallback && (
            <textarea
              readOnly
              value={shareFallback}
              onFocus={(e) => e.currentTarget.select()}
              className="field h-20 max-w-md resize-none text-xs"
            />
          )}
        </div>
      </div>
    </PageShell>
  );
};
