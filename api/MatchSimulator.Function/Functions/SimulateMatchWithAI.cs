using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using System.Net;
using System.Text.Json;
using MatchSimulator.Function.Models;
using MatchSimulator.Function.Services;

namespace MatchSimulator.Function.Functions;

public class SimulateMatchWithAI
{
    private readonly TeamDataLoader _dataLoader;
    private readonly ClaudeAgentService _groqAgent;

    public SimulateMatchWithAI(TeamDataLoader dataLoader, ClaudeAgentService groqAgent)
    {
        _dataLoader = dataLoader;
        _groqAgent = groqAgent;
    }

    [Function("SimulateMatchWithAI")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, new[] { "post", "options" }, Route = "simulateAi")] HttpRequestData req)
    {
        if (req.Method == "OPTIONS")
        {
            var optionsResponse = req.CreateResponse(HttpStatusCode.NoContent);
            optionsResponse.Headers.TryAddWithoutValidation("Access-Control-Allow-Origin", "*");
            optionsResponse.Headers.TryAddWithoutValidation("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            optionsResponse.Headers.TryAddWithoutValidation("Access-Control-Allow-Headers", "Content-Type");
            optionsResponse.Headers.TryAddWithoutValidation("Access-Control-Max-Age", "3600");
            return optionsResponse;
        }

        try
        {
            var requestBody = await req.ReadAsStringAsync();
            Console.WriteLine($"[SimulateMatchWithAI] Request body: {requestBody}");

            var request = JsonSerializer.Deserialize<SimulateMatchRequest>(requestBody);

            if (request == null || string.IsNullOrEmpty(request.TeamAId) || string.IsNullOrEmpty(request.TeamBId))
            {
                var badResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                badResponse.Headers.TryAddWithoutValidation("Access-Control-Allow-Origin", "*");
                await badResponse.WriteAsJsonAsync(new { error = "teamAId and teamBId required" });
                return badResponse;
            }

            Console.WriteLine($"[SimulateMatchWithAI] Looking for teams: {request.TeamAId} vs {request.TeamBId}");

            var teamA = _dataLoader.GetTeamById(request.TeamAId);
            var teamB = _dataLoader.GetTeamById(request.TeamBId);

            Console.WriteLine($"[SimulateMatchWithAI] Found teamA: {teamA?.Name ?? "NULL"}, teamB: {teamB?.Name ?? "NULL"}");

            if (teamA == null || teamB == null)
            {
                var notFoundResponse = req.CreateResponse(HttpStatusCode.NotFound);
                notFoundResponse.Headers.TryAddWithoutValidation("Access-Control-Allow-Origin", "*");
                await notFoundResponse.WriteAsJsonAsync(new
                {
                    error = "One or both teams not found",
                    requestedTeamAId = request.TeamAId,
                    requestedTeamBId = request.TeamBId,
                    foundTeamA = teamA?.Name ?? "NULL",
                    foundTeamB = teamB?.Name ?? "NULL"
                });
                return notFoundResponse;
            }

            var result = await _groqAgent.SimulateMatchWithAgentAsync(teamA, teamB);

            var response = req.CreateResponse(HttpStatusCode.OK);
            response.Headers.TryAddWithoutValidation("Access-Control-Allow-Origin", "*");
            response.Headers.TryAddWithoutValidation("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            response.Headers.TryAddWithoutValidation("Access-Control-Allow-Headers", "Content-Type");
            await response.WriteAsJsonAsync(result);
            return response;
        }
        catch (Exception ex)
        {
            var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
            errorResponse.Headers.TryAddWithoutValidation("Access-Control-Allow-Origin", "*");
            await errorResponse.WriteAsJsonAsync(new { error = $"Internal server error: {ex.Message}" });
            return errorResponse;
        }
    }
}
