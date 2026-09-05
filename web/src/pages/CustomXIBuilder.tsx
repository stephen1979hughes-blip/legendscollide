import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Icon } from '../components/Icon';
import { Pitch } from '../components/Pitch';
import { api } from '../services/api';
import { CustomXI, CustomXIPlayer, FORMATIONS, FormationConfig } from '../types/customXI';
import { customXIStorage } from '../utils/customXIStorage';
import { TeamSummary, Team, Club, Player } from '../types';
import { loadTeamsData } from '../utils/dataProcessor';
import { cardCollectionStorage } from '../utils/cardCollectionStorage';
import { Collection } from '../types/collection';
import { effectiveRating } from '../utils/cardProgression';
import { COLLECTION_CLUB_ID, CAMPAIGN_XI_ID, buildCollectionEngineTeam } from '../utils/collectionSquad';
import { xpWallet } from '../utils/xpWallet';
import { campaignStorage } from '../utils/campaignStorage';
import { buildLadder, xpForMatch, MatchOutcome } from '../utils/campaignLadder';
import { CampaignTier, CampaignMatchRequest, CampaignCompletionState, CampaignRewardCard } from '../types/campaign';
import { Rng, randomSeed } from '@fm/match-engine';


export const CustomXIBuilder: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const campaignTeamId = (location.state as CampaignMatchRequest | undefined)?.campaignTeamId;
  const isCampaignMode = !!campaignTeamId;

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
  const [xpBalance, setXpBalance] = useState(0);
  const [ladder, setLadder] = useState<CampaignTier[]>([]);
  const allPlayersById = useRef<Map<string, Player>>(new Map());

  const campaignTier = useMemo(
    () => ladder.find((t) => t.teamId === campaignTeamId) ?? null,
    [ladder, campaignTeamId]
  );

  useEffect(() => {
    const loadClubsData = async () => {
      try {
        const [{ clubs: loadedClubs, teams }, allPlayers] = await Promise.all([
          loadTeamsData(),
          api.getAllPlayers(),
        ]);

        allPlayersById.current = new Map(allPlayers.map((p) => [p.id, p]));
        setXpBalance(xpWallet.getBalance());
        if (teams && teams.length > 0) setLadder(buildLadder(teams));

        // "My Collection" — a synthetic club sourced from owned cards rather
        // than a fixed roster, shown at its current effective rating with the
        // card's ceiling attached (see Pitch.tsx). Present even with zero
        // cards so the option is discoverable before a player's first pack.
        const collection: Collection = cardCollectionStorage.loadAll();
        const collectionPlayers = Object.values(collection)
          .map((card) => {
            const base = allPlayersById.current.get(card.playerId);
            if (!base) return null;
            return {
              ...base,
              overallRating: effectiveRating(base.overallRating, card.level),
              ceiling: base.overallRating,
              level: card.level,
            };
          })
          .filter((p): p is NonNullable<typeof p> => p !== null)
          .sort((a, b) => b.overallRating - a.overallRating);

        const collectionClub: Club = {
          id: COLLECTION_CLUB_ID,
          name: 'My Collection',
          shortName: 'MINE',
          description: `${collectionPlayers.length} owned card${collectionPlayers.length === 1 ? '' : 's'}`,
          allTimePlayers: collectionPlayers,
        };

        const allClubs = loadedClubs && loadedClubs.length > 0 ? [collectionClub, ...loadedClubs] : [collectionClub];
        setClubs(allClubs);

        if (isCampaignMode) {
          // Campaign matches are always played with the collection squad —
          // skip the generic "last active XI" restore and load the
          // persistent campaign squad instead.
          setSelectedClub(collectionClub);
          const campaignXI = customXIStorage.loadById(CAMPAIGN_XI_ID);
          if (campaignXI) {
            setSavedXI(campaignXI);
            setPlayers(campaignXI.players);
            const formation = FORMATIONS.find((f) => f.code === campaignXI.formation);
            if (formation) setSelectedFormation(formation);
          }
        } else {
          // Load saved XIs
          const allSavedXIs = customXIStorage.loadAll();
          setSavedXIs(allSavedXIs);

          // Load active/last saved XI if available
          const saved = customXIStorage.load();
          if (saved) {
            setSavedXI(saved);
            setPlayers(saved.players);

            // Find and set the club and formation
            const club = allClubs.find(c => c.id === saved.clubId);
            if (club) {
              setSelectedClub(club);
            }

            const formation = FORMATIONS.find(f => f.code === saved.formation);
            if (formation) {
              setSelectedFormation(formation);
            }
          }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCampaignMode, campaignTeamId]);

  useEffect(() => {
    if (campaignTeamId) {
      setOpponentType('existing');
      setOpponentId(campaignTeamId);
    }
  }, [campaignTeamId]);


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

    // Add the new player. ceiling/level only exist on collection-sourced
    // entries (see the "My Collection" club built in the load effect above).
    const collectionExtras = player as Player & { ceiling?: number; level?: number };
    atSlot.push({
      slotIndex,
      playerId,
      playerName: player.name,
      playerPosition: player.position,
      overallRating: player.overallRating,
      ceiling: collectionExtras.ceiling,
      level: collectionExtras.level,
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
        const isCollectionSquad = selectedClub?.id === COLLECTION_CLUB_ID;

        // Create a Team object for the custom XI with the saved players. A
        // collection-sourced XI resolves true ratings + card levels + chemistry
        // through the same seam the campaign flow uses (see collectionSquad.ts);
        // a club/nation roster keeps its existing flat-75 attack/defence.
        //
        // `customXITeam` (true/ceiling ratings) is what the engine simulates
        // against `cardLevels`; `displayXITeam` (current effective ratings) is
        // what gets shown in the Broadcast lineup and match report — passing
        // the true-rating team there would show a level-1 card's ceiling
        // instead of the 75 it actually played at.
        const { customXITeam, displayXITeam, cardLevels, chemistryBonus } = isCollectionSquad
          ? (() => {
              const built = buildCollectionEngineTeam(
                savedXI?.players || [],
                allPlayersById.current,
                'custom-xi-' + selectedClub?.id,
                selectedClub?.name + ' (Custom XI)'
              );
              return {
                customXITeam: built.team,
                displayXITeam: built.displayTeam,
                cardLevels: built.cardLevels,
                chemistryBonus: built.chemistryBonus,
              };
            })()
          : (() => {
              const team: Team = {
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
              return { customXITeam: team, displayXITeam: team, cardLevels: undefined, chemistryBonus: undefined };
            })();

        // Generate match result, passing custom XI team object
        const matchResult = await api.simulateMatch(
          customXITeam.id,
          opponentId,
          false,
          customXITeam,
          opponentTeam,
          undefined,
          cardLevels,
          chemistryBonus
        );

        navigate('/broadcast', {
          state: {
            matchResult,
            teamA: displayXITeam,
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

  /**
   * The campaign match flow: always the collection squad vs. the pinned
   * ladder opponent. Pays XP into the shared wallet (xpWallet.ts) — how much
   * depends on the outcome, not just on having played — and, on a
   * first-time win, unlocks the next tier and grants a themed pack pulled
   * from the beaten squad's own roster. Nothing auto-applies to a specific
   * card anymore: leveling is a deliberate spend, made later on Collection.
   */
  const handleCampaignSimulate = async () => {
    if (!campaignTeamId || !campaignTier || players.length !== selectedFormation.positions.length) return;

    setLoading(true);
    try {
      const opponentTeam = await api.getTeam(campaignTeamId);

      const { team: campaignTeam, displayTeam: campaignDisplayTeam, cardLevels, chemistryBonus } =
        buildCollectionEngineTeam(players, allPlayersById.current, CAMPAIGN_XI_ID, 'My Collection XI');

      const matchResult = await api.simulateMatch(
        campaignTeam.id,
        campaignTeamId,
        false,
        campaignTeam,
        opponentTeam,
        undefined,
        cardLevels,
        chemistryBonus
      );

      const outcome: MatchOutcome =
        matchResult.scoreA > matchResult.scoreB ? 'win' : matchResult.scoreA === matchResult.scoreB ? 'draw' : 'loss';
      const xpEarned = xpForMatch(campaignTier.tier, outcome);
      const newBalance = xpWallet.earn(xpEarned);

      let unlockedNextTier = false;
      let nextTier: CampaignTier | null = null;
      let themedPack: CampaignRewardCard | null = null;

      if (outcome === 'win') {
        const alreadyDefeated = campaignStorage.isDefeated(campaignTeamId);
        campaignStorage.recordWin(campaignTeamId);
        if (!alreadyDefeated) {
          unlockedNextTier = true;
          nextTier = ladder.find((t) => t.tier === campaignTier.tier + 1) ?? null;
          // Themed drop: guaranteed pull from the beaten team's own roster —
          // beat Milan 1994, get a shot at Baresi or Maldini.
          const themedPlayer = new Rng(randomSeed()).pick(opponentTeam.players);
          const isDuplicate = !!cardCollectionStorage.get(themedPlayer.id);
          cardCollectionStorage.acquire(themedPlayer.id);
          themedPack = { playerId: themedPlayer.id, playerName: themedPlayer.name, isDuplicate };
        }
      }

      // Persist the campaign squad for next time.
      customXIStorage.save({
        id: CAMPAIGN_XI_ID,
        clubId: COLLECTION_CLUB_ID,
        clubName: 'My Collection',
        formation: selectedFormation.code,
        players,
        createdAt: savedXI?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      });

      const completeState: CampaignCompletionState = {
        matchResult,
        teamA: campaignDisplayTeam,
        teamB: opponentTeam,
        tier: campaignTier,
        outcome,
        xpEarned,
        newBalance,
        unlockedNextTier,
        nextTier,
        themedPack,
      };

      navigate('/broadcast', {
        state: {
          matchResult,
          teamA: campaignDisplayTeam,
          teamB: opponentTeam,
          completeRoute: '/campaign/result',
          completeLabel: 'Claim Rewards',
          completeState,
        },
      });
    } catch (error) {
      console.error('Campaign simulation failed:', error);
      alert(`Simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoading(false);
    }
  };

  return (
    <PageShell width="wide" showBack>
        <div className="mb-section flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
          <div className="space-y-1.5">
            <p className="eyebrow">{isCampaignMode ? 'Campaign match' : 'Squad builder'}</p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {isCampaignMode ? `vs ${campaignTier?.teamName ?? '…'}` : 'Build your all-time XI'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="chip-accent num">
              <Icon name="token" size={13} />
              {xpBalance.toLocaleString()}
            </span>
            <a href="/collection" className="btn-quiet btn-sm">
              <Icon name="cards" />
              My collection
            </a>
          </div>
        </div>

        {isCampaignMode && campaignTier && (
          <div className="card mb-section flex flex-wrap items-center justify-between gap-4 border-accent/40">
            <div className="space-y-1">
              <p className="eyebrow text-accent">
                Ladder tier {campaignTier.tier} of {ladder.length}
              </p>
              <h2 className="display text-2xl">
                {campaignTier.teamName} <span className="num text-ink-3">{campaignTier.year}</span>
              </h2>
              <p className="num text-sm text-ink-2">
                Squad rating {campaignTier.rating} — fielding your collection XI
              </p>
            </div>
            <div className="text-right">
              <p className="eyebrow">XP for a win</p>
              <p className="num mt-1 flex items-center justify-end gap-1.5 text-lg font-semibold text-accent">
                <Icon name="token" size={16} />
                {xpForMatch(campaignTier.tier, 'win')}
                <span className="text-sm font-normal text-ink-2">+ a themed pack (first win only)</span>
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Club/Formation Selection */}
          <div className="space-y-6">
            {/* Club Selection */}
            {!isCampaignMode && (
              <div className="card">
                <h3 className="text-lg font-bold text-ink mb-4">Select Club/Nation</h3>
                {!dataLoaded ? (
                  <div className="text-center text-ink-2 py-4">Loading clubs...</div>
                ) : clubs.length === 0 ? (
                  <div className="text-center text-danger py-4">Failed to load clubs. Please refresh the page.</div>
                ) : (
                  <select
                    onChange={(e) => handleClubSelect(e.target.value)}
                    value={selectedClub?.id || ''}
                    className="field"
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
            )}
            {isCampaignMode && selectedClub && (
              <div className="card">
                <h3 className="text-lg font-bold text-ink mb-1">My Collection</h3>
                <p className="text-ink-2 text-sm">{selectedClub.description}</p>
                {(selectedClub.allTimePlayers?.length ?? 0) === 0 && (
                  <p className="text-accent text-xs mt-2">
                    You don't own any cards yet — visit the Collection page to open a pack.
                  </p>
                )}
              </div>
            )}

            {/* Formation Selection */}
            {selectedClub && (
              <div className="card">
                <h3 className="text-lg font-bold text-ink mb-4">Select Formation</h3>
                <div className="space-y-2">
                  {FORMATIONS.map((formation) => (
                    <button
                      key={formation.code}
                      onClick={() => handleFormationSelect(formation)}
                      className={`w-full text-left px-4 py-3 rounded-ctl border-2 transition ${
                        selectedFormation.code === formation.code
                          ? 'border-primary bg-line'
                          : 'border-line hover:border-primary'
                      }`}
                    >
                      <p className="font-semibold text-ink">{formation.name}</p>
                      <p className="text-sm text-ink-2">{formation.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Save XI */}
            {selectedClub && players.length === selectedFormation.positions.length && (
              <div className="card space-y-3">
                <button
                  onClick={handleSaveXI}
                  className="w-full bg-accent text-accent-ink font-semibold py-2 rounded-ctl hover:opacity-90 transition"
                >
                  {savedXI ? 'Saved' : 'Save XI'}
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
                <div className="card space-y-4">
                  {/* Requirements Checklist */}
                  <div className="space-y-3 pb-4 border-b border-line">
                    <h3 className="font-bold text-ink">Ready to Simulate?</h3>
                    <div className="space-y-2 text-sm">
                      <div className={`flex items-center ${selectedClub ? 'text-accent' : 'text-danger'}`}>
                        <span className="mr-2"><Icon name={selectedClub ? 'check' : 'cross'} size={13} /></span>
                        <span>{selectedClub ? `Club Selected: ${selectedClub.name}` : 'Select a club/team'}</span>
                      </div>
                      <div className={`flex items-center ${players.length === selectedFormation.positions.length ? 'text-accent' : 'text-danger'}`}>
                        <span className="mr-2"><Icon name={players.length === selectedFormation.positions.length ? 'check' : 'cross'} size={13} /></span>
                        <span>All {selectedFormation.positions.length} positions filled ({players.length}/{selectedFormation.positions.length})</span>
                      </div>
                      <div className={`flex items-center ${savedXI ? 'text-accent' : 'text-danger'}`}>
                        <span className="mr-2"><Icon name={savedXI ? 'check' : 'cross'} size={13} /></span>
                        <span>{savedXI ? (isCampaignMode ? 'Campaign squad saved' : 'Custom XI saved') : 'Save your squad first'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Choose Opponent Type — campaign mode locks this to the pinned ladder opponent */}
                  {!isCampaignMode && (
                  <div>
                    <label className="text-sm font-semibold text-ink mb-3 block">Choose Opponent Type</label>
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
                        <span className="text-sm text-ink">Historic Team</span>
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
                        <span className="text-sm text-ink">Custom XI</span>
                      </label>
                    </div>
                  </div>
                  )}

                  {/* Opponent Selection */}
                  {isCampaignMode ? null : (
                  <div>
                    {opponentType === 'existing' ? (
                      <>
                        <select
                          value={opponentId}
                          onChange={(e) => setOpponentId(e.target.value)}
                          className="field"
                          style={{ colorScheme: 'dark', backgroundColor: '#1a1a1a', color: '#ffffff' }}
                        >
                          <option value="">Choose a historic team...</option>
                          {availableTeams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name} ({team.year})
                            </option>
                          ))}
                        </select>
                        {!opponentId && <p className="text-danger text-xs mt-1">Please select an opponent</p>}
                      </>
                    ) : (
                      <>
                        {savedXIs.length > 1 ? (
                          <>
                            <select
                              value={customOpponentId}
                              onChange={(e) => setCustomOpponentId(e.target.value)}
                              className="field"
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
                            {!customOpponentId && <p className="text-danger text-xs mt-1">Please select an opponent</p>}
                          </>
                        ) : (
                          <div className="p-3 bg-accent/10 border border-accent/40 rounded-ctl text-sm text-accent">
                            You need to save at least 2 custom XIs to simulate them against each other.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  )}

                  {/* Simulate Button */}
                  <button
                    onClick={isCampaignMode ? handleCampaignSimulate : handleSimulate}
                    disabled={
                      loading ||
                      (!isCampaignMode && opponentType === 'existing' && !opponentId) ||
                      (!isCampaignMode && opponentType === 'custom' && (!customOpponentId || savedXIs.length <= 1))
                    }
                    className="btn-accent w-full"
                  >
                    <Icon name={isCampaignMode ? 'swords' : 'ball'} />
                    {loading
                      ? 'Simulating…'
                      : isCampaignMode
                        ? `Play ${campaignTier?.teamName ?? 'match'}`
                        : 'Simulate match'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
    </PageShell>
  );
};
