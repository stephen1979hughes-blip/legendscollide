import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Pitch } from '../components/Pitch';
import { api } from '../services/api';
import { CustomXI, CustomXIPlayer, FORMATIONS, FormationConfig } from '../types/customXI';
import { customXIStorage } from '../utils/customXIStorage';
import { TeamSummary, Team, Club, Player } from '../types';
import { processTeamsData } from '../utils/dataProcessor';

// Define position display order
const POSITION_ORDER: { [key: string]: number } = {
  'GK': 0,
  'RB': 1,
  'CB': 2,
  'LB': 3,
  'RM': 4,
  'CM': 5,
  'LM': 6,
  'ST': 7,
  'CF': 8,
  'CAM': 9,
  'LW': 10,
  'RW': 11,
  'DF': 12,
  'MF': 13,
  'FW': 14,
};

const sortPlayersByPosition = (players: Player[]): Player[] => {
  return [...players].sort((a, b) => {
    const orderA = POSITION_ORDER[a.position] ?? 999;
    const orderB = POSITION_ORDER[b.position] ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    // If same position, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });
};

export const CustomXIBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [selectedFormation, setSelectedFormation] = useState<FormationConfig>(FORMATIONS[0]);
  const [players, setPlayers] = useState<CustomXIPlayer[]>([]);
  const [savedXI, setSavedXI] = useState<CustomXI | null>(null);
  const [loading, setLoading] = useState(false);
  const [opponentId, setOpponentId] = useState<string>('');
  const [opponentType, setOpponentType] = useState<'existing' | 'custom'>('existing');
  const [customOpponentId, setCustomOpponentId] = useState<string>('');
  const [savedXIs, setSavedXIs] = useState<CustomXI[]>([]);
  const [availableTeams, setAvailableTeams] = useState<TeamSummary[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const dragStateRef = React.useRef({ isDragging: false, mouseY: 0 });
  const animationIdRef = React.useRef<number | null>(null);

  useEffect(() => {
    const loadClubsData = async () => {
      try {
        const response = await fetch('/teams-data.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rawData = await response.json();
        const { clubs: loadedClubs, teams } = processTeamsData(rawData);

        if (loadedClubs && loadedClubs.length > 0) {
          setClubs(loadedClubs);

          // Load saved XIs
          const allSavedXIs = customXIStorage.loadAll();
          setSavedXIs(allSavedXIs);

          // Load active/last saved XI if available
          const saved = customXIStorage.load();
          if (saved) {
            setSavedXI(saved);
            setPlayers(saved.players);

            // Find and set the club and formation
            const club = loadedClubs.find(c => c.id === saved.clubId);
            if (club) {
              setSelectedClub(club);
            }

            const formation = FORMATIONS.find(f => f.code === saved.formation);
            if (formation) {
              setSelectedFormation(formation);
            }
          }
        } else {
          console.warn('No clubs loaded from data');
        }

        // Also load teams for opponent selection
        if (teams && teams.length > 0) {
          const teamSummaries = teams.map(team => ({
            id: team.id,
            name: team.name,
            clubId: team.clubId,
            year: team.year,
            playerCount: team.players?.length || 0
          }));
          setAvailableTeams(teamSummaries);
        }
      } catch (error) {
        console.error('Failed to load clubs data:', error);
      } finally {
        setDataLoaded(true);
      }
    };

    loadClubsData();
  }, []);

  // Smart drag auto-scroll that helps users scroll to the pitch when dragging from players list
  useEffect(() => {
    const scrollZone = 150;
    let scrollIntervalRef: ReturnType<typeof setInterval> | null = null;

    const performScroll = () => {
      if (!dragStateRef.current.isDragging) {
        if (scrollIntervalRef) {
          clearInterval(scrollIntervalRef);
          scrollIntervalRef = null;
        }
        return;
      }

      const clientY = dragStateRef.current.mouseY;
      const windowHeight = window.innerHeight;

      let speed = 0;

      // Only scroll if near top or bottom edges
      if (clientY < scrollZone) {
        // Scroll up faster the closer to the top
        speed = -Math.max(10, (scrollZone - clientY) * 1.2);
      } else if (clientY > windowHeight - scrollZone) {
        // Scroll down faster the closer to the bottom
        speed = Math.max(10, (clientY - (windowHeight - scrollZone)) * 1.2);
      }

      if (speed !== 0) {
        window.scrollBy(0, speed);
      }
    };

    const handleDragStart = (e: DragEvent) => {
      dragStateRef.current.isDragging = true;
      dragStateRef.current.mouseY = e.clientY;
      console.log('Global dragstart event at clientY:', e.clientY);

      // Start continuous scrolling
      if (scrollIntervalRef) clearInterval(scrollIntervalRef);
      scrollIntervalRef = setInterval(performScroll, 16); // ~60fps
    };

    const handleDragOver = (e: DragEvent) => {
      dragStateRef.current.mouseY = e.clientY;
    };

    const handleDragEnd = () => {
      console.log('Global dragend event');
      dragStateRef.current.isDragging = false;
      if (scrollIntervalRef) {
        clearInterval(scrollIntervalRef);
        scrollIntervalRef = null;
      }
    };

    // Use capture phase to catch events before React
    document.addEventListener('dragstart', handleDragStart, true);
    document.addEventListener('dragover', handleDragOver, true);
    document.addEventListener('dragend', handleDragEnd, true);
    document.addEventListener('dragleave', handleDragEnd, true);
    document.addEventListener('drop', handleDragEnd, true);

    return () => {
      document.removeEventListener('dragstart', handleDragStart, true);
      document.removeEventListener('dragover', handleDragOver, true);
      document.removeEventListener('dragend', handleDragEnd, true);
      document.removeEventListener('dragleave', handleDragEnd, true);
      document.removeEventListener('drop', handleDragEnd, true);
      if (scrollIntervalRef) {
        clearInterval(scrollIntervalRef);
      }
    };
  }, []);

  const handleClubSelect = (clubId: string) => {
    const club = clubs.find(c => c.id === clubId);
    if (club) {
      setSelectedClub(club);
      setPlayers([]);
      setOpponentId('');
      setSavedXI(null);
    }
  };

  const handleFormationSelect = (formation: FormationConfig) => {
    setSelectedFormation(formation);
    // Reset players when changing formation
    setPlayers([]);
  };

  const handlePlayerDrop = (playerId: string, slotIndex: number) => {
    console.log('handlePlayerDrop called with:', { playerId, slotIndex, selectedClubId: selectedClub?.id });

    if (!selectedClub || !selectedClub.allTimePlayers) {
      console.warn('No club selected or no players available');
      return;
    }

    const player = selectedClub.allTimePlayers.find((p) => p.id === playerId);
    console.log('Found player:', player);
    if (!player) {
      console.warn('Player not found:', playerId);
      return;
    }

    // Remove if already assigned to a different slot
    const updated = players.filter((p) => p.playerId !== playerId);

    // Remove if there's already someone at this slot
    const atSlot = updated.filter((p) => p.slotIndex !== slotIndex);

    // Add the new player
    const newPlayer = {
      slotIndex,
      playerId,
      playerName: player.name,
      playerPosition: player.position,
      overallRating: player.overallRating
    };

    atSlot.push(newPlayer);
    console.log('Updated players:', atSlot);

    setPlayers(atSlot);
  };

  const handlePlayerRemove = (slotIndex: number) => {
    setPlayers((prev) => prev.filter((p) => p.slotIndex !== slotIndex));
  };

  const handleSaveXI = () => {
    if (!selectedClub || players.length !== selectedFormation.positions.length) return;

    const xi: CustomXI = {
      id: Date.now().toString(),
      clubId: selectedClub.id,
      clubName: selectedClub.name,
      formation: selectedFormation.code,
      players,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    customXIStorage.save(xi);
    setSavedXI(xi);
    // Reload all saved XIs
    setSavedXIs(customXIStorage.loadAll());
  };

  const handleSimulate = async () => {
    if (!selectedClub || !savedXI || players.length !== selectedFormation.positions.length) return;

    setLoading(true);
    try {
      if (opponentType === 'existing') {
        if (!opponentId) {
          setLoading(false);
          return;
        }

        const opponentTeam = await api.getTeam(opponentId);

        // For custom XI simulation, use a dummy team ID to generate the match result
        const matchResult = await api.simulateMatch(opponentId, opponentId, false);

        // Create a Team object for the custom XI with the saved players
        const customXITeam: Team = {
          id: 'custom-xi-' + selectedClub.id,
          name: selectedClub.name + ' (Custom XI)',
          clubId: selectedClub.id,
          year: new Date().getFullYear(),
          description: 'Custom All-Time XI',
          players: savedXI?.players.map(p => ({
            id: p.playerId,
            name: p.playerName,
            position: (p.playerPosition || 'MF') as 'GK' | 'DF' | 'MF' | 'FW',
            overallRating: p.overallRating,
            attackRating: 75,
            defenceRating: 75,
            stamina: 85
          })) || []
        };

        navigate('/broadcast', {
          state: {
            matchResult,
            teamA: customXITeam,
            teamB: opponentTeam,
            customXI: savedXI,
            useCustomXIRoster: true
          }
        });
      } else if (opponentType === 'custom') {
        if (!customOpponentId) {
          setLoading(false);
          return;
        }

        const opponentXI = customXIStorage.loadById(customOpponentId);
        if (!opponentXI) {
          alert('Opponent XI not found');
          setLoading(false);
          return;
        }

        // Generate match result between the two custom XIs
        const matchResult = await api.simulateMatch('custom-xi-a', 'custom-xi-b', false);

        // Create Team objects for both custom XIs
        const customXITeamA: Team = {
          id: 'custom-xi-' + selectedClub.id,
          name: selectedClub.name + ' (Custom XI)',
          clubId: selectedClub.id,
          year: new Date().getFullYear(),
          description: 'Custom All-Time XI',
          players: savedXI?.players.map(p => ({
            id: p.playerId,
            name: p.playerName,
            position: (p.playerPosition || 'MF') as 'GK' | 'DF' | 'MF' | 'FW',
            overallRating: p.overallRating,
            attackRating: 75,
            defenceRating: 75,
            stamina: 85
          })) || []
        };

        const customXITeamB: Team = {
          id: 'custom-xi-' + opponentXI.clubId,
          name: opponentXI.clubName + ' (Custom XI)',
          clubId: opponentXI.clubId,
          year: new Date().getFullYear(),
          description: 'Custom All-Time XI',
          players: opponentXI.players.map(p => ({
            id: p.playerId,
            name: p.playerName,
            position: (p.playerPosition || 'MF') as 'GK' | 'DF' | 'MF' | 'FW',
            overallRating: p.overallRating,
            attackRating: 75,
            defenceRating: 75,
            stamina: 85
          }))
        };

        navigate('/broadcast', {
          state: {
            matchResult,
            teamA: customXITeamA,
            teamB: customXITeamB
          }
        });
      }
    } catch (error) {
      console.error('Simulation failed:', error);
      alert(`Simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showBack />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        <h1 className="text-4xl font-heading font-bold text-primary mb-8">Build Your All-Time XI</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Club/Formation Selection */}
          <div className="space-y-6">
            {/* Club Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-primary mb-4">Select Club/Nation</h3>
              {!dataLoaded ? (
                <div className="text-center text-muted py-4">Loading clubs...</div>
              ) : clubs.length === 0 ? (
                <div className="text-center text-red-500 py-4">Failed to load clubs. Please refresh the page.</div>
              ) : (
                <select
                  onChange={(e) => handleClubSelect(e.target.value)}
                  value={selectedClub?.id || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Choose a club...</option>
                  {clubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Formation Selection */}
            {selectedClub && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-primary mb-4">Select Formation</h3>
                <div className="space-y-2">
                  {FORMATIONS.map((formation) => (
                    <button
                      key={formation.code}
                      onClick={() => handleFormationSelect(formation)}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition ${
                        selectedFormation.code === formation.code
                          ? 'border-primary bg-blue-50'
                          : 'border-gray-200 hover:border-primary'
                      }`}
                    >
                      <p className="font-semibold text-primary">{formation.name}</p>
                      <p className="text-sm text-muted">{formation.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Save XI */}
            {selectedClub && players.length === selectedFormation.positions.length && (
              <div className="bg-white rounded-lg shadow p-6 space-y-3">
                <button
                  onClick={handleSaveXI}
                  className="w-full bg-primary text-white font-semibold py-2 rounded-lg hover:opacity-90 transition"
                >
                  {savedXI ? '✓ Save XI' : 'Save XI'}
                </button>
              </div>
            )}

            {/* XI Summary */}
            {savedXI && (
              <div className="bg-primary bg-opacity-5 rounded-lg border-2 border-primary p-6 space-y-2">
                <h4 className="font-bold text-primary">Your XI</h4>
                <p className="text-sm text-muted">{savedXI.clubName}</p>
                <p className="text-sm text-muted">Formation: {savedXI.formation}</p>
                <p className="text-sm font-semibold text-primary mt-2">Players ({savedXI.players.length}):</p>
                <div className="text-xs text-muted space-y-1">
                  {savedXI.players.sort((a, b) => a.slotIndex - b.slotIndex).map((p) => (
                    <div key={p.slotIndex} className="flex justify-between">
                      <span>{p.playerName}</span>
                      <span className="text-primary">⭐ {p.overallRating}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Saved XIs List */}
            {savedXIs.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 space-y-3">
                <h4 className="font-bold text-primary mb-3">Saved Custom XIs ({savedXIs.length})</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {savedXIs.map((xi) => (
                    <div
                      key={xi.id}
                      className={`p-3 rounded-lg border-2 transition cursor-pointer ${
                        savedXI?.id === xi.id
                          ? 'border-primary bg-blue-50'
                          : 'border-gray-200 hover:border-primary hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-primary">{xi.clubName}</p>
                          <p className="text-xs text-muted">Formation: {xi.formation}</p>
                          <p className="text-xs text-muted">{xi.players.length} players</p>
                        </div>
                        {savedXI?.id === xi.id && (
                          <span className="text-xs bg-primary text-white px-2 py-1 rounded">Active</span>
                        )}
                      </div>
                      {savedXI?.id !== xi.id && (
                        <button
                          onClick={() => {
                            setSavedXI(xi);
                            setPlayers(xi.players);
                            const club = clubs.find(c => c.id === xi.clubId);
                            if (club) setSelectedClub(club);
                            const formation = FORMATIONS.find(f => f.code === xi.formation);
                            if (formation) setSelectedFormation(formation);
                          }}
                          className="mt-2 w-full text-xs bg-primary text-white py-1 rounded hover:opacity-90 transition"
                        >
                          Load XI
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements Checklist */}
            <div className="bg-blue-50 rounded-lg p-6 space-y-3">
              <h3 className="font-bold text-primary mb-3">Ready to Simulate?</h3>
              <div className="space-y-2 text-sm">
                <div className={`flex items-center ${selectedClub ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="mr-2">{selectedClub ? '✓' : '✗'}</span>
                  <span>{selectedClub ? `Club Selected: ${selectedClub.name}` : 'Select a club/team'}</span>
                </div>
                <div className={`flex items-center ${players.length === selectedFormation.positions.length ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="mr-2">{players.length === selectedFormation.positions.length ? '✓' : '✗'}</span>
                  <span>All {selectedFormation.positions.length} positions filled ({players.length}/{selectedFormation.positions.length})</span>
                </div>
                <div className={`flex items-center ${savedXI ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="mr-2">{savedXI ? '✓' : '✗'}</span>
                  <span>{savedXI ? 'Custom XI saved' : 'Save your custom XI first'}</span>
                </div>
              </div>
            </div>

            {/* Simulate Options */}
            {selectedClub && players.length === selectedFormation.positions.length && savedXI && (
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                {/* Opponent Type Selection */}
                <div>
                  <label className="text-sm font-semibold text-primary mb-3 block">Choose Opponent Type</label>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="opponentType"
                        value="existing"
                        checked={opponentType === 'existing'}
                        onChange={(e) => {
                          setOpponentType('existing');
                          setOpponentId('');
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">Historic Team</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="opponentType"
                        value="custom"
                        checked={opponentType === 'custom'}
                        onChange={(e) => {
                          setOpponentType('custom');
                          setCustomOpponentId('');
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">Custom XI</span>
                    </label>
                  </div>
                </div>

                {/* Opponent Selection */}
                <div>
                  <label className="text-sm font-semibold text-primary mb-2 block">
                    Select Opponent
                  </label>
                  {opponentType === 'existing' ? (
                    <>
                      <select
                        value={opponentId}
                        onChange={(e) => setOpponentId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Choose a historic team...</option>
                        {availableTeams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name} ({team.year})
                          </option>
                        ))}
                      </select>
                      {!opponentId && <p className="text-red-500 text-xs mt-1">Please select an opponent</p>}
                    </>
                  ) : (
                    <>
                      {savedXIs.length > 1 ? (
                        <>
                          <select
                            value={customOpponentId}
                            onChange={(e) => setCustomOpponentId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="">Choose a custom XI...</option>
                            {savedXIs
                              .filter((xi) => xi.id !== savedXI?.id) // Don't allow selecting your own XI
                              .map((xi) => (
                                <option key={xi.id} value={xi.id}>
                                  {xi.clubName} ({xi.formation})
                                </option>
                              ))}
                          </select>
                          {!customOpponentId && <p className="text-red-500 text-xs mt-1">Please select an opponent</p>}
                        </>
                      ) : (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                          You need to save at least 2 custom XIs to simulate them against each other.
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Simulate Button */}
                <button
                  onClick={handleSimulate}
                  disabled={
                    loading ||
                    (opponentType === 'existing' && !opponentId) ||
                    (opponentType === 'custom' && (!customOpponentId || savedXIs.length <= 1))
                  }
                  className={`w-full font-semibold py-3 rounded-lg transition ${
                    loading ||
                    (opponentType === 'existing' && !opponentId) ||
                    (opponentType === 'custom' && (!customOpponentId || savedXIs.length <= 1))
                      ? 'bg-gray-400 text-white opacity-50 cursor-not-allowed'
                      : 'bg-secondary text-white hover:opacity-90'
                  }`}
                >
                  {loading ? '⏳ Simulating...' : '▶️ Simulate Match'}
                </button>
              </div>
            )}
          </div>

          {/* Right: Pitch and Player Selection */}
          {selectedClub && (
            <div className="lg:col-span-2 space-y-6">
              {/* Pitch */}
              <Pitch
                formation={selectedFormation}
                players={players}
                onPlayerDrop={handlePlayerDrop}
                onPlayerRemove={handlePlayerRemove}
                availablePlayers={selectedClub.allTimePlayers || []}
              />

              {/* Available Players */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-primary mb-4">
                  Available Players (All-Time Roster - {selectedClub.allTimePlayers?.length || 0} players)
                </h3>
                {selectedClub.allTimePlayers && selectedClub.allTimePlayers.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {sortPlayersByPosition(selectedClub.allTimePlayers).map((player) => {
                      const isSelected = players.some((p) => p.playerId === player.id);
                      return (
                        <button
                          key={player.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('playerId', player.id);
                            // Ensure the drag starts by setting a drag image
                            const dragImage = new Image();
                            e.dataTransfer.setDragImage(dragImage, 0, 0);
                          }}
                          onDragEnd={(e) => {
                            // Event will be handled by global dragend listener
                          }}
                          className={`p-3 rounded-lg border-2 transition text-left ${
                            isSelected
                              ? 'border-primary bg-blue-50'
                              : 'border-gray-200 hover:border-primary hover:bg-gray-50'
                          } cursor-move`}
                        >
                          <p className="font-semibold text-sm text-primary">{player.name}</p>
                          <p className="text-xs text-muted">{player.position}</p>
                          <p className="text-xs font-bold text-primary mt-1">⭐ {player.overallRating}</p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-muted py-8">No players found for this club</div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
