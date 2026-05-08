# Match Engine Tools – Breakdown

This document explains how the legacy `simulateRealisticMatch()` has been refactored into **7 pure tools** that align with the spec.

## Tools Overview

### 1. **`getTeamStrength(state, side)`**
**Input:** `MatchState`, `TeamSide` ('home' | 'away')  
**Output:** `{ attackStrength: 0-1, defenceStrength: 0-1 }`

Calculates offensive and defensive capability based on:
- Player position categories (FW, MF, DF, GK)
- Player ratings (attackRating, defenceRating, overallRating)
- Position-weighted averages

**Legacy equivalent:** Implicit in possession factor and base chance logic.

---

### 2. **`createChance(state)`**
**Input:** `MatchState`  
**Output:** `Chance | null`

Generates an attacking opportunity with:
- Attacking team selection (based on momentum + random)
- Attacker selection (prefers forwards)
- Support player selection (midfielders or forwards)
- Chance quality (0-1) based on attack vs defence strength + momentum

**Legacy equivalent:** Random chance generation with possession weighting.

---

### 3. **`resolveDuel(state, attackerId, defenderId, duelType)`**
**Input:** `MatchState`, attacker ID, defender ID, duel type ('dribble' | 'aerial' | 'tackle')  
**Output:** `{ winner: 'attacker' | 'defender', successProbability: 0-1 }`

Resolves a one-on-one encounter:
- Dribble: attacker's attackRating vs defender's defenceRating
- Aerial: positional advantage (FW/DF better at headers)
- Tackle: attackRating vs defenceRating
- Fatigue factor applied to both players

**Legacy equivalent:** Not explicitly modeled; event templates only.

---

### 4. **`resolveShot(state, attackerId, goalkeeperId, chanceQuality)`**
**Input:** `MatchState`, attacker ID, keeper ID, chance quality (0-1)  
**Output:** `{ onTarget: bool, goal: bool, xg: 0-1, saveProbability: 0-1 }`

Determines shot outcome:
- Expected Goals (xG) calculated from chance quality + attacker skill + fatigue
- On-target probability from xG
- Save probability from keeper skill + fatigue
- Goal if shot beats save probability

**Legacy equivalent:** Predetermined score with random shot distribution.

---

### 5. **`applyFatigue(state)`**
**Input:** `MatchState`  
**Output:** `{ fatigue: { [playerId]: 0-1 } }`

Updates player fatigue over match duration:
- Fatigue rate increases with match progression
- Stamina rating reduces fatigue decay
- Minimum 0.1 (heavily fatigued), maximum 1.0 (fresh)

**Legacy equivalent:** Not modeled at all.

---

### 6. **`updateMomentum(state)`**
**Input:** `MatchState`  
**Output:** `{ momentum: { home: -100..100, away: -100..100 } }`

Tracks team momentum based on:
- Recent goals (+40 boost to scorer, -20 to opponent)
- Recent shots on target (+10 to shooter)
- Recent saves (+5 to defending team)
- Exponential decay (×0.95 per update)
- Clamped to [-100, +100]

**Legacy equivalent:** Possession percentage only; no true momentum tracking.

---

### 7. **`logEvent(state, event)`**
**Input:** `MatchState`, `LogEventInput` (minute, type, team, playerId, description, data)  
**Output:** `MatchState` (updated with new event)

Pure function that appends a structured event to the match log:
- Generates unique event ID
- Preserves immutability (returns new state)
- Supports all event types (kickoff, chance, shot, goal, save, miss, block, foul, card, substitution, half_time, full_time)

**Legacy equivalent:** Direct `.push()` to events array.

---

## Usage Flow (New `simulateMatchWithTools`)

```
1. Initialize MatchState (score 0-0, momentum 0, full fatigue)
2. Log kickoff event
3. Loop through match minutes (jump to chance events):
   a. Call createChance() → get attacking opportunity
   b. Call resolveDuel() → determine if attacker beats defender
   c. Call resolveShot() → determine if shot scores
   d. Call logEvent() → record all outcomes
   e. Every 10 min: call applyFatigue() & updateMomentum()
4. Log half-time and full-time events
5. Return final MatchState
```

## Key Improvements

| Aspect | Old | New |
|--------|-----|-----|
| **Scores** | Predetermined upfront | Dynamic from shot outcomes |
| **Fatigue** | Not modeled | Affects duel & shot success |
| **Momentum** | Possession only | Team momentum (-100 to +100) |
| **Duels** | Templates | Deterministic, skill-based |
| **xG** | Implicit | Calculated per shot |
| **Tool use** | Monolithic | 7 pure, composable tools |

## Integration with Claude API

When connected to Claude (Anthropic SDK):

```javascript
const response = await client.messages.create({
  model: "claude-opus-4",
  tools: [
    { name: "get_team_strength", ... },
    { name: "create_chance", ... },
    // ... etc
  ],
  toolChoice: "required",
  messages: [{ role: "user", content: agentPrompt }],
});
```

The agent will call these tools in sequence to orchestrate the match simulation, replacing the hardcoded `simulateMatchWithTools()` loop.
