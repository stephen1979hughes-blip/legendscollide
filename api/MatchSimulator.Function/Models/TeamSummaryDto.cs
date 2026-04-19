using System.Text.Json.Serialization;

namespace MatchSimulator.Function.Models;

public class TeamSummaryDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("year")]
    public int Year { get; set; }

    [JsonPropertyName("playerCount")]
    public int PlayerCount { get; set; }
}
