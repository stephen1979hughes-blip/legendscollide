namespace MatchSimulator.Function.Models;

public class MatchStats
{
    public int ShotsA { get; set; }
    public int ShotsB { get; set; }
    public int ShotsOnTargetA { get; set; }
    public int ShotsOnTargetB { get; set; }
    public int PossessionA { get; set; } // percentage 0-100
    public int PossessionB { get; set; }
}
