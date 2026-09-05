import React from 'react';

interface ScorelineProps {
  teamAName: string;
  teamAYear?: number;
  scoreA: number;
  teamBName: string;
  teamBYear?: number;
  scoreB: number;
  /** Stadium, kick-off status, or match minute — sits under the score. */
  meta?: React.ReactNode;
  /** Small eyebrow above the score, e.g. "Full time". */
  status?: string;
  size?: 'lg' | 'sm';
}

/**
 * The scoreline, in the one place it's defined. Result, Broadcast, the daily
 * fixture and the campaign all showed one and each built its own; they now
 * share these proportions, so a score reads the same wherever you meet it.
 *
 * Playfair is deliberate here — this and team names are what the display face
 * is reserved for.
 */
export const Scoreline: React.FC<ScorelineProps> = ({
  teamAName,
  teamAYear,
  scoreA,
  teamBName,
  teamBYear,
  scoreB,
  meta,
  status,
  size = 'lg',
}) => {
  const winner = scoreA === scoreB ? null : scoreA > scoreB ? 'a' : 'b';

  const Side = ({ name, year, side }: { name: string; year?: number; side: 'a' | 'b' }) => (
    <div className={`min-w-0 flex-1 ${side === 'b' ? 'text-right' : ''}`}>
      <p
        className={`display truncate ${size === 'lg' ? 'text-xl md:text-2xl' : 'text-base'} ${
          winner && winner !== side ? 'text-ink-2' : 'text-ink'
        }`}
      >
        {name}
      </p>
      {year !== undefined && <p className="num text-xs text-ink-3">{year}</p>}
    </div>
  );

  return (
    <div className="panel px-5 py-6">
      {status && <p className="eyebrow mb-4 text-center">{status}</p>}

      <div className="flex items-center gap-4 md:gap-8">
        <Side name={teamAName} year={teamAYear} side="a" />

        <div className="flex flex-shrink-0 items-center gap-3">
          <span
            className={`display num ${size === 'lg' ? 'text-5xl md:text-6xl' : 'text-3xl'} ${
              winner === 'a' ? 'text-accent' : 'text-ink'
            }`}
          >
            {scoreA}
          </span>
          <span className={`text-ink-3 ${size === 'lg' ? 'text-2xl' : 'text-lg'}`}>–</span>
          <span
            className={`display num ${size === 'lg' ? 'text-5xl md:text-6xl' : 'text-3xl'} ${
              winner === 'b' ? 'text-accent' : 'text-ink'
            }`}
          >
            {scoreB}
          </span>
        </div>

        <Side name={teamBName} year={teamBYear} side="b" />
      </div>

      {meta && <p className="mt-4 text-center text-xs text-ink-3">{meta}</p>}
    </div>
  );
};
