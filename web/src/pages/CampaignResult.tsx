import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Scoreline } from '../components/Scoreline';
import { Icon } from '../components/Icon';
import { CampaignCompletionState } from '../types/campaign';

const OUTCOME_LABEL: Record<CampaignCompletionState['outcome'], string> = {
  win: 'Victory',
  draw: 'Draw',
  loss: 'Defeat',
};

export const CampaignResult: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as CampaignCompletionState | undefined;

  if (!state) {
    navigate('/campaign', { replace: true });
    return null;
  }

  const {
    matchResult, teamA, teamB, tier, outcome, xpEarned, newBalance,
    unlockedNextTier, nextTier, themedPack,
  } = state;

  return (
    <PageShell
      width="narrow"
      rightButton={{ label: 'Campaign', onClick: () => navigate('/campaign') }}
    >
      <div className="space-y-section">
        <Scoreline
          status={OUTCOME_LABEL[outcome]}
          teamAName={teamA.name}
          scoreA={matchResult.scoreA}
          teamBName={teamB.name}
          scoreB={matchResult.scoreB}
          meta={`Ladder tier ${tier.tier} — ${tier.teamName}, ${tier.rating} rating`}
        />

        <div className="grid gap-block sm:grid-cols-2">
          <div className="card text-center">
            <p className="eyebrow">XP earned</p>
            <p className="num mt-1.5 flex items-center justify-center gap-2 text-3xl font-semibold text-accent">
              <Icon name="token" size={22} />
              +{xpEarned}
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

        <div className="card text-center">
          <h2 className="rule-heading mb-2">Nothing levels up on its own</h2>
          <p className="mx-auto max-w-[46ch] text-sm text-ink-2">
            That {xpEarned} XP is sitting in your wallet, not any one card. Head to your
            collection to put it toward whichever player you want to invest in — or save it
            for a pack.
          </p>
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
