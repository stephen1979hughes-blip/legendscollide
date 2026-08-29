/**
 * Seeded pseudo-random number generator.
 *
 * The engine previously called Math.random() directly, which made matches
 * irreproducible — you could not replay a result, write a test that asserts an
 * outcome, or check a reimplementation against this one. Every random draw now
 * goes through this generator.
 *
 * mulberry32 is used because it is trivial to port exactly: 32-bit unsigned
 * arithmetic and nothing else. A Rust version using u32 wrapping arithmetic
 * produces an identical stream, which is what makes engine parity testable.
 */
export class Rng {
  private state: number;

  constructor(seed: number) {
    // Coerce to u32 so a float or negative seed still behaves.
    this.state = seed >>> 0;
  }

  /** Next float in [0, 1). Equivalent to Math.random(). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [0, max). */
  int(max: number): number {
    return Math.floor(this.next() * max);
  }

  /** Uniformly picks one element; throws on an empty list. */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick called with an empty array');
    return items[this.int(items.length)];
  }

  /** Fisher-Yates shuffle of a copy. Order-stable for a given seed. */
  shuffle<T>(items: readonly T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
}

/** A seed derived from the clock, for callers that genuinely want a fresh match. */
export const randomSeed = (): number => (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
