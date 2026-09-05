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
          className={`rounded-ctl border border-line bg-raised transition-colors hover:border-accent cursor-pointer ${widthClass} p-1 md:p-2 text-left text-xs md:text-sm`}
          title={fullName}
        >
          <div className="display truncate text-sm text-ink">
            {surname}
          </div>
          <div className="text-xs text-ink-3">{player.playerPosition}</div>
          <div className="num mt-1 text-xs font-semibold text-accent">
            {player.overallRating}
            {player.ceiling !== undefined && player.ceiling !== player.overallRating && (
              <span className="text-ink-3 font-normal"> → {player.ceiling}</span>
            )}
          </div>
          {player.level !== undefined && (
            <div className="text-[10px] text-ink-3">Lv {player.level}</div>
          )}
        </button>
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full border border-line bg-surface text-xs font-semibold text-ink-3 transition-colors hover:border-danger hover:text-danger"
          title="Remove player"
        >
          ×
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-50 max-h-48 min-w-56 overflow-y-auto rounded-card border border-line bg-surface shadow-pop">
            {compatiblePlayers.length > 0 ? (
              <div className="py-2">
                {compatiblePlayers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelect(p.id);
                      onOpenChange(false);
                    }}
                    className={`w-full border-b border-line px-4 py-2 text-left transition-colors last:border-b-0 hover:bg-raised ${
                      player?.playerId === p.id ? 'bg-raised' : ''
                    }`}
                  >
                    <div className="display text-sm text-ink">{p.name}</div>
                    <div className="text-xs text-ink-3">
                      {p.overallRating}
                      {p.ceiling !== undefined && p.ceiling !== p.overallRating && ` → ${p.ceiling}`}
                      {' • '}{p.position}
                      {p.level !== undefined && ` • Lv ${p.level}`}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-2 text-sm text-ink-3">No compatible players</div>
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
        className={`rounded-ctl border border-dashed border-line-strong bg-surface/60 transition-colors hover:border-accent hover:bg-raised cursor-pointer ${widthClass} p-1 md:p-2 text-center text-ink-3 text-xs md:text-sm`}
      >
        <div className="font-bold">{position}</div>
        <div className="text-xs opacity-75">+ Add</div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-28 left-1/2 transform -translate-x-1/2 z-50 max-h-48 min-w-56 overflow-y-auto rounded-card border border-line bg-surface shadow-pop">
          {compatiblePlayers.length > 0 ? (
            <div className="py-2">
              {compatiblePlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelect(p.id);
                    onOpenChange(false);
                  }}
                  className="w-full border-b border-line px-4 py-2 text-left transition-colors last:border-b-0 hover:bg-raised"
                >
                  <div className="display text-sm text-ink">{p.name}</div>
                  <div className="text-xs text-ink-3">
                    {p.overallRating}
                    {p.ceiling !== undefined && p.ceiling !== p.overallRating && ` → ${p.ceiling}`}
                    {' • '}{p.position}
                    {p.level !== undefined && ` • Lv ${p.level}`}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-2 text-sm text-ink-3">No compatible players</div>
          )}
        </div>
      )}
    </div>
  );
};
