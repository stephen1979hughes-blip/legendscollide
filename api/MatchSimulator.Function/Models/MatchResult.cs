namespace MatchSimulator.Function.Models;

public class MatchResult
{
    public int ScoreA { get; set; }
    public int ScoreB { get; set; }
    public List<Goal> GoalsA { get; set; } = new();
    public List<Goal> GoalsB { get; set; } = new();
    public MatchStats Stats { get; set; } = new();
    public List<string> Commentary { get; set; } = new();
    public string StadiumName { get; set; } = string.Empty;
    public string KickOffTime { get; set; } = string.Empty;
    public string ManOfTheMatch { get; set; } = string.Empty;
    public string? EraFlavour { get; set; }
}
