import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Pitch } from '../components/Pitch';
import { api } from '../services/api';
import { CustomXI, CustomXIPlayer, FORMATIONS, FormationConfig } from '../types/customXI';
import { customXIStorage } from '../utils/customXIStorage';
import { TeamSummary, Team, Club, Player } from '../types';
import { loadTeamsData } from '../utils/dataProcessor';


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
  useEffect(() => {
    const loadClubsData = async () => {
      try {
        const { clubs: loadedClubs, teams } = await loadTeamsData();

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

  const handlePlayerSelect = (playerId: string, slotIndex: number) => {
    if (!selectedClub || !selectedClub.allTimePlayers) return;

    const player = selectedClub.allTimePlayers.find((p) => p.id === playerId);
    if (!player) return;

    // Remove if already assigned to a different slot
    const updated = players.filter((p) => p.playerId !== playerId);

    // Remove if there's already someone at this slot
    const atSlot = updated.filter((p) => p.slotIndex !== slotIndex);

    // Add the new player
    atSlot.push({
      slotIndex,
      playerId,
      playerName: player.name,
      playerPosition: player.position,
      overallRating: player.overallRating
    });

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

        // Create a Team object for the custom XI with the saved players
        const customXITeam: Team = {
          id: 'custom-xi-' + selectedClub?.id,
          name: selectedClub?.name + ' (Custom XI)',
          clubId: selectedClub?.id || '',
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

        // Generate match result, passing custom XI team object
        const matchResult = await api.simulateMatch(customXITeam.id, opponentId, false, customXITeam, opponentTeam);

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

        // Create Team objects for both custom XIs
        const customXITeamA: Team = {
          id: 'custom-xi-' + selectedClub?.id,
          name: selectedClub?.name + ' (Custom XI)',
          clubId: selectedClub?.id || '',
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

        // Generate match result between the two custom XIs, passing Team objects
        const matchResult = await api.simulateMatch(customXITeamA.id, customXITeamB.id, false, customXITeamA, customXITeamB);

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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-black to-black/95">
      <Header showBack />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        <h1 className="text-4xl font-heading font-bold text-white mb-8">Build Your All-Time XI</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Club/Formation Selection */}
          <div className="space-y-6">
            {/* Club Selection */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-md">
              <h3 className="text-lg font-bold text-white mb-4">Select Club/Nation</h3>
              {!dataLoaded ? (
                <div className="text-center text-white/70 py-4">Loading clubs...</div>
              ) : clubs.length === 0 ? (
                <div className="text-center text-red-400 py-4">Failed to load clubs. Please refresh the page.</div>
              ) : (
                <select
                  onChange={(e) => handleClubSelect(e.target.value)}
                  value={selectedClub?.id || ''}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  style={{ colorScheme: 'dark', backgroundColor: '#1a1a1a', color: '#ffffff' }}
                >
                  <option value="">Choose a club/nation...</option>
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
              <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-md">
                <h3 className="text-lg font-bold text-white mb-4">Select Formation</h3>
                <div className="space-y-2">
                  {FORMATIONS.map((formation) => (
                    <button
                      key={formation.code}
                      onClick={() => handleFormationSelect(formation)}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition ${
                        selectedFormation.code === formation.code
                          ? 'border-primary bg-white/20'
                          : 'border-white/10 hover:border-primary'
                      }`}
                    >
                      <p className="font-semibold text-white">{formation.name}</p>
                      <p className="text-sm text-white/60">{formation.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Save XI */}
            {selectedClub && players.length === selectedFormation.positions.length && (
              <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-md space-y-3">
                <button
                  onClick={handleSaveXI}
                  className="w-full bg-primary text-white font-semibold py-2 rounded-lg hover:opacity-90 transition"
                >
                  {savedXI ? '✓ Save XI' : 'Save XI'}
                </button>
              </div>
            )}
          </div>

          {/* Right: Pitch */}
          {selectedClub && (
            <div className="lg:col-span-2 space-y-6">
              <Pitch
                formation={selectedFormation}
                players={players}
                onPlayerSelect={handlePlayerSelect}
                onPlayerRemove={handlePlayerRemove}
                availablePlayers={selectedClub.allTimePlayers || []}
              />

              {/* Combined Simulate Card */}
              {players.length === selectedFormation.positions.length && savedXI && (
                <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-md space-y-4">
                  {/* Requirements Checklist */}
                  <div className="space-y-3 pb-4 border-b border-white/10">
                    <h3 className="font-bold text-white">Ready to Simulate?</h3>
                    <div className="space-y-2 text-sm">
                      <div className={`flex items-center ${selectedClub ? 'text-green-400' : 'text-red-400'}`}>
                        <span className="mr-2">{selectedClub ? '✓' : '✗'}</span>
                        <span>{selectedClub ? `Club Selected: ${selectedClub.name}` : 'Select a club/team'}</span>
                      </div>
                      <div className={`flex items-center ${players.length === selectedFormation.positions.length ? 'text-green-400' : 'text-red-400'}`}>
                        <span className="mr-2">{players.length === selectedFormation.positions.length ? '✓' : '✗'}</span>
                        <span>All {selectedFormation.positions.length} positions filled ({players.length}/{selectedFormation.positions.length})</span>
                      </div>
                      <div className={`flex items-center ${savedXI ? 'text-green-400' : 'text-red-400'}`}>
                        <span className="mr-2">{savedXI ? '✓' : '✗'}</span>
                        <span>{savedXI ? 'Custom XI saved' : 'Save your custom XI first'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Choose Opponent Type */}
                  <div>
                    <label className="text-sm font-semibold text-white mb-3 block">Choose Opponent Type</label>
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
                        <span className="text-sm text-white">Historic Team</span>
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
                        <span className="text-sm text-white">Custom XI</span>
                      </label>
                    </div>
                  </div>

                  {/* Opponent Selection */}
                  <div>
                    {opponentType === 'existing' ? (
                      <>
                        <select
                          value={opponentId}
                          onChange={(e) => setOpponentId(e.target.value)}
                          className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                          style={{ colorScheme: 'dark', backgroundColor: '#1a1a1a', color: '#ffffff' }}
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
                              className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                              style={{ colorScheme: 'dark', backgroundColor: '#1a1a1a', color: '#ffffff' }}
                            >
                              <option value="">Choose a custom XI...</option>
                              {savedXIs
                                .filter((xi) => xi.id !== savedXI?.id)
                                .map((xi) => (
                                  <option key={xi.id} value={xi.id}>
                                    {xi.clubName} ({xi.formation})
                                  </option>
                                ))}
                            </select>
                            {!customOpponentId && <p className="text-red-500 text-xs mt-1">Please select an opponent</p>}
                          </>
                        ) : (
                          <div className="p-3 bg-yellow-50/10 border border-yellow-500/30 rounded-lg text-sm text-yellow-400">
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
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
