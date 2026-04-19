using System.Text.Json.Serialization;

namespace MatchSimulator.Function.Models;

public class MatchResult
{
    [JsonPropertyName("scoreA")]
    public int ScoreA { get; set; }

    [JsonPropertyName("scoreB")]
    public int ScoreB { get; set; }

    [JsonPropertyName("goalsA")]
    public List<Goal> GoalsA { get; set; } = new();

    [JsonPropertyName("goalsB")]
    public List<Goal> GoalsB { get; set; } = new();

    [JsonPropertyName("stats")]
    public MatchStats Stats { get; set; } = new();

    [JsonPropertyName("commentary")]
    public List<string> Commentary { get; set; } = new();

    [JsonPropertyName("stadiumName")]
    public string StadiumName { get; set; } = string.Empty;

    [JsonPropertyName("kickOffTime")]
    public string KickOffTime { get; set; } = string.Empty;

    [JsonPropertyName("manOfTheMatch")]
    public string ManOfTheMatch { get; set; } = string.Empty;

    [JsonPropertyName("eraFlavour")]
    public string? EraFlavour { get; set; }

    [JsonPropertyName("events")]
    public List<MatchEvent> Events { get; set; } = new();
}
