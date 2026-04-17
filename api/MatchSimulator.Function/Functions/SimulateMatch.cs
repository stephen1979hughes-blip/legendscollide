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
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "simulate")] HttpRequestData req)
    {
        try
        {
            var requestBody = await req.ReadAsStringAsync();
            var request = JsonSerializer.Deserialize<SimulateMatchRequest>(requestBody);

            if (request == null || string.IsNullOrEmpty(request.TeamAId) || string.IsNullOrEmpty(request.TeamBId))
            {
                var badResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                badResponse.Headers.Add("Content-Type", "application/json; charset=utf-8");
                badResponse.WriteString("{\"error\":\"TeamAId and TeamBId required\"}");
                return badResponse;
            }

            var teamA = _dataLoader.GetTeamById(request.TeamAId);
            var teamB = _dataLoader.GetTeamById(request.TeamBId);

            if (teamA == null || teamB == null)
            {
                var notFoundResponse = req.CreateResponse(HttpStatusCode.NotFound);
                notFoundResponse.Headers.Add("Content-Type", "application/json; charset=utf-8");
                notFoundResponse.WriteString("{\"error\":\"One or both teams not found\"}");
                return notFoundResponse;
            }

            var result = _engine.SimulateMatch(teamA, teamB, request.NormaliseEra);

            var response = req.CreateResponse(HttpStatusCode.OK);
            response.Headers.Add("Content-Type", "application/json; charset=utf-8");
            response.WriteAsJsonAsync(result);

            return response;
        }
        catch (Exception ex)
        {
            var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
            errorResponse.Headers.Add("Content-Type", "application/json; charset=utf-8");
            errorResponse.WriteString($"{{\"error\":\"Internal server error: {ex.Message}\"}}");
            return errorResponse;
        }
    }
}
