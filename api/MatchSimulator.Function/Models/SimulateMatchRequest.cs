using System.Text.Json.Serialization;

namespace MatchSimulator.Function.Models;

public class SimulateMatchRequest
{
    [JsonPropertyName("teamAId")]
    public string TeamAId { get; set; } = string.Empty;

    [JsonPropertyName("teamBId")]
    public string TeamBId { get; set; } = string.Empty;

    [JsonPropertyName("normaliseEra")]
    public bool NormaliseEra { get; set; } = false;
}
