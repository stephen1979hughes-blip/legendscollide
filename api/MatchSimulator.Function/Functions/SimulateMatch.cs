using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using System.Net;
using System.Text.Json;
using MatchSimulator.Function.Models;
using MatchSimulator.Function.Services;

namespace MatchSimulator.Function.Functions;

public class SimulateMatch
{
    private readonly TeamDataLoader _dataLoader;
    private readonly SimulationEngine _engine;

    public SimulateMatch(TeamDataLoader dataLoader, SimulationEngine engine)
    {
        _dataLoader = dataLoader;
        _engine = engine;
    }

    [Function("SimulateMatch")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, new[] { "post", "options" }, Route = "simulate")] HttpRequestData req)
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
            var request = JsonSerializer.Deserialize<SimulateMatchRequest>(requestBody);

            if (request == null || string.IsNullOrEmpty(request.TeamAId) || string.IsNullOrEmpty(request.TeamBId))
            {
                var badResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                badResponse.Headers.TryAddWithoutValidation("Access-Control-Allow-Origin", "*");
                badResponse.Headers.TryAddWithoutValidation("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                badResponse.Headers.TryAddWithoutValidation("Access-Control-Allow-Headers", "Content-Type");
                await badResponse.WriteAsJsonAsync(new { error = "TeamAId and TeamBId required" });
                return badResponse;
            }

            var teamA = _dataLoader.GetTeamById(request.TeamAId);
            var teamB = _dataLoader.GetTeamById(request.TeamBId);

            if (teamA == null || teamB == null)
            {
                var notFoundResponse = req.CreateResponse(HttpStatusCode.NotFound);
                notFoundResponse.Headers.TryAddWithoutValidation("Access-Control-Allow-Origin", "*");
                notFoundResponse.Headers.TryAddWithoutValidation("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                notFoundResponse.Headers.TryAddWithoutValidation("Access-Control-Allow-Headers", "Content-Type");
                await notFoundResponse.WriteAsJsonAsync(new { error = "One or both teams not found" });
                return notFoundResponse;
            }

            var result = _engine.SimulateMatch(teamA, teamB, request.NormaliseEra);

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
            errorResponse.Headers.TryAddWithoutValidation("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            errorResponse.Headers.TryAddWithoutValidation("Access-Control-Allow-Headers", "Content-Type");
            await errorResponse.WriteAsJsonAsync(new { error = $"Internal server error: {ex.Message}" });
            return errorResponse;
        }
    }
}
