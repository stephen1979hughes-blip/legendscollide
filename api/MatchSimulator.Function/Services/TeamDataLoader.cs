using System.Reflection;
using System.Text.Json;
using MatchSimulator.Function.Models;

namespace MatchSimulator.Function.Services;

public class TeamDataLoader
{
    private List<Team>? _teams;
    private readonly object _lock = new();

    public List<Team> GetTeams()
    {
        if (_teams != null)
            return _teams;

        lock (_lock)
        {
            if (_teams != null)
                return _teams;

            _teams = LoadTeamsFromJson();
        }

        return _teams;
    }

    public Team? GetTeamById(string teamId)
    {
        var teams = GetTeams();
        return teams.FirstOrDefault(t => t.Id == teamId);
    }

    private List<Team> LoadTeamsFromJson()
    {
        var assembly = Assembly.GetExecutingAssembly();
        var resourceName = "MatchSimulator.Function.Data.teams-players.json";

        using var stream = assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException($"Resource {resourceName} not found");

        using var reader = new StreamReader(stream);
        var json = reader.ReadToEnd();

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var teamsData = root.GetProperty("teams").EnumerateArray().ToList();
        var playersData = root.GetProperty("players").EnumerateArray()
            .Select(p => JsonSerializer.Deserialize<Player>(p.GetRawText())!)
            .ToList();

        var teams = new List<Team>();
        foreach (var teamData in teamsData)
        {
            var team = new Team
            {
                Id = teamData.GetProperty("id").GetString() ?? string.Empty,
                Name = teamData.GetProperty("name").GetString() ?? string.Empty,
                Year = teamData.GetProperty("year").GetInt32(),
                Players = new()
            };

            var playerIds = teamData.GetProperty("playerIds")
                .EnumerateArray()
                .Select(p => p.GetString() ?? string.Empty)
                .ToList();

            team.Players = playersData
                .Where(p => playerIds.Contains(p.Id))
                .ToList();

            teams.Add(team);
        }

        return teams;
    }
}
