# Groq Agent Setup Guide

This guide shows how to set up and run the match engine with Groq API.

## 1. Get a Groq API Key

1. Visit [console.groq.com](https://console.groq.com)
2. Sign up with email or Google
3. Go to API Keys section
4. Create a new API key
5. Copy it (keep it secret!)

## 2. Set Environment Variable

### Windows (PowerShell)
```powershell
$env:GROQ_API_KEY = "your-api-key-here"
```

### Windows (CMD)
```cmd
set GROQ_API_KEY=your-api-key-here
```

### macOS/Linux
```bash
export GROQ_API_KEY="your-api-key-here"
```

Or create a `.env` file in the `api/` directory:
```
GROQ_API_KEY=your-api-key-here
```

## 3. Install Dependencies

```bash
cd api
npm install
```

This installs:
- `tsx` — TypeScript executor (allows running .ts files in Node)
- `typescript` — TypeScript compiler
- `express` — Web framework
- `cors` — CORS middleware

## 4. Start the API Server

```bash
npm run dev
```

You should see:
```
✓ Admin API server running on http://localhost:3000
✓ Data file: [...]/web/public/teams-data-normalized.json
✓ Admin endpoints available at http://localhost:3000/api/admin/*
```

## 5. Test the Match Simulation

### Using curl

```bash
curl -X POST http://localhost:3000/api/simulateAi \
  -H "Content-Type: application/json" \
  -d '{
    "homeTeamId": "mu-1968",
    "awayTeamId": "lfc-1977"
  }'
```

### Using JavaScript/Fetch

```javascript
const response = await fetch('http://localhost:3000/api/simulateAi', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    homeTeamId: 'mu-1968',
    awayTeamId: 'lfc-1977'
  })
});

const matchState = await response.json();
console.log(`Final score: ${matchState.score.home} - ${matchState.score.away}`);
console.log(`Events logged: ${matchState.events.length}`);
```

## Response Format

The API returns a `MatchState` object:

```json
{
  "seed": 1234567890,
  "minute": 90,
  "maxMinutes": 90,
  "score": {
    "home": 2,
    "away": 1
  },
  "momentum": {
    "home": 15,
    "away": -20
  },
  "fatigue": {
    "player-id-1": 0.42,
    "player-id-2": 0.55,
    "...": "..."
  },
  "events": [
    {
      "id": "0-kickoff-abc123",
      "minute": 0,
      "type": "kickoff",
      "team": null,
      "description": "Manchester United 1968 vs Liverpool 1977"
    },
    {
      "id": "5-chance-def456",
      "minute": 5,
      "type": "chance",
      "team": "home",
      "playerId": "mu-7",
      "chanceQuality": 0.68
    },
    {
      "id": "8-shot-ghi789",
      "minute": 8,
      "type": "shot",
      "team": "home",
      "playerId": "mu-7",
      "onTarget": true,
      "xg": 0.42
    },
    {
      "id": "8-goal-jkl012",
      "minute": 8,
      "type": "goal",
      "team": "home",
      "playerId": "mu-7",
      "assistId": "mu-6",
      "description": "GOAL! mu-7 scores!"
    },
    "..."
  ]
}
```

## How It Works

1. **Client** sends POST request with `homeTeamId` and `awayTeamId`
2. **Server** loads team data from JSON
3. **Groq Agent** orchestrates the match:
   - Calls `create_chance()` to generate attacking opportunities
   - Calls `resolve_duel()` for player duels
   - Calls `resolve_shot()` to determine shot outcomes
   - Calls `log_event()` to record all events
   - Calls `apply_fatigue()` and `update_momentum()` periodically
4. **Server** returns final `MatchState` with all events and final score

## Troubleshooting

### "GROQ_API_KEY environment variable not set"
- Make sure the environment variable is set before starting the server
- Restart the server after setting it

### "Groq API error: 401"
- Your API key is invalid or expired
- Check that you copied it correctly from console.groq.com

### "One or both teams not found"
- Check that the team IDs exist in your `teams-data-normalized.json`
- Use `/api/admin/data` to list all available teams

### "Match simulation failed" 
- Check the server logs for the actual error
- Ensure you have GROQ_API_KEY set
- Verify your internet connection (Groq API needs it)

## Advanced: Using the Legacy Simulator

If you want to use the fast, non-agent simulator without Groq:

```bash
curl -X POST http://localhost:3000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "homeTeamId": "mu-1968",
    "awayTeamId": "lfc-1977"
  }'
```

(This endpoint doesn't exist yet but can be added if needed)

## Cost

Groq's free tier is **very generous**:
- 7,000 requests per week (≈ 1,000 per day)
- No credit card required
- Free forever tier available

A typical match simulation uses ~30-50 API calls. So your free tier is plenty for testing!

## Next Steps

1. ✅ Set up Groq API key
2. ✅ Install dependencies
3. ✅ Start the server
4. ✅ Test a match simulation
5. Integrate with the web UI (Broadcast page)
6. Display match events in real-time
