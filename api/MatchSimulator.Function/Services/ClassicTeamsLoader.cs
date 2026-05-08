using System.Reflection;
using System.Text.Json;
using MatchSimulator.Function.Data;
using MatchSimulator.Function.Models;
using Microsoft.EntityFrameworkCore;

namespace MatchSimulator.Function.Services;

public class ClassicTeamsLoader
{
    private readonly FootballDbContext _dbContext;

    public ClassicTeamsLoader(FootballDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task InitializeClassicTeamsAsync()
    {
        // Check if classic teams already loaded
        var existingClassicTeams = await _dbContext.Teams
            .Where(t => t.Year > 0)  // Assuming year > 0 indicates classic teams
            .CountAsync();

        if (existingClassicTeams > 0)
        {
            Console.WriteLine("[DB] Classic teams already loaded, skipping.");
            return;
        }

        Console.WriteLine("[DB] Loading classic teams from teams-players.json...");

        try
        {
            // Load player bios
            var bios = await LoadPlayerBiosAsync();
            Console.WriteLine($"[DB] Loaded {bios.Count} player bios.");

            var json = await LoadJsonFromEmbeddedResource("MatchSimulator.Function.Data.teams-players.json");
            if (json == null)
            {
                Console.WriteLine("[DB] teams-players.json not found as embedded resource, trying file system...");
                var filePath = Path.Combine(AppContext.BaseDirectory, "Data", "teams-players.json");
                if (File.Exists(filePath))
                    json = await File.ReadAllTextAsync(filePath);
                else
                {
                    Console.WriteLine("[DB] teams-players.json not found.");
                    return;
                }
            }

            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            // Load teams and players from the JSON
            var teamsData = root.GetProperty("teams").EnumerateArray().ToList();
            var playersData = root.GetProperty("players").EnumerateArray()
                .Select(p => JsonSerializer.Deserialize<Player>(p.GetRawText())!)
                .ToList();

            // Populate bios for players
            foreach (var player in playersData)
            {
                if (bios.TryGetValue(player.Id, out var bio))
                {
                    player.Bio = bio;
                }
            }

            int createdPlayers = 0;
            int linkedPlayers = 0;

            // Process each classic team
            foreach (var teamData in teamsData)
            {
                var teamId = teamData.GetProperty("id").GetString() ?? string.Empty;
                var teamName = teamData.GetProperty("name").GetString() ?? string.Empty;
                var teamYear = teamData.GetProperty("year").GetInt32();

                // Check if team already exists
                var existingTeam = await _dbContext.Teams.FirstOrDefaultAsync(t => t.Id == teamId);
                if (existingTeam != null)
                {
                    Console.WriteLine($"[DB] Team {teamId} already exists, skipping.");
                    continue;
                }

                // Create a club for this classic team if it doesn't exist
                var clubId = $"{teamId}-club";
                var existingClub = await _dbContext.Clubs.FirstOrDefaultAsync(c => c.Id == clubId);
                if (existingClub == null)
                {
                    var club = new Club
                    {
                        Id = clubId,
                        Name = teamName,
                        ShortName = teamName,
                        CountryId = "unknown",
                        City = "Unknown",
                        Founded = teamYear
                    };
                    _dbContext.Clubs.Add(club);
                }

                // Create the team
                var team = new Team
                {
                    Id = teamId,
                    Name = teamName,
                    Year = teamYear,
                    ClubId = clubId,
                    Season = $"{teamYear - 1}-{teamYear}",
                    Description = $"{teamName} {teamYear}",
                    Players = new List<Player>()
                };

                // Get player IDs for this team
                var playerIds = teamData.GetProperty("playerIds")
                    .EnumerateArray()
                    .Select(p => p.GetString() ?? string.Empty)
                    .ToList();

                // Process each player for this team
                foreach (var playerId in playerIds)
                {
                    var playerData = playersData.FirstOrDefault(p => p.Id == playerId);
                    if (playerData == null)
                        continue;

                    // Try to find existing player by ID or name
                    var existingPlayer = await _dbContext.Players
                        .FirstOrDefaultAsync(p =>
                            p.Id == playerId ||
                            p.Name.ToLower() == playerData.Name.ToLower());

                    if (existingPlayer != null)
                    {
                        // Player exists, link to team if not already linked
                        if (!team.Players.Any(p => p.Id == existingPlayer.Id))
                        {
                            existingPlayer.TeamId = team.Id;
                            team.Players.Add(existingPlayer);
                            linkedPlayers++;
                        }
                    }
                    else
                    {
                        // Create new player
                        playerData.TeamId = team.Id;
                        _dbContext.Players.Add(playerData);
                        team.Players.Add(playerData);
                        createdPlayers++;
                    }
                }

                _dbContext.Teams.Add(team);
                await _dbContext.SaveChangesAsync();
                Console.WriteLine($"[DB] Loaded classic team: {teamName} ({playerIds.Count} players)");
            }

            Console.WriteLine($"[DB] Classic teams loading complete: {createdPlayers} new players created, {linkedPlayers} existing players linked.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DB] Error loading classic teams: {ex.Message}");
            throw;
        }
    }

    private async Task<string?> LoadJsonFromEmbeddedResource(string resourceName)
    {
        try
        {
            var assembly = Assembly.GetExecutingAssembly();
            using var stream = assembly.GetManifestResourceStream(resourceName);
            if (stream == null)
                return null;

            using var reader = new StreamReader(stream);
            return await reader.ReadToEndAsync();
        }
        catch
        {
            return null;
        }
    }

    private async Task<Dictionary<string, string>> LoadPlayerBiosAsync()
    {
        var bios = new Dictionary<string, string>();

        try
        {
            var filePath = Path.Combine(AppContext.BaseDirectory, "Data", "player-bios.json");
            if (!File.Exists(filePath))
            {
                Console.WriteLine("[DB] player-bios.json not found, continuing without bios.");
                return bios;
            }

            var json = await File.ReadAllTextAsync(filePath);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (root.TryGetProperty("bios", out var biosElement) && biosElement.ValueKind == System.Text.Json.JsonValueKind.Object)
            {
                foreach (var prop in biosElement.EnumerateObject())
                {
                    if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.String)
                    {
                        bios[prop.Name] = prop.Value.GetString() ?? string.Empty;
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DB] Error loading player bios: {ex.Message}");
        }

        return bios;
    }
}
