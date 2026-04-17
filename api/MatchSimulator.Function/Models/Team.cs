namespace MatchSimulator.Function.Models;

public class Team
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Year { get; set; }
    public List<Player> Players { get; set; } = new();
}
