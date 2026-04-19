using System.Text.Json.Serialization;

namespace MatchSimulator.Function.Models;

public class MatchStats
{
    [JsonPropertyName("shotsA")]
    public int ShotsA { get; set; }

    [JsonPropertyName("shotsB")]
    public int ShotsB { get; set; }

    [JsonPropertyName("shotsOnTargetA")]
    public int ShotsOnTargetA { get; set; }

    [JsonPropertyName("shotsOnTargetB")]
    public int ShotsOnTargetB { get; set; }

    [JsonPropertyName("possessionA")]
    public int PossessionA { get; set; }

    [JsonPropertyName("possessionB")]
    public int PossessionB { get; set; }
}
