/**
 * @fm/match-engine — the swappable match simulation.
 *
 * The web app talks to this package only through `MatchEngine`. A Rust/WASM
 * implementation replaces `tsMatchEngine` by satisfying the same interface;
 * nothing in web/src should need to change.
 */
import { simulateMatch } from './engine.ts';
import type { MatchEngine } from './types.ts';

export { simulateMatch } from './engine.ts';
export { Rng, randomSeed } from './rng.ts';
export type {
  EnginePlayer,
  EngineTeam,
  Goal,
  MatchEngine,
  MatchEvent,
  MatchInput,
  MatchResult,
  MatchStats,
  PlayerStats,
  PositionCategory,
} from './types.ts';

export const tsMatchEngine: MatchEngine = {
  name: 'typescript',
  simulate: simulateMatch,
};

/** The engine the app uses. Point this at the WASM engine when it lands. */
export const defaultEngine: MatchEngine = tsMatchEngine;
