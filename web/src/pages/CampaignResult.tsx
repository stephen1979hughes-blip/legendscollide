import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Scoreline } from '../components/Scoreline';
import { Icon } from '../components/Icon';
import { CampaignCompletionState } from '../types/campaign';
import { MAX_CARD_LEVEL, xpToNextLevel } from '../utils/cardProgression';

export const CampaignResult: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as CampaignCompletionState | undefined;

  if (!state) {
    navigate('/campaign', { replace: true });
    return null;
  }

  const {
    matchResult, teamA, teamB, tier, won, tokensEarned, newBalance,
    xpGained, unlockedNextTier, nextTier, themedPack,
  } = state;
  const leveledUp = xpGained.filter((g) => g.after.level > g.before.level);

  return (
    <PageShell
      width="narrow"
      rightButton={{ label: 'Campaign', onClick: () => navigate('/campaign') }}
    >
      <div className="space-y-section">
        <Scoreline
          status={won ? 'Victory' : 'Defeat'}
          teamAName={teamA.name}
          scoreA={matchResult.scoreA}
          teamBName={teamB.name}
          scoreB={matchResult.scoreB}
          meta={`Ladder tier ${tier.tier} — ${tier.teamName}, ${tier.rating} rating`}
        />

        <div className="grid gap-block sm:grid-cols-2">
          <div className="card text-center">
            <p className="eyebrow">Tokens earned</p>
            <p className="num mt-1.5 flex items-center justify-center gap-2 text-3xl font-semibold text-accent">
              <Icon name="token" size={22} />
              +{tokensEarned}
            </p>
            <p className="num mt-1 text-xs text-ink-3">
              New balance: {newBalance.toLocaleString()}
            </p>
          </div>

          {unlockedNextTier ? (
            <div className="card border-accent/40 text-center">
              <p className="eyebrow flex items-center justify-center gap-1.5 text-accent">
                <Icon name="unlock" size={12} />
                Tier {tier.tier + 1} unlocked
              </p>
              <p className="mt-1.5 text-sm text-ink-2">
                {nextTier
                  ? `Next up: ${nextTier.teamName} (${nextTier.rating} rating)`
                  : "You've beaten every team on the ladder."}
              </p>
            </div>
          ) : (
            <div className="card text-center">
              <p className="eyebrow">Next tier</p>
              <p className="mt-1.5 text-sm text-ink-2">
                Win this tie to unlock tier {tier.tier + 1}.
              </p>
            </div>
          )}
        </div>

        {themedPack && (
          <div className="card border-accent/40 text-center">
            <p className="eyebrow flex items-center justify-center gap-1.5 text-accent">
              <Icon name="cards" size={12} />
              Themed drop
            </p>
            <p className="display mt-1.5 text-2xl">{themedPack.playerName}</p>
            <p className="mt-1 text-sm text-ink-2">
              {themedPack.isDuplicate
                ? 'Already owned — converted straight to XP.'
                : `Pulled from ${tier.teamName}'s roster. Added to your collection.`}
            </p>
          </div>
        )}

        <div className="card">
          <h2 className="rule-heading mb-3">Squad progress</h2>
          <div className="space-y-0">
            {xpGained.map((g) => {
              const gained = g.after.level > g.before.level;
              const maxed = g.after.level >= MAX_CARD_LEVEL;
              return (
                <div
                  key={g.playerId}
                  className="flex items-center justify-between gap-3 border-b border-line py-2 text-sm last:border-b-0"
                >
                  <span className="min-w-0 truncate text-ink">{g.playerName}</span>
                  <span
                    className={`num flex-shrink-0 text-xs font-semibold ${
                      gained ? 'text-accent' : 'text-ink-3'
                    }`}
                  >
                    {gained
                      ? `Lv ${g.before.level} → Lv ${g.after.level}`
                      : maxed
                        ? `Lv ${g.after.level} (maxed)`
                        : `Lv ${g.after.level} · ${g.after.xp}/${xpToNextLevel(g.after.level)} XP`}
                  </span>
                </div>
              );
            })}
          </div>
          {leveledUp.length > 0 && (
            <p className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-accent">
              <Icon name="star" size={14} />
              {leveledUp.length} card{leveledUp.length === 1 ? '' : 's'} levelled up
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2 border-t border-line pt-8">
          <button onClick={() => navigate('/campaign')} className="btn-accent">
            <Icon name="map" />
            Back to campaign
          </button>
          <button onClick={() => navigate('/collection')} className="btn-quiet">
            <Icon name="cards" />
            My collection
          </button>
        </div>
      </div>
    </PageShell>
  );
};
