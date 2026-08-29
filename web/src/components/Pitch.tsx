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

// Helper function to extract surname (last name) from full name
const getSurname = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 0 ? parts[parts.length - 1] : fullName;
};

export const Pitch: React.FC<PitchProps> = ({
  formation,
  players,
  onPlayerSelect,
  onPlayerRemove,
  availablePlayers
}) => {
  const [openDropdownSlot, setOpenDropdownSlot] = React.useState<number | null>(null);

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
    <div>
      {/* Pitch visualization */}
      <div className="bg-gradient-to-b from-green-700 to-green-600 px-0 md:px-8 py-2 md:py-8 flex flex-col justify-between min-h-80 md:min-h-96">
        {formation.rows.map((row, rowIndex) => {
          // Determine spacing based on row type and number of players
          let justifyClass = 'justify-start'; // Default: left-align

          if (rowIndex === 0) {
            justifyClass = 'justify-center'; // GK always centered
          } else if (row.positionIndices.length === 1) {
            justifyClass = 'justify-center'; // Single player centered
          } else if (row.positionIndices.length === 2) {
            justifyClass = 'justify-center'; // 2 players centered
          } else if (row.positionIndices.length === 3) {
            const rowAbove = rowIndex > 0 ? formation.rows[rowIndex - 1] : null;
            const numAbove = rowAbove ? rowAbove.positionIndices.length : 0;

            // If 5 above, need better centering
            if (numAbove === 5) {
              justifyClass = 'justify-center';
            } else {
              justifyClass = 'justify-around';
            }
          } else if (row.positionIndices.length === 4) {
            justifyClass = 'justify-around'; // 4 players spread with spacing
          } else if (row.positionIndices.length === 5) {
            justifyClass = 'justify-start'; // 5 players left-aligned
          }

          const gapClass = row.positionIndices.length >= 4 ? 'gap-0.5 md:gap-2' : 'gap-2 md:gap-4';
          const rowAboveWidth = rowIndex > 0 ? formation.rows[rowIndex - 1].positionIndices.length : 0;
          const shouldAddSpacers = (row.positionIndices.length === 2 && rowAboveWidth >= 3) ||
                                   (row.positionIndices.length === 3 && rowAboveWidth === 5);

          if (shouldAddSpacers) {
            // Handle 2-player rows with 4-player rows above (align with center 2)
            if (row.positionIndices.length === 2 && rowAboveWidth === 4) {
              return (
                <div key={rowIndex} className={`flex items-center ${gapClass}`}>
                  <div style={{ flex: 1 }} /> {/* Spacer to align with RM */}
                  {row.positionIndices.map((slotIndex) => (
                    <div key={`slot-${slotIndex}`} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                      <PositionSlot
                        slotIndex={slotIndex}
                        position={formation.positions[slotIndex]}
                        player={getPlayerAtSlot(slotIndex)}
                        compatiblePlayers={getCompatiblePlayers(slotIndex)}
                        onSelect={(playerId) => onPlayerSelect(playerId, slotIndex)}
                        onRemove={() => onPlayerRemove(slotIndex)}
                        isOpen={openDropdownSlot === slotIndex}
                        onOpenChange={(isOpen) => setOpenDropdownSlot(isOpen ? slotIndex : null)}
                        rowSize={row.positionIndices.length}
                      />
                    </div>
                  ))}
                  <div style={{ flex: 1 }} /> {/* Right spacer to align with LM */}
                </div>
              );
            }

            // Handle 3-player rows with 5-player rows above (align with middle 3)
            if (row.positionIndices.length === 3 && rowAboveWidth === 5) {
              return (
                <div key={rowIndex} className={`flex items-center ${gapClass}`}>
                  <div style={{ flex: 1 }} /> {/* Spacer to align with middle 3 of 5 players */}
                  {row.positionIndices.map((slotIndex) => (
                    <PositionSlot
                      key={`slot-${slotIndex}`}
                      slotIndex={slotIndex}
                      position={formation.positions[slotIndex]}
                      player={getPlayerAtSlot(slotIndex)}
                      compatiblePlayers={getCompatiblePlayers(slotIndex)}
                      onSelect={(playerId) => onPlayerSelect(playerId, slotIndex)}
                      onRemove={() => onPlayerRemove(slotIndex)}
                      isOpen={openDropdownSlot === slotIndex}
                      onOpenChange={(isOpen) => setOpenDropdownSlot(isOpen ? slotIndex : null)}
                      rowSize={row.positionIndices.length}
                    />
                  ))}
                  <div style={{ flex: 1 }} /> {/* Right spacer */}
                </div>
              );
            }

            // Center other narrower rows (2-player rows)
            return (
              <div key={rowIndex} className={`flex items-center justify-center ${gapClass}`}>
                {row.positionIndices.map((slotIndex) => (
                  <PositionSlot
                    key={`slot-${slotIndex}`}
                    slotIndex={slotIndex}
                    position={formation.positions[slotIndex]}
                    player={getPlayerAtSlot(slotIndex)}
                    compatiblePlayers={getCompatiblePlayers(slotIndex)}
                    onSelect={(playerId) => onPlayerSelect(playerId, slotIndex)}
                    onRemove={() => onPlayerRemove(slotIndex)}
                    isOpen={openDropdownSlot === slotIndex}
                    onOpenChange={(isOpen) => setOpenDropdownSlot(isOpen ? slotIndex : null)}
                  />
                ))}
              </div>
            );
          }

          return (
            <div key={rowIndex} className={`flex ${justifyClass} items-center px-0.5 md:px-4 ${gapClass}`}>
              {row.positionIndices.map((slotIndex) => (
                <PositionSlot
                  key={`slot-${slotIndex}`}
                  slotIndex={slotIndex}
                  position={formation.positions[slotIndex]}
                  player={getPlayerAtSlot(slotIndex)}
                  compatiblePlayers={getCompatiblePlayers(slotIndex)}
                  onSelect={(playerId) => onPlayerSelect(playerId, slotIndex)}
                  onRemove={() => onPlayerRemove(slotIndex)}
                  isOpen={openDropdownSlot === slotIndex}
                  onOpenChange={(isOpen) => setOpenDropdownSlot(isOpen ? slotIndex : null)}
                />
              ))}
            </div>
          );
        })}
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
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

interface PositionSlotProps {
  slotIndex: number;
  position: string;
  player?: CustomXIPlayer;
  compatiblePlayers: any[];
  onSelect: (playerId: string) => void;
  onRemove: () => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  rowSize?: number; // Number of players in this row
}

const PositionSlot: React.FC<PositionSlotProps> = ({
  slotIndex,
  position,
  player,
  compatiblePlayers,
  onSelect,
  onRemove,
  isOpen,
  onOpenChange,
  rowSize = 1
}) => {
  // Use flexible width for rows with 4+ players, fixed width otherwise
  const widthClass = rowSize >= 4 ? 'flex-1 min-w-12 md:min-w-24' : 'w-20 md:w-28';

  if (player) {
    const fullName = player.playerName.replace(/\s*\(\d+\)$/, '');
    const surname = getSurname(fullName);

    return (
      <div className="relative flex-shrink-0" style={rowSize >= 4 ? { flex: 1 } : {}}>
        <button
          onClick={() => onOpenChange(!isOpen)}
          className={`bg-white border-2 border-primary rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer ${widthClass} p-1 md:p-2 text-left text-xs md:text-sm`}
          title={fullName}
        >
          <div className="font-bold text-primary truncate">
            {surname}
          </div>
          <div className="text-xs text-muted">{player.playerPosition}</div>
          <div className="text-xs font-semibold text-primary mt-1">⭐ {player.overallRating}</div>
        </button>
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600 shadow"
          title="Remove player"
        >
          ×
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-32 left-1/2 transform -translate-x-1/2 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto min-w-56">
            {compatiblePlayers.length > 0 ? (
              <div className="py-2">
                {compatiblePlayers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelect(p.id);
                      onOpenChange(false);
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
    <div className="relative flex-shrink-0" style={rowSize >= 4 ? { flex: 1 } : {}}>
      <button
        onClick={() => onOpenChange(!isOpen)}
        className={`bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer ${widthClass} p-1 md:p-2 text-center text-gray-500 text-xs md:text-sm`}
      >
        <div className="font-bold">{position}</div>
        <div className="text-xs opacity-75">+ Add</div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-28 left-1/2 transform -translate-x-1/2 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto min-w-56">
          {compatiblePlayers.length > 0 ? (
            <div className="py-2">
              {compatiblePlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelect(p.id);
                    onOpenChange(false);
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
