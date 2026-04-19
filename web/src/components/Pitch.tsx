import React from 'react';
import { CustomXIPlayer, FormationConfig } from '../types/customXI';

interface PitchProps {
  formation: FormationConfig;
  players: CustomXIPlayer[];
  onPlayerDrop: (playerId: string, slotIndex: number) => void;
  onPlayerRemove: (slotIndex: number) => void;
  availablePlayers: any[];
}

export const Pitch: React.FC<PitchProps> = ({
  formation,
  players,
  onPlayerDrop,
  onPlayerRemove,
  availablePlayers
}) => {
  const scrollIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollSpeedRef = React.useRef<number>(0);

  const startAutoScroll = (clientY: number) => {
    const scrollZone = 150;
    const windowHeight = window.innerHeight;

    let speed = 0;
    if (clientY < scrollZone) {
      speed = -Math.max(10, (scrollZone - clientY) * 1.2);
    } else if (clientY > windowHeight - scrollZone) {
      speed = Math.max(10, (clientY - (windowHeight - scrollZone)) * 1.2);
    }

    scrollSpeedRef.current = speed;

    if (speed !== 0 && !scrollIntervalRef.current) {
      scrollIntervalRef.current = setInterval(() => {
        if (scrollSpeedRef.current !== 0) {
          window.scrollBy(0, scrollSpeedRef.current);
        }
      }, 16); // ~60fps
    } else if (speed === 0 && scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    scrollSpeedRef.current = 0;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-blue-50');
    startAutoScroll(e.clientY);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only remove highlight if leaving the entire pitch container
    if (e.currentTarget === e.target) {
      e.currentTarget.classList.remove('bg-blue-50');
      stopAutoScroll();
    }
  };

  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    // Remove highlight from pitch container
    const pitchContainer = e.currentTarget;
    if (pitchContainer.classList.contains('bg-blue-50')) {
      pitchContainer.classList.remove('bg-blue-50');
    }

    stopAutoScroll();
    const playerId = e.dataTransfer.getData('playerId');
    console.log('Drop event on slot', slotIndex, 'with playerId:', playerId);
    if (playerId) {
      onPlayerDrop(playerId, slotIndex);
    } else {
      console.warn('No playerId found in drag data');
    }
  };

  const getPlayerAtSlot = (slotIndex: number): CustomXIPlayer | undefined => {
    return players.find((p) => p.slotIndex === slotIndex);
  };

  const positionLabels: { [key: string]: string } = {
    GK: 'GK',
    LB: 'LB',
    CB: 'CB',
    RB: 'RB',
    LM: 'LM',
    CM: 'CM',
    RM: 'RM',
    CAM: 'CAM',
    LW: 'LW',
    RW: 'RW',
    ST: 'ST',
    CF: 'CF'
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
            // 2 players: for strikers under wider midfield, position at inner 2 slots
            // Check row above for context
            const rowAbove = rowIndex > 0 ? formation.rows[rowIndex - 1] : null;
            const numAbove = rowAbove ? rowAbove.positionIndices.length : 0;

            if (numAbove === 4 || numAbove === 5) {
              // Align with inner midfielder positions using invisible spacers
              justifyClass = 'justify-between';
            } else {
              justifyClass = 'justify-center';
            }
          } else if (row.positionIndices.length === 3) {
            justifyClass = 'justify-around'; // 3 players align with row above
          }
          // 4+ players use justify-between (spread wide)

          const gapClass = 'gap-4';

          // For 2-player rows with wider rows above, add invisible spacers for alignment
          const rowAboveWidth = rowIndex > 0 ? formation.rows[rowIndex - 1].positionIndices.length : 0;
          const shouldAddSpacers = row.positionIndices.length === 2 && (rowAboveWidth === 4 || rowAboveWidth === 5);

          if (shouldAddSpacers) {
            // For 4-player rows (4-4-2, 3-4-3): spacers on both sides = [spacer] ST ST [spacer]
            // For 5-player rows (3-5-2): spacers between and around = [spacer] ST [spacer] ST [spacer]
            const is5PlayerAbove = rowAboveWidth === 5;

            if (is5PlayerAbove) {
              return (
                <div
                  key={rowIndex}
                  className={`flex ${justifyClass} items-center px-4 ${gapClass}`}
                >
                  <div className="w-16 h-16 invisible" />
                  <PositionSlot
                    key={`slot-${row.positionIndices[0]}`}
                    position={formation.positions[row.positionIndices[0]]}
                    player={getPlayerAtSlot(row.positionIndices[0])}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, row.positionIndices[0])}
                    onRemove={() => onPlayerRemove(row.positionIndices[0])}
                  />
                  <div className="w-16 h-16 invisible" />
                  <PositionSlot
                    key={`slot-${row.positionIndices[1]}`}
                    position={formation.positions[row.positionIndices[1]]}
                    player={getPlayerAtSlot(row.positionIndices[1])}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, row.positionIndices[1])}
                    onRemove={() => onPlayerRemove(row.positionIndices[1])}
                  />
                  <div className="w-16 h-16 invisible" />
                </div>
              );
            } else {
              // 4-player row above
              return (
                <div
                  key={rowIndex}
                  className={`flex ${justifyClass} items-center px-4 ${gapClass}`}
                >
                  <div className="w-16 h-16 invisible" />
                  {row.positionIndices.map((slotIndex) => {
                    const pos = formation.positions[slotIndex];
                    return (
                      <PositionSlot
                        key={`slot-${slotIndex}`}
                        position={pos}
                        player={getPlayerAtSlot(slotIndex)}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, slotIndex)}
                        onRemove={() => onPlayerRemove(slotIndex)}
                      />
                    );
                  })}
                  <div className="w-16 h-16 invisible" />
                </div>
              );
            }
          }

          return (
            <div
              key={rowIndex}
              className={`flex ${justifyClass} items-center px-4 ${gapClass}`}
            >
              {row.positionIndices.map((slotIndex) => {
                const pos = formation.positions[slotIndex];
                return (
                  <PositionSlot
                    key={`slot-${slotIndex}`}
                    position={pos}
                    player={getPlayerAtSlot(slotIndex)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, slotIndex)}
                    onRemove={() => onPlayerRemove(slotIndex)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Formation info */}
      <div className="mt-6 text-center text-sm text-muted">
        <p>Drag players from the list below to assign them to positions</p>
        <p className="mt-2 font-semibold text-primary">
          {players.length}/{formation.positions.length} players selected
        </p>
      </div>
    </div>
  );
};

interface PositionSlotProps {
  position: string;
  player?: CustomXIPlayer;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onRemove: () => void;
}

const PositionSlot: React.FC<PositionSlotProps> = ({
  position,
  player,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemove
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const dragLeaveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDragOverLocal = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Clear any pending drag leave timeout
    if (dragLeaveTimeoutRef.current) {
      clearTimeout(dragLeaveTimeoutRef.current);
      dragLeaveTimeoutRef.current = null;
    }

    setIsDragOver(true);
    onDragOver(e);
  };

  const handleDragLeaveLocal = (e: React.DragEvent) => {
    // Use a small delay to prevent flickering from child elements
    dragLeaveTimeoutRef.current = setTimeout(() => {
      setIsDragOver(false);
      onDragLeave(e);
    }, 50);
  };

  const handleDropLocal = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Clear any pending timeout
    if (dragLeaveTimeoutRef.current) {
      clearTimeout(dragLeaveTimeoutRef.current);
      dragLeaveTimeoutRef.current = null;
    }

    setIsDragOver(false);
    onDrop(e);
  };

  return (
    <div
      onDragOver={handleDragOverLocal}
      onDragLeave={handleDragLeaveLocal}
      onDrop={handleDropLocal}
      className={`rounded-full border-2 border-white bg-green-500 cursor-pointer flex items-center justify-center text-white transition-all duration-100 ${
        isDragOver
          ? 'w-28 h-28 bg-blue-400 shadow-xl ring-4 ring-blue-300'
          : 'w-20 h-20 hover:bg-green-400'
      }`}
    >
      {player ? (
        <div className="text-center">
          <div className="text-xs font-bold truncate w-16 px-1">{player.playerName.replace(/\s*\(\d+\)$/, '').split(' ').pop()}</div>
          <div className="text-xs opacity-75">⭐ {player.overallRating}</div>
          {player && (
            <button
              onClick={onRemove}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-600"
              title="Remove player"
            >
              ×
            </button>
          )}
        </div>
      ) : (
        <div className="text-center">
          <div className="text-sm font-bold">{position}</div>
          <div className="text-xs opacity-75">+</div>
        </div>
      )}
    </div>
  );
};
