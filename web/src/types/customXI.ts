export type Position = 'GK' | 'LB' | 'CB' | 'RB' | 'LM' | 'CM' | 'RM' | 'CAM' | 'LW' | 'RW' | 'ST' | 'CF';

export interface FormationConfig {
  name: string;
  code: string;
  positions: Position[];
  description: string;
  rows: {
    name: string;
    positionIndices: number[];
  }[];
}

export interface CustomXIPlayer {
  slotIndex: number;  // Index in the formation, not position name
  playerId: string;
  playerName: string;
  playerPosition: string;
  overallRating: number;
}

export interface CustomXI {
  id: string;
  clubId: string;
  clubName: string;
  teamId?: string;              // Optional: specific era/year this XI was based on
  year?: number;                // Optional: if tied to specific era
  formation: string;
  players: CustomXIPlayer[];
  createdAt: number;
  updatedAt: number;
}

export const FORMATIONS: FormationConfig[] = [
  {
    name: '4-3-3',
    code: '433',
    description: 'Classic balanced formation',
    positions: ['GK', 'RB', 'CB', 'CB', 'LB', 'CM', 'CM', 'CM', 'RW', 'ST', 'LW'],
    rows: [
      { name: 'GK', positionIndices: [0] },
      { name: 'Defense', positionIndices: [1, 2, 3, 4] },
      { name: 'Midfield', positionIndices: [5, 6, 7] },
      { name: 'Attack', positionIndices: [8, 9, 10] }
    ]
  },
  {
    name: '4-2-3-1',
    code: '4231',
    description: 'Defensive midfielder support',
    positions: ['GK', 'RB', 'CB', 'CB', 'LB', 'CM', 'CM', 'CAM', 'RW', 'LW', 'ST'],
    rows: [
      { name: 'GK', positionIndices: [0] },
      { name: 'Defense', positionIndices: [1, 2, 3, 4] },
      { name: 'Defensive Midfield', positionIndices: [5, 6] },
      { name: 'Attacking Midfield', positionIndices: [8, 7, 9] },
      { name: 'Attack', positionIndices: [10] }
    ]
  },
  {
    name: '3-5-2',
    code: '352',
    description: 'Wing-back heavy',
    positions: ['GK', 'CB', 'CB', 'CB', 'RM', 'CM', 'CM', 'CM', 'LM', 'ST', 'ST'],
    rows: [
      { name: 'GK', positionIndices: [0] },
      { name: 'Defense', positionIndices: [1, 2, 3] },
      { name: 'Midfield', positionIndices: [4, 5, 6, 7, 8] },
      { name: 'Attack', positionIndices: [9, 10] }
    ]
  },
  {
    name: '5-3-2',
    code: '532',
    description: 'Defensive five',
    positions: ['GK', 'RB', 'CB', 'CB', 'CB', 'LB', 'CM', 'CM', 'CM', 'ST', 'ST'],
    rows: [
      { name: 'GK', positionIndices: [0] },
      { name: 'Defense', positionIndices: [1, 2, 3, 4, 5] },
      { name: 'Midfield', positionIndices: [6, 7, 8] },
      { name: 'Attack', positionIndices: [9, 10] }
    ]
  },
  {
    name: '4-4-2',
    code: '442',
    description: 'Classic two-striker',
    positions: ['GK', 'RB', 'CB', 'CB', 'LB', 'RM', 'CM', 'CM', 'LM', 'ST', 'ST'],
    rows: [
      { name: 'GK', positionIndices: [0] },
      { name: 'Defense', positionIndices: [1, 2, 3, 4] },
      { name: 'Midfield', positionIndices: [5, 6, 7, 8] },
      { name: 'Attack', positionIndices: [9, 10] }
    ]
  },
  {
    name: '3-4-3',
    code: '343',
    description: 'Attacking three at back',
    positions: ['GK', 'CB', 'CB', 'CB', 'RM', 'CM', 'CM', 'LM', 'RW', 'ST', 'LW'],
    rows: [
      { name: 'GK', positionIndices: [0] },
      { name: 'Defense', positionIndices: [1, 2, 3] },
      { name: 'Midfield', positionIndices: [4, 5, 6, 7] },
      { name: 'Attack', positionIndices: [8, 9, 10] }
    ]
  }
];
