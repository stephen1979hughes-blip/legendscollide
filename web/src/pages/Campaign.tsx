import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Icon } from '../components/Icon';
import { api } from '../services/api';
import { buildLadder, xpForMatch } from '../utils/campaignLadder';
import { campaignStorage } from '../utils/campaignStorage';
import { ensureStarterSquad } from '../utils/onboarding';
import { CampaignTier } from '../types/campaign';
import { xpWallet } from '../utils/xpWallet';

export const Campaign: React.FC = () => {
  const navigate = useNavigate();
  const [ladder, setLadder] = useState<CampaignTier[]>([]);
  const [defeated, setDefeated] = useState<Set<string>>(new Set());
  const [xpBalance, setXpBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starterGrantCount, setStarterGrantCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const summaries = await api.getTeams();
        const fullTeams = await Promise.all(summaries.map((t) => api.getTeam(t.id)));
        const builtLadder = buildLadder(fullTeams);
        setLadder(builtLadder);
        setDefeated(new Set(builtLadder.filter((t) => campaignStorage.isDefeated(t.teamId)).map((t) => t.teamId)));

        const pool = await api.getAllPlayers();
        const starterPack = ensureStarterSquad(pool);
        if (starterPack) setStarterGrantCount(starterPack.length);

        setXpBalance(xpWallet.getBalance());
      } catch (error) {
        console.error('Failed to load campaign ladder:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isUnlocked = (tier: CampaignTier): boolean => {
    if (tier.tier === 1) return true;
    const previous = ladder.find((t) => t.tier === tier.tier - 1);
    return previous ? defeated.has(previous.teamId) : false;
  };

  const highestUnlockedTier = ladder.reduce((max, t) => (isUnlocked(t) ? Math.max(max, t.tier) : max), 0);

  return (
    <PageShell width="narrow" showBack>
      <div className="space-y-section">
        <div className="space-y-3 border-b border-line pb-6">
          <p className="eyebrow">Campaign ladder</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">26 legends. One climb.</h1>
          <p className="max-w-[60ch] text-[15px] leading-relaxed text-ink-2">
            Beat a team with your collection XI to unlock the next one. Every match pays XP —
            more for winning, more again for a harder opponent — and every first win pays a
            themed pack pulled from the squad you just beat. Answer trivia rounds for XP too,
            then spend it on packs or on levelling whichever card you choose.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="chip-accent num">
              <Icon name="token" size={13} />
              {xpBalance.toLocaleString()} XP
            </span>
            <button onClick={() => navigate('/collection')} className="btn-quiet btn-sm">
              <Icon name="gift" />
              Open packs
            </button>
            <button onClick={() => navigate('/trivia')} className="btn-quiet btn-sm">
              <Icon name="bolt" />
              Play trivia
            </button>
          </div>
        </div>

        {starterGrantCount !== null && (
          <div className="flex items-start gap-3 rounded-ctl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-ink">
            <span className="mt-0.5 flex-shrink-0 text-accent"><Icon name="gift" size={15} /></span>
            <p>
              Welcome — you've been given a free starter squad of {starterGrantCount} cards. Check{' '}
              <button
                onClick={() => navigate('/collection')}
                className="rounded font-semibold text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
              >
                My collection
              </button>{' '}
              to see them.
            </p>
          </div>
        )}

        {loading && <p className="text-center text-sm text-ink-3">Loading the ladder…</p>}

        <ol className="space-y-1.5">
          {ladder.map((tier) => {
            const unlocked = isUnlocked(tier);
            const won = defeated.has(tier.teamId);
            const isNext = unlocked && !won && tier.tier === highestUnlockedTier;
            return (
              <li
                key={tier.teamId}
                className={`flex items-center gap-3 rounded-card border px-4 py-3 transition-colors ${
                  won
                    ? 'border-accent/30 bg-accent/[0.06]'
                    : isNext
                      ? 'border-line-strong bg-surface'
                      : unlocked
                        ? 'border-line bg-surface'
                        : 'border-line/60 bg-surface/40'
                }`}
              >
                <span
                  className={`num w-6 flex-shrink-0 text-right text-sm font-semibold ${
                    unlocked ? 'text-ink-3' : 'text-ink-3/50'
                  }`}
                >
                  {tier.tier}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={`display block truncate text-base ${unlocked ? 'text-ink' : 'text-ink-3'}`}
                  >
                    {tier.teamName}
                  </span>
                  <span className="num block text-xs text-ink-3">
                    {tier.year} · Rating {tier.rating}
                  </span>
                </span>

                {won && (
                  <span className="flex flex-shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
                    <Icon name="check" size={13} />
                    Beaten
                  </span>
                )}

                {!unlocked && (
                  <span className="flex flex-shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-3">
                    <Icon name="lock" size={13} />
                    Locked
                  </span>
                )}

                {unlocked && (
                  <button
                    onClick={() => navigate('/custom-xi', { state: { campaignTeamId: tier.teamId } })}
                    className={isNext ? 'btn-accent btn-sm' : 'btn-quiet btn-sm'}
                  >
                    {won ? 'Replay' : 'Play'}
                    <span className="num flex items-center gap-1 text-[11px] opacity-70">
                      Win
                      <Icon name="token" size={11} />
                      {xpForMatch(tier.tier, 'win')}
                      {!won && ' + pack'}
                    </span>
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </PageShell>
  );
};