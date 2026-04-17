# Football Match Simulator MVP

A simple web app to simulate classic football matches. Pick two legendary teams, click "Simulate," and watch the action unfold.

## Tech Stack

- **Backend:** C# Azure Functions (.NET 8)
- **Frontend:** React + TypeScript + Vite
- **Data:** JSON (embedded in function app)

## Quick Start

### Prerequisites
- .NET 8 SDK
- Node 18+
- Azure Functions Core Tools (`func` CLI)

### Run Locally

**Terminal 1 - Backend:**
```bash
cd api
func start
```
Functions will run on `http://localhost:7071`

**Terminal 2 - Frontend:**
```bash
cd web
npm install
npm run dev
```
React will open on `http://localhost:5173`

The frontend automatically points to `localhost:7071/api` in development.

## Project Structure

```
fm/
├── api/MatchSimulator.Function/     # C# Azure Functions
│   ├── Models/                      # Data models
│   ├── Services/                    # SimulationEngine, TeamDataLoader, CommentaryGenerator
│   ├── Functions/                   # HTTP triggers (GetTeams, SimulateMatch)
│   └── Data/teams-players.json      # Team & player data
├── web/                             # React frontend
│   ├── src/
│   │   ├── components/              # TeamSelector, Lineup, MatchResult
│   │   ├── services/api.ts          # API client
│   │   ├── types/index.ts           # TypeScript interfaces
│   │   └── App.tsx                  # Main app
│   └── vite.config.ts
```

## Features

- **4 Classic Teams:** Man Utd 1968, Liverpool 1984, Brazil 1970, Barcelona 2011
- **Match Simulation:** Chances, goals, possession, shots on target
- **Commentary:** Dynamic match events
- **Stadium & Kick-off:** Randomized for atmosphere
- **Era Flavour:** Period-specific match descriptions
- **Lineup Display:** All 11 players with ratings

## API Endpoints

- `GET /api/teams` - List all teams
- `GET /api/teams/{id}` - Get team + players
- `POST /api/simulate` - Simulate match
  ```json
  {
    "teamAId": "man-utd-1968",
    "teamBId": "brazil-1970",
    "normaliseEra": false
  }
  ```

## Deployment to Azure

```bash
# Create resource group & function app
az group create --name fg-rg --location eastus
az functionapp create --resource-group fg-rg --consumption-plan-id <plan> --runtime dotnet --name <app-name>

# Deploy backend
cd api
func azure functionapp publish <app-name>

# Deploy frontend
cd web
npm run build
# Upload web/dist/ to Azure Static Web App or use Vercel
```

## Next Steps

- Add more teams to `teams-players.json`
- Custom XI builder (pick any 11 players)
- Rematch button
- Formation impact on simulation
- More detailed injury/card logic
