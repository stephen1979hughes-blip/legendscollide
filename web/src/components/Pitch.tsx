import React from 'react';
import { CustomXIPlayer, FormationConfig } from '../types/customXI';

interface PitchProps {
  formation: FormationConfig;
  players: CustomXIPlayer[];
  onPlayerSelect: (playerId: string, slotIndex: number) => void;
  onPlayerRemove: (slotIndex: number) => void;
  availablePlayers: any[];
}

// Position compatibility mapping - which positions can play where
const POSITION_COMPATIBILITY: { [key: string]: string[] } = {
  'GK': ['GK'],
  'RB': ['RB', 'DF'],
  'CB': ['CB', 'DF'],
  'LB': ['LB', 'DF'],
  'RM': ['RM', 'RW', 'MF'],
  'CM': ['CM', 'MF'],
  'LM': ['LM', 'LW', 'MF'],
  'CAM': ['CAM', 'MF', 'ST'],
  'RW': ['RW', 'RM', 'FW'],
  'LW': ['LW', 'LM', 'FW'],
  'CF': ['CF', 'ST', 'FW'],
  'ST': ['ST', 'CF', 'FW']
};

export const Pitch: React.FC<PitchProps> = ({
  formation,
  players,
  onPlayerSelect,
  onPlayerRemove,
  availablePlayers
}) => {
  const getCompatiblePlayers = (slotIndex: number) => {
    const position = formation.positions[slotIndex];
    const compatiblePositions = POSITION_COMPATIBILITY[position] || [position];

    // Get players whose position is compatible and not already selected (or are the current player)
    const currentPlayer = players.find(p => p.slotIndex === slotIndex);

    return availablePlayers
      .filter(p =>
        compatiblePositions.includes(p.position) &&
        (!players.some(existingP => existingP.playerId === p.id) || currentPlayer?.playerId === p.id)
      )
      .sort((a, b) => b.overallRating - a.overallRating); // Sort by rating descending
  };

  const getPlayerAtSlot = (slotIndex: number): CustomXIPlayer | undefined => {
    return players.find((p) => p.slotIndex === slotIndex);
  };

  return (
    <div className="bg-white rounded-lg shadow p-8">
      <h3 className="text-lg font-bold text-primary mb-6 text-center">
        {formation.name} - {formation.description}
      </h3>

      {/* Pitch visualization */}
      <div className="bg-gradient-to-b from-green-700 to-green-600 rounded-lg p-6 aspect-video flex flex-col justify-between border-4 border-white">
        {formation.rows.map((row, rowIndex) => {
          // Determine spacing based on row type and number of players
          let justifyClass = 'justify-between';

          if (rowIndex === 0) {
            justifyClass = 'justify-center'; // GK always centered
          } else if (row.positionIndices.length === 1) {
            justifyClass = 'justify-center'; // Single player centered
          } else if (row.positionIndices.length === 2) {
            const rowAbove = rowIndex > 0 ? formation.rows[rowIndex - 1] : null;
            const numAbove = rowAbove ? rowAbove.positionIndices.length : 0;

            if (numAbove === 4 || numAbove === 5) {
              justifyClass = 'justify-between';
            } else {
              justifyClass = 'justify-center';
            }
          } else if (row.positionIndices.length === 3) {
            justifyClass = 'justify-around';
          }

          const gapClass = 'gap-4';
          const rowAboveWidth = rowIndex > 0 ? formation.rows[rowIndex - 1].positionIndices.length : 0;
          const shouldAddSpacers = row.positionIndices.length === 2 && (rowAboveWidth === 4 || rowAboveWidth === 5);

          if (shouldAddSpacers) {
            const is5PlayerAbove = rowAboveWidth === 5;

            if (is5PlayerAbove) {
              return (
                <div key={rowIndex} className={`flex ${justifyClass} items-center px-4 ${gapClass}`}>
                  <div className="w-16 h-16 invisible" />
                  <PositionSlot
                    slotIndex={row.positionIndices[0]}
                    position={formation.positions[row.positionIndices[0]]}
                    player={getPlayerAtSlot(row.positionIndices[0])}
                    compatiblePlayers={getCompatiblePlayers(row.positionIndices[0])}
                    onSelect={(playerId) => onPlayerSelect(playerId, row.positionIndices[0])}
                    onRemove={() => onPlayerRemove(row.positionIndices[0])}
                  />
                  <div className="w-16 h-16 invisible" />
                  <PositionSlot
                    slotIndex={row.positionIndices[1]}
                    position={formation.positions[row.positionIndices[1]]}
                    player={getPlayerAtSlot(row.positionIndices[1])}
                    compatiblePlayers={getCompatiblePlayers(row.positionIndices[1])}
                    onSelect={(playerId) => onPlayerSelect(playerId, row.positionIndices[1])}
                    onRemove={() => onPlayerRemove(row.positionIndices[1])}
                  />
                  <div className="w-16 h-16 invisible" />
                </div>
              );
            } else {
              return (
                <div key={rowIndex} className={`flex ${justifyClass} items-center px-4 ${gapClass}`}>
                  <div className="w-16 h-16 invisible" />
                  {row.positionIndices.map((slotIndex) => (
                    <PositionSlot
                      key={`slot-${slotIndex}`}
                      slotIndex={slotIndex}
                      position={formation.positions[slotIndex]}
                      player={getPlayerAtSlot(slotIndex)}
                      compatiblePlayers={getCompatiblePlayers(slotIndex)}
                      onSelect={(playerId) => onPlayerSelect(playerId, slotIndex)}
                      onRemove={() => onPlayerRemove(slotIndex)}
                    />
                  ))}
                  <div className="w-16 h-16 invisible" />
                </div>
              );
            }
          }

          return (
            <div key={rowIndex} className={`flex ${justifyClass} items-center px-4 ${gapClass}`}>
              {row.positionIndices.map((slotIndex) => (
                <PositionSlot
                  key={`slot-${slotIndex}`}
                  slotIndex={slotIndex}
                  position={formation.positions[slotIndex]}
                  player={getPlayerAtSlot(slotIndex)}
                  compatiblePlayers={getCompatiblePlayers(slotIndex)}
                  onSelect={(playerId) => onPlayerSelect(playerId, slotIndex)}
                  onRemove={() => onPlayerRemove(slotIndex)}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Formation info */}
      <div className="mt-6 text-center text-sm text-muted">
        <p>Click on a position to select a player</p>
        <p className="mt-2 font-semibold text-primary">
          {players.length}/{formation.positions.length} players selected
        </p>
      </div>
    </div>
  );
};

interface PositionSlotProps {
  slotIndex: number;
  position: string;
  player?: CustomXIPlayer;
  compatiblePlayers: any[];
  onSelect: (playerId: string) => void;
  onRemove: () => void;
}

const PositionSlot: React.FC<PositionSlotProps> = ({
  slotIndex,
  position,
  player,
  compatiblePlayers,
  onSelect,
  onRemove
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (player) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full border-2 border-white bg-green-500 hover:bg-green-400 text-white transition-all duration-100 w-20 h-20 flex flex-col items-center justify-center cursor-pointer"
        >
          <div className="text-xs font-bold truncate w-16 px-1">{player.playerName.replace(/\s*\(\d+\)$/, '').split(' ').pop()}</div>
          <div className="text-xs opacity-75">⭐ {player.overallRating}</div>
        </button>
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600"
          title="Remove player"
        >
          ×
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto min-w-48">
            {compatiblePlayers.length > 0 ? (
              <div className="py-2">
                {compatiblePlayers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelect(p.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 ${
                      player?.playerId === p.id ? 'bg-blue-100 font-semibold' : ''
                    }`}
                  >
                    <div className="font-semibold text-primary">{p.name}</div>
                    <div className="text-xs text-muted">⭐ {p.overallRating} • {p.position}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-2 text-sm text-muted">No compatible players</div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Empty slot
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full border-2 border-white border-dashed bg-green-600 hover:bg-green-500 text-white transition-all duration-100 w-20 h-20 flex flex-col items-center justify-center cursor-pointer opacity-70"
      >
        <div className="text-sm font-bold">{position}</div>
        <div className="text-xs opacity-75">+</div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto min-w-48">
          {compatiblePlayers.length > 0 ? (
            <div className="py-2">
              {compatiblePlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelect(p.id);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-semibold text-primary">{p.name}</div>
                  <div className="text-xs text-muted">⭐ {p.overallRating} • {p.position}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-2 text-sm text-muted">No compatible players</div>
          )}
        </div>
      )}
    </div>
  );
};
