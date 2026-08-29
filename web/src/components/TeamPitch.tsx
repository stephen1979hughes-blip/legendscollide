import React from 'react';
import { Link } from 'react-router-dom';
import { Player } from '../types';

interface TeamPitchProps {
  players: Player[];
}

interface FormationConfig {
  name: string;
  rows: {
    count: number;
    positions: Player[];
  }[];
}

const detectFormation = (players: Player[]): FormationConfig => {
  const positions = {
    GK: players.filter((p) => p.position === 'GK'),
    DF: players.filter((p) => p.position === 'DF'),
    MF: players.filter((p) => p.position === 'MF'),
    FW: players.filter((p) => p.position === 'FW'),
  };

  const gk = positions.GK.length;
  const df = positions.DF.length;
  const mf = positions.MF.length;
  const fw = positions.FW.length;

  let formation = '4-3-3';
  if (df === 3 && mf === 5) formation = '3-5-2';
  else if (df === 3 && mf === 4) formation = '3-4-3';
  else if (df === 5 && mf === 3) formation = '5-3-2';
  else if (df === 4 && mf === 2) formation = '4-2-3-1';
  else if (df === 4 && mf === 4) formation = '4-4-2';
  else formation = '4-3-3';

  return {
    name: formation,
    rows: [
      { count: gk, positions: positions.GK },
      { count: df, positions: positions.DF },
      { count: mf, positions: positions.MF },
      { count: fw, positions: positions.FW },
    ],
  };
};

const getRowJustify = (count: number): string => {
  switch (count) {
    case 1:
      return 'justify-center';
    case 2:
      return 'justify-center';
    case 3:
      return 'justify-center';
    case 4:
      return 'justify-center';
    case 5:
      return 'justify-center';
    default:
      return 'justify-center';
  }
};

const getLastName = (fullName: string): string => {
  const parts = fullName.trim().split(' ');
  return parts[parts.length - 1];
};

export const TeamPitch: React.FC<TeamPitchProps> = ({ players }) => {
  const formation = detectFormation(players);

  return (
    <div className="mb-12">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Formation</h2>
        <div className="inline-block bg-white/10 border border-white/20 rounded-lg px-4 py-2">
          <p className="text-lg text-white font-bold">{formation.name}</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur px-2 md:p-12 py-6 md:py-12 shadow-md overflow-x-auto">
        <div className="space-y-4 md:space-y-8 min-w-fit md:min-w-0">
          {formation.rows.map((row, rowIdx) => (
            row.count > 0 && (
              <div key={rowIdx} className={`flex ${getRowJustify(row.count)} gap-1 md:gap-4 px-0.5 md:px-0`}>
                {row.positions.map((player) => (
                  <Link
                    key={player.id}
                    to={`/player/${player.id}`}
                    className="rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 p-1.5 md:p-3 text-center text-xs md:text-sm flex-shrink-0 transition-colors duration-200 cursor-pointer"
                  >
                    <p className="text-xs text-white/60 font-semibold">{player.position}</p>
                    <p className="text-white font-semibold truncate max-w-16 md:max-w-24">{getLastName(player.name)}</p>
                    <p className="text-sm md:text-lg font-bold text-white">{player.overallRating}</p>
                  </Link>
                ))}
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
};
