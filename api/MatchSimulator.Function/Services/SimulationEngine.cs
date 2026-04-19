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

        // Generate match events with timestamps for broadcast
        result.Events = GenerateMatchEvents(result, teamA, teamB);

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

    private List<MatchEvent> GenerateMatchEvents(MatchResult result, Team teamA, Team teamB)
    {
        var events = new List<MatchEvent>();

        // Combine all goals with their scores
        var allGoals = new List<(int minute, string playerName, string teamId)>();
        allGoals.AddRange(result.GoalsA.Select(g => (g.Minute, g.PlayerName, g.TeamId)));
        allGoals.AddRange(result.GoalsB.Select(g => (g.Minute, g.PlayerName, g.TeamId)));
        allGoals = allGoals.OrderBy(g => g.minute).ToList();

        // Build a lookup of goals by minute for quick access
        var goalsAtMinute = new Dictionary<int, List<(string playerName, string teamId)>>();
        foreach (var goal in allGoals)
        {
            if (!goalsAtMinute.ContainsKey(goal.minute))
                goalsAtMinute[goal.minute] = new List<(string, string)>();
            goalsAtMinute[goal.minute].Add((goal.playerName, goal.teamId));
        }

        int currentScoreA = 0;
        int currentScoreB = 0;

        // Generate events for every 5 minute interval from 5 to 90
        for (int minute = 5; minute <= 90; minute += 5)
        {
            // Check if there are goals at this minute
            if (goalsAtMinute.ContainsKey(minute))
            {
                foreach (var (playerName, teamId) in goalsAtMinute[minute])
                {
                    if (teamId == teamA.Id)
                        currentScoreA++;
                    else
                        currentScoreB++;

                    var teamName = teamId == teamA.Id ? teamA.Name : teamB.Name;
                    events.Add(new MatchEvent
                    {
                        Minute = minute,
                        Type = "goal",
                        Text = $"GOAL! {playerName} scores for {teamName}!",
                        GoalScorerName = playerName,
                        ScoreA = currentScoreA,
                        ScoreB = currentScoreB
                    });
                }
            }
            else
            {
                // Add regular commentary if no goal at this minute
                var commentary = GetCommentaryForMinute(minute, result, teamA, teamB, currentScoreA, currentScoreB);
                if (!string.IsNullOrEmpty(commentary))
                {
                    events.Add(new MatchEvent
                    {
                        Minute = minute,
                        Type = minute % 20 == 0 ? "highlight" : "normal",
                        Text = commentary,
                        ScoreA = currentScoreA,
                        ScoreB = currentScoreB
                    });
                }
            }
        }

        return events;
    }

    private string GetCommentaryForMinute(int minute, MatchResult result, Team teamA, Team teamB, int scoreA, int scoreB)
    {
        var commentaries = new[]
        {
            $"{teamA.Name} pushing forward.",
            $"{teamB.Name} looking for an opening.",
            "Great passing move from the midfield.",
            "Solid defending so far.",
            "Both teams looking sharp.",
            $"{teamA.Name} dominating possession.",
            $"{teamB.Name} with a quick counter-attack.",
            "Intense battle in midfield.",
            "The crowd is really getting behind their team.",
            "End-to-end action here.",
            "Dangerous free kick opportunity.",
            "That was a close one!",
            "Excellent save from the keeper.",
            "Both teams showing great energy.",
            "The momentum is shifting.",
        };

        if (minute == 45)
            return $"HALF TIME: {teamA.Name} {scoreA} - {scoreB} {teamB.Name}";

        if (minute == 90)
            return $"FULL TIME: {teamA.Name} {scoreA} - {scoreB} {teamB.Name}";

        return commentaries[_random.Next(commentaries.Length)];
    }
}
