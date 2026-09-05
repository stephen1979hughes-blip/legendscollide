import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell, PageHeading } from '../components/PageShell';
import { Icon } from '../components/Icon';
import { api } from '../services/api';
import { Player, Team, Club } from '../types';
import { CountryRef } from '../utils/dataProcessor';
import {
  TriviaContext,
  TriviaQuestion,
  buildTriviaContext,
  generateQuestion,
  QUIZ_ROUND_SIZE,
  XP_PER_CORRECT_ANSWER,
  quizCompletionBonus,
  quizRoundXp,
} from '../utils/triviaGenerator';
import { xpWallet } from '../utils/xpWallet';

export const Trivia: React.FC = () => {
  const navigate = useNavigate();
  const [ctx, setCtx] = useState<TriviaContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [xpBalance, setXpBalance] = useState(0);

  const [questionNumber, setQuestionNumber] = useState(1);
  const [question, setQuestion] = useState<TriviaQuestion | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [roundOver, setRoundOver] = useState(false);
  const [roundXpAwarded, setRoundXpAwarded] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [players, teams, clubs, countries]: [Player[], Team[], Club[], CountryRef[]] = await Promise.all([
          api.getAllPlayers(),
          Promise.all((await api.getTeams()).map((t) => api.getTeam(t.id))),
          api.getClubs(),
          api.getCountries(),
        ]);
        const built = buildTriviaContext(players, teams, clubs, countries);
        setCtx(built);
        setQuestion(generateQuestion(built));
        setXpBalance(xpWallet.getBalance());
      } catch (error) {
        console.error('Failed to load trivia data:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const bonusPreview = useMemo(() => quizCompletionBonus(correctCount), [correctCount]);

  const handleAnswer = (index: number) => {
    if (selected !== null || !question) return;
    setSelected(index);
    if (index === question.correctIndex) setCorrectCount((c) => c + 1);
  };

  const handleNext = () => {
    if (questionNumber >= QUIZ_ROUND_SIZE) {
      // correctCount already reflects this last question's result — it's
      // updated synchronously in handleAnswer, which always runs (and
      // re-renders) before this button is even clickable.
      const finalXp = quizRoundXp(correctCount);
      setRoundXpAwarded(finalXp);
      const newBalance = xpWallet.earn(finalXp);
      setXpBalance(newBalance);
      setRoundOver(true);
      return;
    }
    setQuestionNumber((n) => n + 1);
    setSelected(null);
    if (ctx) setQuestion(generateQuestion(ctx));
  };

  const handleRestart = () => {
    setQuestionNumber(1);
    setSelected(null);
    setCorrectCount(0);
    setRoundOver(false);
    setRoundXpAwarded(0);
    if (ctx) setQuestion(generateQuestion(ctx));
  };

  if (loading) {
    return (
      <PageShell centered showBack>
        <p className="text-sm text-ink-3">Loading trivia…</p>
      </PageShell>
    );
  }

  return (
    <PageShell width="narrow" showBack>
      <PageHeading
        eyebrow="Trivia"
        title="Legends & teams quiz"
        lede="Answer questions about the classic teams and players in your database. XP from a strong round beats a match win — spend it on Collection, on whichever card you choose."
        action={
          <span className="chip-accent num">
            <Icon name="token" size={13} />
            {xpBalance.toLocaleString()}
          </span>
        }
      />

      {!roundOver && question && (
        <div className="space-y-5">
          <div className="flex items-center justify-between text-sm text-ink-3">
            <span className="num">
              Question {questionNumber} / {QUIZ_ROUND_SIZE}
            </span>
            <span className="num">
              {correctCount} correct so far{correctCount > 0 ? ` · +${correctCount * XP_PER_CORRECT_ANSWER} XP` : ''}
            </span>
          </div>

          <div className="card space-y-4">
            <p className="display text-xl">{question.prompt}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {question.options.map((option, i) => {
                const isSelected = selected === i;
                const isCorrect = i === question.correctIndex;
                const showFeedback = selected !== null;
                const style = !showFeedback
                  ? 'border-line hover:border-line-strong'
                  : isCorrect
                    ? 'border-accent bg-accent/10 text-accent'
                    : isSelected
                      ? 'border-danger bg-danger/10 text-danger'
                      : 'border-line opacity-50';
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={showFeedback}
                    className={`rounded-ctl border px-4 py-3 text-left text-sm font-medium transition ${style}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {selected !== null && (
              <div className="flex items-center justify-between border-t border-line pt-4">
                <p className="text-sm text-ink-2">
                  {selected === question.correctIndex ? `Correct — +${XP_PER_CORRECT_ANSWER} XP` : 'Not quite.'}
                </p>
                <button onClick={handleNext} className="btn-accent btn-sm">
                  {questionNumber >= QUIZ_ROUND_SIZE ? 'Finish round' : 'Next question'}
                  <Icon name="right" size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {roundOver && (
        <div className="space-y-5">
          <div className="card space-y-4 text-center">
            <p className="eyebrow">Round complete</p>
            <p className="display text-3xl">
              {correctCount} / {QUIZ_ROUND_SIZE} correct
            </p>
            <div className="num flex items-center justify-center gap-2 text-2xl font-semibold text-accent">
              <Icon name="token" size={20} />+{roundXpAwarded} XP
            </div>
            <p className="num text-xs text-ink-3">
              {correctCount * XP_PER_CORRECT_ANSWER} for correct answers + {bonusPreview} completion bonus · new
              balance {xpBalance.toLocaleString()}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={handleRestart} className="btn-accent">
              <Icon name="bolt" />
              Another round
            </button>
            <button onClick={() => navigate('/collection')} className="btn-quiet">
              <Icon name="cards" />
              Spend XP in Collection
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
};
