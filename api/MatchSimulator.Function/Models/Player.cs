namespace MatchSimulator.Function.Models;

public class Player
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty; // GK, DF, MF, FW
    public int OverallRating { get; set; }
    public int AttackRating { get; set; }
    public int DefenceRating { get; set; }
    public int Stamina { get; set; }
}
