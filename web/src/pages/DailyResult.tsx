import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
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
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-black to-black/95">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-white/70">Loading...</p>
        </main>
      </div>
    );
  }

  if (!record || !streak) return null;

  const { correctness, prediction, actual } = record;
  const correctCount = [correctness.outcome, correctness.exactScore, correctness.scorer].filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-black to-black/95">
      <Header rightButton={{ label: 'Home', onClick: () => navigate('/') }} />

      <main className="flex-1 max-w-screen-md mx-auto px-4 py-12 w-full space-y-8">
        <div className="text-center space-y-2">
          <p className="text-secondary text-sm font-bold uppercase tracking-widest">Day {record.dayNumber}</p>
          <h2 className="text-white text-4xl font-black tracking-tight">
            {record.teamAName} {actual.scoreA} — {actual.scoreB} {record.teamBName}
          </h2>
          <p className="text-white/60">{correctCount}/3 correct</p>
        </div>

        {/* Accuracy breakdown */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-md space-y-3">
          <AccuracyRow
            label="Outcome"
            correct={correctness.outcome}
            detail={`You predicted ${outcomeLabel(prediction.scoreA, prediction.scoreB, record)}`}
          />
          <AccuracyRow
            label="Exact Score"
            correct={correctness.exactScore}
            detail={`You predicted ${prediction.scoreA} — ${prediction.scoreB}`}
          />
          <AccuracyRow
            label="Goalscorer"
            correct={correctness.scorer}
            detail={`You predicted ${prediction.scorerName}`}
          />
        </div>

        {/* Streak */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-md">
          <h3 className="text-white font-bold text-lg mb-4 text-center">Your Streak</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <StatTile label="Current" value={streak.currentStreak} />
            <StatTile label="Best" value={streak.bestStreak} />
            <StatTile label="Played" value={streak.gamesPlayed} />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center mt-6 pt-6 border-t border-white/10">
            <StatTile label="Outcomes" value={streak.outcomeCorrect} small />
            <StatTile label="Exact Scores" value={streak.exactScoreCorrect} small />
            <StatTile label="Scorers" value={streak.scorerCorrect} small />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleShare}
            className="w-full md:w-auto px-8 py-3 rounded-xl font-semibold bg-secondary hover:bg-secondary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {copied ? '✅ Copied to clipboard!' : '📤 Share Result'}
          </button>
          <p className="text-white/40 text-xs text-center max-w-xs">
            The share spoils nothing — no scoreline, no scorer, just how you did.
          </p>
          {shareFallback && (
            <textarea
              readOnly
              value={shareFallback}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full max-w-xs h-24 px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-white text-xs font-mono resize-none"
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

function outcomeLabel(scoreA: number, scoreB: number, record: DailyRecord): string {
  if (scoreA > scoreB) return `${record.teamAName} to win`;
  if (scoreB > scoreA) return `${record.teamBName} to win`;
  return 'a draw';
}

const AccuracyRow: React.FC<{ label: string; correct: boolean; detail: string }> = ({ label, correct, detail }) => (
  <div className={`flex items-center justify-between p-3 rounded-lg ${correct ? 'bg-green-500/10' : 'bg-white/5'}`}>
    <div>
      <p className="text-white font-semibold text-sm">{label}</p>
      <p className="text-white/50 text-xs">{detail}</p>
    </div>
    <span className="text-2xl">{correct ? '✅' : '❌'}</span>
  </div>
);

const StatTile: React.FC<{ label: string; value: number; small?: boolean }> = ({ label, value, small }) => (
  <div>
    <p className={`font-bold text-white ${small ? 'text-xl' : 'text-3xl'}`}>{value}</p>
    <p className="text-white/50 text-xs uppercase tracking-wide">{label}</p>
  </div>
);
