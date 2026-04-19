using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using System.Net;
using System.Text.Json;
using MatchSimulator.Function.Models;
using MatchSimulator.Function.Services;

namespace MatchSimulator.Function.Functions;

public class GetTeams
{
    private readonly TeamDataLoader _dataLoader;

    public GetTeams(TeamDataLoader dataLoader)
    {
        _dataLoader = dataLoader;
    }

    [Function("GetTeams")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "teams")] HttpRequestData req)
    {
        var teams = _dataLoader.GetTeams();

        var teamSummaries = teams.Select(t => new TeamSummaryDto
        {
            Id = t.Id,
            Name = t.Name,
            Year = t.Year,
            PlayerCount = t.Players.Count
        }).ToList();

        var response = req.CreateResponse(HttpStatusCode.OK);
        response.Headers.TryAddWithoutValidation("Access-Control-Allow-Origin", "*");
        response.Headers.TryAddWithoutValidation("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.Headers.TryAddWithoutValidation("Access-Control-Allow-Headers", "Content-Type");
        await response.WriteAsJsonAsync(teamSummaries);
        return response;
    }
}
