import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Icon } from '../components/Icon';
import { getDailyFixture } from '../utils/dailyFixture';
import { dailyChallengeStorage } from '../utils/dailyChallengeStorage';
import { buildShareString } from '../utils/shareString';
import { DailyCompletionState, DailyRecord, MatchOutcome, StreakStats } from '../types/daily';

function outcomeOf(scoreA: number, scoreB: number): MatchOutcome {
  return scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : 'draw';
}

export const DailyResult: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const freshState = location.state as DailyCompletionState | undefined;

  const [record, setRecord] = useState<DailyRecord | null>(null);
  const [streak, setStreak] = useState<StreakStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareFallback, setShareFallback] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const fixture = await getDailyFixture();
      if (cancelled) return;

      let rec: DailyRecord | null = null;

      if (freshState && freshState.fixture.dayNumber === fixture.dayNumber) {
        const { matchResult, teamA, teamB, prediction } = freshState;
        const actualOutcome = outcomeOf(matchResult.scoreA, matchResult.scoreB);
        const predictedOutcome = outcomeOf(prediction.scoreA, prediction.scoreB);
        const scorerGoals = prediction.scorerTeam === 'A' ? matchResult.goalsA : matchResult.goalsB;

        rec = {
          dayNumber: fixture.dayNumber,
          dateKey: fixture.dateKey,
          teamAId: teamA.id,
          teamBId: teamB.id,
          teamAName: teamA.name,
          teamBName: teamB.name,
          seed: fixture.seed,
          prediction,
          actual: { scoreA: matchResult.scoreA, scoreB: matchResult.scoreB, outcome: actualOutcome },
          correctness: {
            outcome: predictedOutcome === actualOutcome,
            exactScore: prediction.scoreA === matchResult.scoreA && prediction.scoreB === matchResult.scoreB,
            scorer: scorerGoals.some((g) => g.playerName === prediction.scorerName),
          },
          completedAt: new Date().toISOString(),
        };
        dailyChallengeStorage.saveRecord(rec);
      } else {
        rec = dailyChallengeStorage.getRecord(fixture.dayNumber);
      }

      if (cancelled) return;

      if (!rec) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setRecord(rec);
      setStreak(dailyChallengeStorage.getStreakStats(fixture.dayNumber));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (notFound) navigate('/daily', { replace: true });
  }, [notFound, navigate]);

  const handleShare = async () => {
    if (!record) return;
    const text = buildShareString(record);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Legends Collide', text });
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

  if (loading || notFound) {
    return (
      <PageShell width="narrow" centered>
        <p className="text-sm text-ink-3">Loading…</p>
      </PageShell>
    );
  }

  if (!record || !streak) return null;

  const { correctness, prediction, actual } = record;
  const correctCount = [correctness.outcome, correctness.exactScore, correctness.scorer].filter(Boolean).length;

  return (
    <PageShell width="narrow" rightButton={{ label: 'Home', onClick: () => navigate('/') }}>
      <div className="space-y-section">
        <div className="space-y-3 border-b border-line pb-6 text-center">
          <p className="eyebrow">Day {record.dayNumber}</p>
          <div className="flex items-center justify-center gap-4">
            <span className="display flex-1 truncate text-right text-lg md:text-xl">
              {record.teamAName}
            </span>
            <span className="display num flex-shrink-0 text-4xl">
              {actual.scoreA}–{actual.scoreB}
            </span>
            <span className="display flex-1 truncate text-left text-lg md:text-xl">
              {record.teamBName}
            </span>
          </div>
          <p className="num text-sm text-ink-2">
            <span className={correctCount > 0 ? 'text-accent' : ''}>{correctCount}</span> of 3 correct
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="rule-heading">Your prediction</h2>
          <AccuracyRow
            label="Outcome"
            correct={correctness.outcome}
            detail={`You predicted ${outcomeLabel(prediction.scoreA, prediction.scoreB, record)}`}
          />
          <AccuracyRow
            label="Exact score"
            correct={correctness.exactScore}
            detail={`You predicted ${prediction.scoreA}–${prediction.scoreB}`}
          />
          <AccuracyRow
            label="Goalscorer"
            correct={correctness.scorer}
            detail={`You predicted ${prediction.scorerName}`}
          />
        </div>

        <div className="card space-y-5">
          <h2 className="rule-heading">Your streak</h2>
          <dl className="grid grid-cols-3 gap-3">
            <StatTile label="Current" value={streak.currentStreak} lead />
            <StatTile label="Best" value={streak.bestStreak} />
            <StatTile label="Played" value={streak.gamesPlayed} />
          </dl>
          <dl className="grid grid-cols-3 gap-3 border-t border-line pt-5">
            <StatTile label="Outcomes" value={streak.outcomeCorrect} small />
            <StatTile label="Exact scores" value={streak.exactScoreCorrect} small />
            <StatTile label="Scorers" value={streak.scorerCorrect} small />
          </dl>
        </div>

        <div className="flex flex-col items-center gap-3">
          <button onClick={handleShare} className="btn-accent w-full md:w-auto">
            <Icon name={copied ? 'check' : 'share'} />
            {copied ? 'Copied to clipboard' : 'Share result'}
          </button>
          <p className="max-w-xs text-center text-xs text-ink-3">
            The share spoils nothing — no scoreline, no scorer, just how you did.
          </p>
          {shareFallback && (
            <textarea
              readOnly
              value={shareFallback}
              onFocus={(e) => e.currentTarget.select()}
              className="field h-24 max-w-xs resize-none text-xs"
            />
          )}
        </div>
      </div>
    </PageShell>
  );
};

function outcomeLabel(scoreA: number, scoreB: number, record: DailyRecord): string {
  if (scoreA > scoreB) return `${record.teamAName} to win`;
  if (scoreB > scoreA) return `${record.teamBName} to win`;
  return 'a draw';
}

const AccuracyRow: React.FC<{ label: string; correct: boolean; detail: string }> = ({
  label,
  correct,
  detail,
}) => (
  <div
    className={`flex items-center justify-between gap-3 rounded-ctl border px-4 py-3 ${
      correct ? 'border-accent/40 bg-accent/10' : 'border-line bg-surface'
    }`}
  >
    <div className="min-w-0">
      <p className="font-heading text-sm font-semibold text-ink">{label}</p>
      <p className="truncate text-xs text-ink-3">{detail}</p>
    </div>
    <span className={`flex-shrink-0 ${correct ? 'text-accent' : 'text-ink-3'}`}>
      <Icon name={correct ? 'check' : 'cross'} size={18} title={correct ? 'Correct' : 'Wrong'} />
    </span>
  </div>
);

const StatTile: React.FC<{ label: string; value: number; small?: boolean; lead?: boolean }> = ({
  label,
  value,
  small,
  lead,
}) => (
  <div className="text-center">
    <dd className={`num font-semibold ${small ? 'text-xl' : 'text-3xl'} ${lead ? 'text-accent' : 'text-ink'}`}>
      {value}
    </dd>
    <dt className="eyebrow mt-0.5">{label}</dt>
  </div>
);