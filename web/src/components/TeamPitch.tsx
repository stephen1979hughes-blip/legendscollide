import React from 'react';
import { Link } from 'react-router-dom';
import { coarsePosition } from '../utils/position';
import { Player } from '../types';

interface TeamPitchProps {
  players: Player[];
}

/**
 * Left-to-right order within a row, keyed by granular position. Needed
 * because `coarsePosition` deliberately lumps RB/CB/LB (or RW/ST/LW) into
 * one group for the engine's attack/defence maths — which is exactly why a
 * row can't just render in whatever order the data happens to list them:
 * doing that put both wingers next to each other and both strikers next to
 * each other instead of wingers flanking the strikers, e.g. Man Utd 2008's
 * front four coming out "Ronaldo(RW) Giggs(LW) Tevez(ST) Rooney(ST)" instead
 * of the correct shape. Central positions (and anything unrecognised) sort
 * to the middle; ties keep their original relative order (Array#sort is
 * stable) since it doesn't matter which of two centre-backs is drawn left
 * of the other.
 *
 * The pitch is drawn keeper-at-bottom, attack-at-top — i.e. the view from
 * standing behind this team's own goal, facing the same way they attack.
 * From there a right-sided player's right is the viewer's right too (no
 * mirroring, unlike a "team photo" facing the camera), so RB/RW/RM sort to
 * the right and LB/LW/LM to the left.
 */
const LATERAL_ORDER: Record<string, number> = {
  LB: 0, LWB: 0, LM: 0, LW: 0,
  RB: 2, RWB: 2, RM: 2, RW: 2,
};
const lateralPosition = (position: string): number => LATERAL_ORDER[position.toUpperCase()] ?? 1;

/**
 * Group the XI into pitch rows.
 *
 * These filters used to compare `p.position` directly against 'DF' / 'MF' /
 * 'FW'. The dataset stores specific positions (CB, RB, CM, ST, RW…), so only
 * the goalkeeper ever matched and the pitch rendered one player out of eleven.
 */
const buildFormation = (players: Player[]) => {
  const group = (g: 'GK' | 'DF' | 'MF' | 'FW') =>
    players
      .filter((p) => coarsePosition(p.position) === g)
      .sort((a, b) => lateralPosition(a.position) - lateralPosition(b.position));

  const rows = { GK: group('GK'), DF: group('DF'), MF: group('MF'), FW: group('FW') };

  /**
   * Read the shape off the squad rather than matching it against a table of
   * named formations. The old lookup mapped 4 defenders + 2 midfielders to
   * "4-2-3-1" regardless of how many forwards there were, so Brazil 1970 —
   * four defenders, two midfielders, four forwards, a genuine 4-2-4 — was
   * labelled 4-2-3-1. Counting is always right; guessing the name isn't.
   */
  const name = `${rows.DF.length}-${rows.MF.length}-${rows.FW.length}`;

  // Attack at the top, keeper at the bottom — the way a team sheet is drawn.
  return { name, rows: [rows.FW, rows.MF, rows.DF, rows.GK] };
};

const getLastName = (fullName: string): string => {
  const parts = fullName.trim().split(' ');
  return parts[parts.length - 1];
};

export const TeamPitch: React.FC<TeamPitchProps> = ({ players }) => {
  const formation = buildFormation(players);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="rule-heading flex-1">Formation</h2>
        <span className="chip-accent num flex-shrink-0">{formation.name}</span>
      </div>

      <div className="relative overflow-x-auto rounded-card border border-line bg-surface px-3 py-8 md:px-8 md:py-10">
        {/* Pitch markings: halfway line, centre circle, penalty area. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.35]">
          <div className="absolute left-0 right-0 top-1/2 h-px bg-line-strong" />
          <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-line-strong" />
          <div className="absolute bottom-0 left-1/2 h-12 w-2/5 -translate-x-1/2 border-x border-t border-line-strong" />
          <div className="absolute left-1/2 top-0 h-12 w-2/5 -translate-x-1/2 border-x border-b border-line-strong" />
        </div>

        <div className="relative min-w-fit space-y-5 md:space-y-8">
          {formation.rows.map(
            (row, rowIdx) =>
              row.length > 0 && (
                <div key={rowIdx} className="flex justify-center gap-1.5 md:gap-3">
                  {row.map((player) => (
                    <Link
                      key={player.id}
                      to={`/player/${player.id}`}
                      className="w-[68px] flex-shrink-0 rounded-ctl border border-line bg-raised px-1.5 py-2 text-center transition-colors duration-150 hover:border-accent md:w-[92px] md:px-2.5"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">
                        {player.position}
                      </p>
                      <p className="truncate text-xs font-medium text-ink md:text-sm">
                        {getLastName(player.name)}
                      </p>
                      <p className="num mt-0.5 text-base font-semibold text-accent md:text-lg">
                        {player.overallRating}
                      </p>
                    </Link>
                  ))}
                </div>
              )
          )}
        </div>
      </div>
    </section>
  );
};
