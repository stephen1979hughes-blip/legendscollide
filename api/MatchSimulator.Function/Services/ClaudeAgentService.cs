using System.Text.Json;
using System.Text.Json.Nodes;
using MatchSimulator.Function.Models;

namespace MatchSimulator.Function.Services;

public class ClaudeAgentService
{
    private readonly TeamDataLoader _teamDataLoader;
    private readonly CommentaryGenerator _commentaryGenerator;
    private readonly HttpClient _httpClient;

    public ClaudeAgentService(TeamDataLoader teamDataLoader, CommentaryGenerator commentaryGenerator)
    {
        _teamDataLoader = teamDataLoader;
        _commentaryGenerator = commentaryGenerator;
        _httpClient = new HttpClient();
    }

    public async Task<MatchResult> SimulateMatchWithAgentAsync(Team teamA, Team teamB)
    {
        var apiKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY");
        if (string.IsNullOrEmpty(apiKey))
            throw new InvalidOperationException("ANTHROPIC_API_KEY environment variable not set");

        Console.WriteLine($"[ClaudeAgent] Starting: {teamA.Name} vs {teamB.Name}");

        var events = new List<MatchEvent>();
        var homeScore = 0;
        var awayScore = 0;

        events.Add(new MatchEvent { Minute = 0, Type = "normal", Text = $"{teamA.Name} vs {teamB.Name}", ScoreA = 0, ScoreB = 0 });

        var tools = new JsonArray
        {
            new JsonObject
            {
                ["name"] = "log_event",
                ["description"] = "Log a match event",
                ["input_schema"] = new JsonObject
                {
                    ["type"] = "object",
                    ["properties"] = new JsonObject
                    {
                        ["minute"] = new JsonObject { ["type"] = "integer", ["description"] = "Minute (0-90)" },
                        ["eventType"] = new JsonObject { ["type"] = "string", ["description"] = "goal, chance, shot, save, tackle, corner" },
                        ["team"] = new JsonObject { ["type"] = "string", ["description"] = "home or away" },
                        ["playerId"] = new JsonObject { ["type"] = "string", ["description"] = "Player name" },
                        ["description"] = new JsonObject { ["type"] = "string", ["description"] = "Event description" }
                    },
                    ["required"] = new JsonArray { "minute", "eventType", "team", "description" }
                }
            }
        };

        var systemPrompt = $@"You are a football match simulator. Simulate a realistic 90-minute match between:
- Home: {teamA.Name} (players: {string.Join(", ", teamA.Players.Take(6).Select(p => p.Name))})
- Away: {teamB.Name} (players: {string.Join(", ", teamB.Players.Take(6).Select(p => p.Name))})

SCORING RULES (strictly follow these):
- Most matches end 1-0, 1-1, 2-0, 2-1 or 0-0. High scores are rare.
- Maximum 4 goals total in the entire match. Usually 2-3 goals.
- Do NOT score more than 3 goals for one team.

Call log_event for each significant moment across the full 90 minutes:
- Kickoff at minute 0
- 8-12 chances/shots spread across the match
- 1-3 goals total (or 0 for a draw)
- A few saves, tackles, corners
- Halftime around minute 45
- Full time at minute 90

Be creative with descriptions using the actual player names.";

        var messages = new JsonArray
        {
            new JsonObject { ["role"] = "user", ["content"] = "Simulate the full 90-minute match now." }
        };

        var conversationTurns = 0;
        while (conversationTurns < 10)
        {
            conversationTurns++;
            Console.WriteLine($"[ClaudeAgent] Turn {conversationTurns}...");

            var requestPayload = new JsonObject
            {
                ["model"] = "claude-haiku-4-5-20251001",
                ["max_tokens"] = 8192,
                ["system"] = systemPrompt,
                ["tools"] = tools.Deserialize<JsonNode>(),
                ["messages"] = messages.Deserialize<JsonNode>()
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages");
            request.Headers.Add("x-api-key", apiKey);
            request.Headers.Add("anthropic-version", "2023-06-01");
            request.Content = new StringContent(requestPayload.ToJsonString(), System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"[ClaudeAgent] Error {response.StatusCode}: {responseContent}");
                throw new InvalidOperationException($"Claude API error: {response.StatusCode} - {responseContent}");
            }

            var responseJson = JsonNode.Parse(responseContent)!;
            var stopReason = responseJson["stop_reason"]?.GetValue<string>();
            var contentBlocks = responseJson["content"]!.AsArray();

            Console.WriteLine($"[ClaudeAgent] Stop reason: {stopReason}, blocks: {contentBlocks.Count}");

            // Collect all tool_use blocks and their IDs
            var toolUseIds = new List<string>();
            var assistantContentBlocks = new JsonArray();

            foreach (var block in contentBlocks)
            {
                var blockType = block!["type"]?.GetValue<string>();
                var blockCopy = JsonNode.Parse(block.ToJsonString())!;
                assistantContentBlocks.Add(blockCopy);

                if (blockType == "tool_use")
                {
                    var id = block["id"]!.GetValue<string>();
                    toolUseIds.Add(id);

                    var name = block["name"]?.GetValue<string>();
                    if (name == "log_event")
                    {
                        var input = block["input"]!;
                        var eventMinute = input["minute"]?.GetValue<int>() ?? 0;
                        var eventType = input["eventType"]?.GetValue<string>() ?? "normal";
                        var team = input["team"]?.GetValue<string>() ?? "home";
                        var description = input["description"]?.GetValue<string>() ?? "";
                        var playerId = input["playerId"]?.GetValue<string>();

                        Console.WriteLine($"[ClaudeAgent] {eventType} at {eventMinute}' ({team}): {description}");

                        if (eventType == "goal")
                        {
                            if (team == "home") homeScore++;
                            else awayScore++;
                            Console.WriteLine($"[ClaudeAgent] GOAL! {homeScore}-{awayScore}");
                        }

                        events.Add(new MatchEvent
                        {
                            Minute = eventMinute,
                            Type = eventType == "goal" ? "goal" : "normal",
                            Text = description,
                            ScoreA = homeScore,
                            ScoreB = awayScore,
                            GoalScorerName = eventType == "goal" ? (playerId ?? "Unknown") : null
                        });
                    }
                }
            }

            if (toolUseIds.Count == 0 || stopReason == "end_turn")
            {
                Console.WriteLine("[ClaudeAgent] Done!");
                break;
            }

            // Add assistant message
            messages.Add(new JsonObject
            {
                ["role"] = "assistant",
                ["content"] = assistantContentBlocks.Deserialize<JsonNode>()
            });

            // Add tool results for ALL tool_use blocks
            var toolResults = new JsonArray();
            foreach (var id in toolUseIds)
            {
                toolResults.Add(new JsonObject
                {
                    ["type"] = "tool_result",
                    ["tool_use_id"] = id,
                    ["content"] = "Event logged"
                });
            }

            messages.Add(new JsonObject
            {
                ["role"] = "user",
                ["content"] = toolResults.Deserialize<JsonNode>()
            });
        }

        var goalsA = new List<Goal>();
        var goalsB = new List<Goal>();

        foreach (var goalEvent in events.Where(e => e.Type == "goal"))
        {
            var isHomeGoal = goalEvent.ScoreA > goalEvent.ScoreB;
            (isHomeGoal ? goalsA : goalsB).Add(new Goal
            {
                Minute = goalEvent.Minute,
                PlayerName = goalEvent.GoalScorerName ?? "Unknown",
                TeamId = isHomeGoal ? teamA.Id : teamB.Id
            });
        }

        var possessionA = 45 + Random.Shared.Next(-10, 20);
        var result = new MatchResult
        {
            ScoreA = homeScore,
            ScoreB = awayScore,
            GoalsA = goalsA,
            GoalsB = goalsB,
            Stats = new MatchStats
            {
                ShotsA = 8 + Random.Shared.Next(0, 8),
                ShotsB = 8 + Random.Shared.Next(0, 8),
                ShotsOnTargetA = goalsA.Count + Random.Shared.Next(1, 5),
                ShotsOnTargetB = goalsB.Count + Random.Shared.Next(1, 5),
                PossessionA = possessionA,
                PossessionB = 100 - possessionA
            },
            StadiumName = "Historic Stadium",
            KickOffTime = DateTime.Now.ToLongTimeString(),
            ManOfTheMatch = events.LastOrDefault(e => e.GoalScorerName != null)?.GoalScorerName ?? "TBD",
            Events = events
        };

        result.Commentary = _commentaryGenerator.GenerateCommentary(result, teamA, teamB);
        Console.WriteLine($"[ClaudeAgent] Final: {homeScore}-{awayScore}, {events.Count} events");
        return result;
    }
}
