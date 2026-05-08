# Step 4: Web UI Integration – Summary

I've integrated the Groq AI match engine with the web UI. Here's what was done:

## Changes Made

### 1. **API Service** (`web/src/services/api.ts`)
- ✅ Added `simulateMatchWithAI()` function
- Calls `/api/simulateAi` endpoint (backend)
- Converts `MatchState` → `MatchResult` format for compatibility with Broadcast page
- Extracts goals, calculates stats from agent events

### 2. **Simulate Page** (`web/src/pages/Simulate.tsx`)
- ✅ Added `useAI` mode detection via query parameter (`?mode=ai`)
- Conditional steps display (different messages for AI vs legacy)
- Calls `api.simulateMatchWithAI()` when `mode=ai`, otherwise uses legacy
- All the complex state management and navigation already worked!

### 3. **Home Page** (`web/src/pages/Home.tsx`)
- ✅ Added AI mode toggle checkbox
- Displays "Use AI-Powered Engine (Groq)" option
- Button text updates to show mode: "▶️ Simulate Match (AI)"
- Navigates to `/simulate?mode=ai` with team IDs

## How It Works (End-to-End)

```
User selects teams on Home page
    ↓
Toggles "Use AI-Powered Engine" checkbox (optional)
    ↓
Clicks "Simulate Match" button
    ↓
Navigates to /simulate?mode=ai (with teamAId, teamBId in state)
    ↓
Simulate page calls api.simulateMatchWithAI(teamAId, teamBId)
    ↓
API service makes POST request to /api/simulateAi
    ↓
Backend (Express) calls simulateMatchWithAgent()
    ↓
Groq agent orchestrates match using 7 tools:
  • create_chance()
  • resolve_duel()
  • resolve_shot()
  • log_event()
  • apply_fatigue()
  • update_momentum()
  • get_team_strength()
    ↓
Returns MatchState with all events
    ↓
API service converts to MatchResult format
    ↓
Navigates to /broadcast with matchResult + teams
    ↓
Broadcast page shows live match animation with agent events
```

## File Structure

```
web/src/
├── pages/
│   ├── Home.tsx          ← Added AI toggle checkbox
│   ├── Simulate.tsx      ← Added ?mode=ai query param support
│   └── Broadcast.tsx     ← Already handles all event types!
├── services/
│   ├── api.ts            ← Added simulateMatchWithAI()
│   ├── matchEngine.ts    ← Legacy simulation (still works)
│   ├── matchEngineTools.ts    ← 7 pure tools
│   └── matchEngineAgent.ts    ← Groq agent orchestrator
└── types/
    └── index.ts          ← Added TeamSide type

api/
├── server.js             ← Added /api/simulateAi endpoint
└── package.json          ← Added tsx, typescript
```

## Testing the Full Flow

1. **Start API server:**
   ```bash
   cd api
   npm install
   npm run dev
   ```

2. **Start web dev server** (in another terminal):
   ```bash
   npm run dev
   ```

3. **Use it:**
   - Go to http://localhost:5173 (or your dev port)
   - Select two teams
   - Toggle "Use AI-Powered Engine"
   - Click "Simulate Match (AI)"
   - Watch the Broadcast page animate through all AI-generated events!

## Features

✅ **AI Mode Toggle** on Home page  
✅ **Event-driven simulation** with realistic chances, shots, goals  
✅ **Broadcast integration** showing live match progress  
✅ **Fatigue system** affecting player performance  
✅ **Momentum tracking** influencing team chances  
✅ **xG calculation** for shot quality  
✅ **Free Groq API** (generous tier, no credit card needed)  
✅ **Backward compatible** with legacy simulator (toggle works!)  

## Next Steps (Optional)

- Add real-time streaming (show events as they're generated, not all at once)
- Add player stats display from match events
- Add highlights reel of best chances/saves
- Track xG progression over match
- Add customizable team/player ratings before match
- Integrate with broadcast stats display

## Important Notes

- **Groq API Key:** Must be set as `GROQ_API_KEY` environment variable before starting API server
- **Free tier:** 7,000 requests/week (very generous)
- **Event format:** Agent returns structured events (minute, type, team, playerId, description, data)
- **Broadcast page:** Already handles all event types (goal, chance, shot, save, etc.)
- **Deterministic:** Same seed produces same match (good for testing/replaying)
