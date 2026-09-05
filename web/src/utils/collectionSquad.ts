/**
 * Turns a saved custom XI sourced from the player collection into an
 * engine-ready Team plus the two Phase 2b seams services/api.ts's
 * toEngineTeam consumes: a level-per-player map (card progression, see
 * cardProgression.ts) and a rating-bonus-per-player map (nationality
 * chemistry, see chemistry.ts). Used by both the ordinary Custom XI flow
 * (when "My Collection" is picked as the club) and the campaign flow in
 * CustomXIBuilder.tsx, so the two stay consistent rather than one of them
 * quietly using flat/wrong ratings.
 *
 * Always resolves ratings fresh from the base player pool rather than from
 * whatever the Pitch was displaying (which shows the *current* effective
 * rating, per the roadmap's "always show ceiling alongside current"
 * requirement) — otherwise effectiveRating() would be applied twice.
 *
 * Returns two Team objects, not one. `team` carries true (ceiling) ratings
 * and is paired with `cardLevels` for `api.simulateMatch` — the engine needs
 * the true rating so it can apply `effectiveRating` itself. `displayTeam`
 * carries the already-resolved *current* rating and is what should be shown
 * anywhere a human reads a number off it (Broadcast, the match report, the
 * persisted campaign squad) — passing `team` there was a bug: it showed a
 * level-1 card's 90-rated ceiling in the lineup while the engine simulated
 * it at 75.
 */
import { Player, Team } from '../types';
import { CustomXIPlayer } from '../types/customXI';
import { cardCollectionStorage } from './cardCollectionStorage';
import { computeChemistryBonuses } from './chemistry';
import { effectiveRating } from './cardProgression';

/** The synthetic "club" id used for the collection-sourced entry in the club/nation picker. */
export const COLLECTION_CLUB_ID = '__collection__';

/** Persistent id for the campaign squad, so it's there again on the next campaign visit (and so Collection.tsx can find it to block sacrificing a fielded card). */
export const CAMPAIGN_XI_ID = 'campaign-squad';

export interface CollectionEngineTeam {
  team: Team;
  displayTeam: Team;
  cardLevels: Record<string, number>;
  chemistryBonus: Record<string, number>;
}

export function buildCollectionEngineTeam(
  xiPlayers: CustomXIPlayer[],
  allPlayersById: Map<string, Player>,
  id: string,
  name: string
): CollectionEngineTeam {
  const collection = cardCollectionStorage.loadAll();

  const squadPlayers: Player[] = xiPlayers.map((p) => {
    const base = allPlayersById.get(p.playerId);
    return {
      id: p.playerId,
      name: p.playerName,
      position: (base?.position ?? p.playerPosition ?? 'MF') as Player['position'],
      overallRating: base?.overallRating ?? p.overallRating,
      attackRating: base?.attackRating ?? p.overallRating,
      defenceRating: base?.defenceRating ?? p.overallRating,
      stamina: base?.stamina ?? 80,
      nationality: base?.nationality,
    };
  });

  const cardLevels: Record<string, number> = {};
  squadPlayers.forEach((p) => {
    cardLevels[p.id] = collection[p.id]?.level ?? 1;
  });

  const displayPlayers: Player[] = squadPlayers.map((p) => {
    const level = cardLevels[p.id];
    return {
      ...p,
      overallRating: effectiveRating(p.overallRating, level),
      attackRating: effectiveRating(p.attackRating, level),
      defenceRating: effectiveRating(p.defenceRating, level),
    };
  });

  return {
    team: {
      id,
      name,
      clubId: COLLECTION_CLUB_ID,
      year: new Date().getFullYear(),
      description: 'Collection XI',
      players: squadPlayers,
    },
    displayTeam: {
      id,
      name,
      clubId: COLLECTION_CLUB_ID,
      year: new Date().getFullYear(),
      description: 'Collection XI',
      players: displayPlayers,
    },
    cardLevels,
    chemistryBonus: computeChemistryBonuses(squadPlayers),
  };
}
