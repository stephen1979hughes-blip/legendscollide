using System.Text.Json.Serialization;

namespace MatchSimulator.Function.Models;

public class MatchEvent
{
    [JsonPropertyName("minute")]
    public int Minute { get; set; }

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty; // "goal", "normal", "highlight"

    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;

    [JsonPropertyName("scoreA")]
    public int ScoreA { get; set; }

    [JsonPropertyName("scoreB")]
    public int ScoreB { get; set; }

    [JsonPropertyName("goalScorerName")]
    public string? GoalScorerName { get; set; }
}
