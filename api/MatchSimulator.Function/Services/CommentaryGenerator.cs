using MatchSimulator.Function.Models;

namespace MatchSimulator.Function.Services;

public class CommentaryGenerator
{
    private readonly Random _random = new();

    public List<string> GenerateCommentary(MatchResult result, Team teamA, Team teamB)
    {
        var commentary = new List<string>
        {
            $"{result.StadiumName}, {result.KickOffTime} - The match begins.",
            $"{teamA.Name} ({teamA.Year}) vs {teamB.Name} ({teamB.Year})"
        };

        AddTeamPressure(commentary, teamA, teamB, result, true);
        AddTeamPressure(commentary, teamB, teamA, result, false);

        foreach (var goal in result.GoalsA.OrderBy(g => g.Minute))
        {
            commentary.Add($"{goal.Minute}' - GOAL! {goal.PlayerName} finishes for {teamA.Name}!");
        }

        foreach (var goal in result.GoalsB.OrderBy(g => g.Minute))
        {
            commentary.Add($"{goal.Minute}' - GOAL! {goal.PlayerName} finishes for {teamB.Name}!");
        }

        AddMidMatchEvents(commentary, teamA, teamB);

        if (result.Stats.PossessionA > result.Stats.PossessionB)
            commentary.Add($"{teamA.Name} controlled possession with {result.Stats.PossessionA}% of the ball.");
        else
            commentary.Add($"{teamB.Name} controlled possession with {result.Stats.PossessionB}% of the ball.");

        var minute = _random.Next(80, 91);
        if (result.ScoreA > result.ScoreB)
            commentary.Add($"{minute}' - {teamA.Name} see out the remaining time.");
        else if (result.ScoreB > result.ScoreA)
            commentary.Add($"{minute}' - {teamB.Name} see out the remaining time.");
        else
            commentary.Add($"{minute}' - Both sides push for a winner.");

        commentary.Add($"Full Time: {teamA.Name} {result.ScoreA} - {result.ScoreB} {teamB.Name}");
        commentary.Add($"Man of the Match: {result.ManOfTheMatch}");

        return commentary;
    }

    private void AddTeamPressure(List<string> commentary, Team team, Team opponent, MatchResult result, bool isTeamA)
    {
        var chances = isTeamA ? result.Stats.ShotsA : result.Stats.ShotsB;
        var possessionPct = isTeamA ? result.Stats.PossessionA : result.Stats.PossessionB;

        if (chances > 10)
            commentary.Add($"{team.Name} are piling on the pressure.");
        if (possessionPct > 60)
            commentary.Add($"{team.Name} are dictating the tempo.");
    }

    private void AddMidMatchEvents(List<string> commentary, Team teamA, Team teamB)
    {
        var events = new[]
        {
            $"A half-chance goes begging for {(Random.Shared.Next(2) == 0 ? teamA.Name : teamB.Name)}.",
            "Play flows from end to end.",
            "Intensity rising on the pitch.",
            "The crowd senses a goal coming.",
            "Midfield battle intensifying."
        };

        for (int i = 0; i < 2; i++)
        {
            commentary.Add(events[_random.Next(events.Length)]);
        }
    }
}
