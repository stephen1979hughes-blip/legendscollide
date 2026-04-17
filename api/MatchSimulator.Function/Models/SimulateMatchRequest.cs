namespace MatchSimulator.Function.Models;

public class SimulateMatchRequest
{
    public string TeamAId { get; set; } = string.Empty;
    public string TeamBId { get; set; } = string.Empty;
    public bool NormaliseEra { get; set; } = false;
}
