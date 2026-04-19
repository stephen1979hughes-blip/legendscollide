using System.Text.Json.Serialization;

namespace MatchSimulator.Function.Models;

public class Player
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("position")]
    public string Position { get; set; } = string.Empty;

    [JsonPropertyName("overallRating")]
    public int OverallRating { get; set; }

    [JsonPropertyName("attackRating")]
    public int AttackRating { get; set; }

    [JsonPropertyName("defenceRating")]
    public int DefenceRating { get; set; }

    [JsonPropertyName("stamina")]
    public int Stamina { get; set; }
}
