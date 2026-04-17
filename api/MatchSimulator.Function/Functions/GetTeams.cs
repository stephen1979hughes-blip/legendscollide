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
    public HttpResponseData Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "teams")] HttpRequestData req)
    {
        var teams = _dataLoader.GetTeams();

        var teamSummaries = teams.Select(t => new
        {
            t.Id,
            t.Name,
            t.Year,
            PlayerCount = t.Players.Count
        }).ToList();

        var response = req.CreateResponse(HttpStatusCode.OK);
        response.Headers.Add("Content-Type", "application/json; charset=utf-8");
        response.WriteAsJsonAsync(teamSummaries);

        return response;
    }
}
