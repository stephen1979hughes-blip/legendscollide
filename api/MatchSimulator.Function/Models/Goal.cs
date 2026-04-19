using System.Text.Json.Serialization;

namespace MatchSimulator.Function.Models;

public class Goal
{
    [JsonPropertyName("minute")]
    public int Minute { get; set; }

    [JsonPropertyName("playerName")]
    public string PlayerName { get; set; } = string.Empty;

    [JsonPropertyName("teamId")]
    public string TeamId { get; set; } = string.Empty;
}
