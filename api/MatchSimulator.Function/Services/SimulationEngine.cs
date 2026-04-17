using MatchSimulator.Function.Models;

namespace MatchSimulator.Function.Services;

public class SimulationEngine
{
    private readonly CommentaryGenerator _commentary;
    private readonly Random _random = new();

    public SimulationEngine(CommentaryGenerator commentary)
    {
        _commentary = commentary;
    }

    public MatchResult SimulateMatch(Team teamA, Team teamB, bool normaliseEra = false)
    {
        var result = new MatchResult();

        var attackA = CalculateAttack(teamA, normaliseEra);
        var defenceA = CalculateDefence(teamA, normaliseEra);
        var attackB = CalculateAttack(teamB, normaliseEra);
        var defenceB = CalculateDefence(teamB, normaliseEra);

        var chancesA = CalculateChances(attackA, defenceB);
        var chancesB = CalculateChances(attackB, defenceA);

        var conversionRateA = 0.20 + (attackA - defenceB) / 1000.0;
        var conversionRateB = 0.20 + (attackB - defenceA) / 1000.0;

        conversionRateA = Math.Max(0.10, Math.Min(0.30, conversionRateA));
        conversionRateB = Math.Max(0.10, Math.Min(0.30, conversionRateB));

        var goalsA = SimulateGoals(chancesA, conversionRateA, teamA);
        var goalsB = SimulateGoals(chancesB, conversionRateB, teamB);

        result.ScoreA = goalsA.Count;
        result.ScoreB = goalsB.Count;
        result.GoalsA = goalsA;
        result.GoalsB = goalsB;

        result.Stats = new MatchStats
        {
            ShotsA = chancesA,
            ShotsB = chancesB,
            ShotsOnTargetA = Math.Max(goalsA.Count, chancesA / 2),
            ShotsOnTargetB = Math.Max(goalsB.Count, chancesB / 2),
            PossessionA = CalculatePossession(attackA, defenceA, attackB, defenceB),
            PossessionB = 100 - CalculatePossession(attackA, defenceA, attackB, defenceB)
        };

        result.Commentary = _commentary.GenerateCommentary(result, teamA, teamB);

        result.StadiumName = GetRandomStadium();
        result.KickOffTime = GetRandomKickOffTime();
        result.ManOfTheMatch = DetermineManOfTheMatch(result, teamA, teamB);

        if (teamA.Year < 1980 || teamB.Year < 1980)
            result.EraFlavour = "A bruising, old-school encounter.";
        else if (teamA.Year > 2008 && teamB.Year > 2008)
            result.EraFlavour = "High tempo, pressing from both sides.";

        return result;
    }

    private int CalculateAttack(Team team, bool normaliseEra)
    {
        var outfieldPlayers = team.Players.Where(p => p.Position != "GK").ToList();
        var attackers = outfieldPlayers.Where(p => p.Position == "FW").ToList();
        var mids = outfieldPlayers.Where(p => p.Position == "MF").ToList();

        var avgAttack = (attackers.Sum(p => p.AttackRating) + mids.Sum(p => p.AttackRating))
            / (double)(attackers.Count + mids.Count);

        if (normaliseEra && team.Year < 1990)
            avgAttack *= 1.1;

        return (int)avgAttack;
    }

    private int CalculateDefence(Team team, bool normaliseEra)
    {
        var outfieldPlayers = team.Players.Where(p => p.Position != "GK").ToList();
        var defenders = outfieldPlayers.Where(p => p.Position == "DF").ToList();
        var mids = outfieldPlayers.Where(p => p.Position == "MF").ToList();

        var avgDefence = (defenders.Sum(p => p.DefenceRating) + mids.Sum(p => p.DefenceRating))
            / (double)(defenders.Count + mids.Count);

        if (normaliseEra && team.Year < 1990)
            avgDefence *= 1.1;

        return (int)avgDefence;
    }

    private int CalculateChances(int attack, int defence)
    {
        var baseChances = 8;
        var factor = 0.05;
        var attackDiff = attack - defence;
        var chances = baseChances + (int)(attackDiff * factor);
        var randomVariation = _random.Next(-2, 3);

        return Math.Max(2, Math.Min(15, chances + randomVariation));
    }

    private List<Goal> SimulateGoals(int chances, double conversionRate, Team team)
    {
        var goals = new List<Goal>();
        var attackers = team.Players.Where(p => p.Position == "FW").ToList();

        for (int i = 0; i < chances; i++)
        {
            if (_random.NextDouble() < conversionRate)
            {
                var scorer = attackers[_random.Next(attackers.Count)];
                var minute = _random.Next(10, 91);

                goals.Add(new Goal
                {
                    Minute = minute,
                    PlayerName = scorer.Name,
                    TeamId = team.Id
                });
            }
        }

        return goals.OrderBy(g => g.Minute).ToList();
    }

    private int CalculatePossession(int attackA, int defenceA, int attackB, int defenceB)
    {
        var teamAStrength = attackA + defenceA;
        var teamBStrength = attackB + defenceB;
        var total = teamAStrength + teamBStrength;

        return total == 0 ? 50 : (int)(50 + (teamAStrength - teamBStrength) / 2.0);
    }

    private string GetRandomStadium()
    {
        var stadiums = new[]
        {
            "Old Trafford",
            "Anfield",
            "Wembley",
            "Camp Nou",
            "Maracana",
            "San Siro",
            "Bernabeu",
            "Estadio Da Luz"
        };
        return stadiums[_random.Next(stadiums.Length)];
    }

    private string GetRandomKickOffTime()
    {
        var hours = _random.Next(15, 21);
        var minutes = _random.Next(0, 2) * 30;
        return $"{hours:D2}:{minutes:D2}";
    }

    private string DetermineManOfTheMatch(MatchResult result, Team teamA, Team teamB)
    {
        if (result.GoalsA.Any())
            return result.GoalsA.Last().PlayerName;
        if (result.GoalsB.Any())
            return result.GoalsB.Last().PlayerName;

        if (result.ScoreA > result.ScoreB)
        {
            var winningTeam = teamA;
            return winningTeam.Players.Where(p => p.Position != "GK").MaxBy(p => p.OverallRating)?.Name ?? "Unknown";
        }

        if (result.ScoreB > result.ScoreA)
        {
            var winningTeam = teamB;
            return winningTeam.Players.Where(p => p.Position != "GK").MaxBy(p => p.OverallRating)?.Name ?? "Unknown";
        }

        var topPlayer = teamA.Players.Concat(teamB.Players)
            .Where(p => p.Position != "GK")
            .MaxBy(p => p.OverallRating);

        return topPlayer?.Name ?? "Unknown";
    }
}
