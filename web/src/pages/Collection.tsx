import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Icon } from '../components/Icon';
import { api } from '../services/api';
import { Player } from '../types';
import { Collection as CollectionMap } from '../types/collection';
import { cardCollectionStorage } from '../utils/cardCollectionStorage';
import { effectiveRating, MAX_CARD_LEVEL, xpToNextLevel } from '../utils/cardProgression';
import { tokenStorage } from '../utils/tokenStorage';
import { PACK_COST, PACK_SIZE, RARITY_TIERS, RarityTier, PackPull, openPack } from '../utils/packs';
import { ensureStarterSquad } from '../utils/onboarding';
import { coarsePosition, CoarsePosition } from '../utils/position';

/**
 * Rarity is one of the few places multiple hues earn their keep — the tier is
 * information, not decoration, so it gets its own ordered scale rather than
 * the single accent. Legendary deliberately sits closest to the accent amber.
 */
const TIER_COLOR: Record<RarityTier['id'], string> = {
  legendary: 'border-accent/50 bg-accent/10 text-accent',
  epic: 'border-violet-400/40 bg-violet-400/10 text-violet-300',
  rare: 'border-sky-400/40 bg-sky-400/10 text-sky-300',
  uncommon: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  common: 'border-line-strong bg-raised text-ink-2',
};

const POSITION_FILTERS: Array<{ label: string; value: CoarsePosition | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'GK', value: 'GK' },
  { label: 'DF', value: 'DF' },
  { label: 'MF', value: 'MF' },
  { label: 'FW', value: 'FW' },
];

export const Collection: React.FC = () => {
  const navigate = useNavigate();
  const [pool, setPool] = useState<Player[]>([]);
  const [collection, setCollection] = useState<CollectionMap>({});
  const [tokenBalance, setTokenBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [lastPull, setLastPull] = useState<PackPull[] | null>(null);
  const [filter, setFilter] = useState<CoarsePosition | 'ALL'>('ALL');
  const [starterGrantCount, setStarterGrantCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const players = await api.getAllPlayers();
        setPool(players);

        const starterPack = ensureStarterSquad(players);
        if (starterPack) setStarterGrantCount(starterPack.length);

        setCollection(cardCollectionStorage.loadAll());
        setTokenBalance(tokenStorage.getBalance());
      } catch (error) {
        console.error('Failed to load collection:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const poolById = useMemo(() => new Map(pool.map((p) => [p.id, p])), [pool]);

  const handleOpenPack = () => {
    if (!tokenStorage.spend(PACK_COST)) return;
    setOpening(true);
    setTokenBalance(tokenStorage.getBalance());
    const pulls = openPack(pool);
    setLastPull(pulls);
    setCollection(cardCollectionStorage.loadAll());
    setOpening(false);
  };

  const ownedCards = useMemo(() => {
    return Object.values(collection)
      .map((card) => {
        const base = poolById.get(card.playerId);
        if (!base) return null;
        return {
          card,
          player: base,
          current: effectiveRating(base.overallRating, card.level),
          ceiling: base.overallRating,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .filter((c) => filter === 'ALL' || coarsePosition(c.player.position) === filter)
      .sort((a, b) => b.current - a.current);
  }, [collection, poolById, filter]);

  const canAfford = tokenBalance >= PACK_COST;

  return (
    <PageShell showBack>
      <div className="space-y-section">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
          <div className="space-y-1.5">
            <p className="eyebrow">My collection</p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              <span className="num">{ownedCards.length}</span> cards owned
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="chip-accent num">
              <Icon name="token" size={13} />
              {tokenBalance.toLocaleString()}
            </span>
            <button onClick={() => navigate('/campaign')} className="btn-quiet btn-sm">
              <Icon name="map" />
              Campaign
            </button>
          </div>
        </div>

        {starterGrantCount !== null && (
          <div className="flex items-start gap-3 rounded-ctl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-ink">
            <span className="mt-0.5 flex-shrink-0 text-accent"><Icon name="gift" size={15} /></span>
            <p>Welcome — you've been given a free starter squad of {starterGrantCount} cards.</p>
          </div>
        )}

        {/* Pack opening */}
        <section className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Open a pack</h2>
              <p className="text-sm text-ink-2">
                {PACK_SIZE} cards, weighted toward the lower rarity tiers.
              </p>
            </div>
            <button
              onClick={handleOpenPack}
              disabled={!canAfford || opening || pool.length === 0}
              className="btn-accent"
            >
              <Icon name="gift" />
              {opening ? 'Opening…' : 'Open pack'}
              <span className="num flex items-center gap-1 opacity-70">
                <Icon name="token" size={11} />
                {PACK_COST}
              </span>
            </button>
          </div>

          {/* Rarity odds — published, per Phase 4's "published drop odds" decision brought forward */}
          <div className="flex flex-wrap gap-1.5">
            {RARITY_TIERS.map((t) => (
              <span
                key={t.id}
                className={`num rounded border px-2 py-1 text-[11px] font-semibold ${TIER_COLOR[t.id]}`}
              >
                {t.label} ({t.min === 0 ? '<80' : `${t.min}+`}) · {Math.round(t.weight * 100)}%
              </span>
            ))}
          </div>

          {!canAfford && (
            <p className="text-xs text-ink-3">
              Need <span className="num text-ink">{PACK_COST - tokenBalance}</span> more tokens — play
              a campaign match to earn more.
            </p>
          )}

          {lastPull && (
            <div className="space-y-3 border-t border-line pt-5">
              <h3 className="rule-heading">You pulled</h3>
              <div className="grid gap-2 sm:grid-cols-3">
                {lastPull.map((pull, idx) => (
                  <div key={idx} className={`rounded-ctl border p-4 ${TIER_COLOR[pull.tier.id]}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                      {pull.tier.label}
                    </p>
                    <p className="display mt-1 truncate text-base text-ink">{pull.player.name}</p>
                    <p className="mb-2 text-xs uppercase tracking-wider text-ink-3">
                      {pull.player.position}
                    </p>
                    {pull.isDuplicate ? (
                      <p className="num text-xs text-ink-2">
                        Duplicate → +300 XP (now Lv {pull.card.level})
                      </p>
                    ) : (
                      <p className="num text-xs text-ink-2">
                        <span className="font-semibold text-ink">
                          {effectiveRating(pull.player.overallRating, pull.card.level)}
                        </span>{' '}
                        → ceiling{' '}
                        <span className="font-semibold text-ink">{pull.player.overallRating}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Position filter */}
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by position">
          {POSITION_FILTERS.map((f) => (
            <button
              key={f.value}
              role="tab"
              aria-selected={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={filter === f.value ? 'btn-accent btn-sm' : 'btn-ghost btn-sm border border-line'}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Cards grid */}
        {loading ? (
          <p className="text-center text-sm text-ink-3">Loading collection…</p>
        ) : ownedCards.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-3">
            No cards yet. Open a pack above to get started.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {ownedCards.map(({ card, player, current, ceiling }) => {
              const maxed = card.level >= MAX_CARD_LEVEL;
              const need = xpToNextLevel(card.level);
              const progressPct = maxed ? 100 : Math.min(100, Math.round((card.xp / need) * 100));
              return (
                <div key={card.playerId} className="card space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inset px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-2">
                      {player.position}
                    </span>
                    <span className="num text-xs font-semibold text-accent">Lv {card.level}</span>
                  </div>

                  <h3 className="display truncate text-base">{player.name}</h3>

                  <div className="flex items-baseline gap-1.5">
                    <span className="num text-3xl font-semibold text-ink">{current}</span>
                    {!maxed && <span className="num text-sm text-ink-3">→ {ceiling}</span>}
                  </div>

                  {maxed ? (
                    <p className="text-xs font-semibold text-accent">Maxed</p>
                  ) : (
                    <div className="space-y-1">
                      <div className="h-1.5 overflow-hidden rounded-full bg-raised">
                        <div className="h-full bg-accent" style={{ width: `${progressPct}%` }} />
                      </div>
                      <p className="num text-[10px] text-ink-3">
                        {card.xp}/{need} XP to Lv {card.level + 1}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
};