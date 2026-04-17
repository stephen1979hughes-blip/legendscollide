using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using System.Net;
using MatchSimulator.Function.Services;

namespace MatchSimulator.Function.Functions;

public class GetTeam
{
    private readonly TeamDataLoader _dataLoader;

    public GetTeam(TeamDataLoader dataLoader)
    {
        _dataLoader = dataLoader;
    }

    [Function("GetTeam")]
    public HttpResponseData Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "teams/{id}")] HttpRequestData req,
        string id)
    {
        var team = _dataLoader.GetTeamById(id);

        if (team == null)
        {
            var errorResponse = req.CreateResponse(HttpStatusCode.NotFound);
            errorResponse.Headers.Add("Content-Type", "application/json; charset=utf-8");
            errorResponse.WriteString("{\"error\":\"Team not found\"}");
            return errorResponse;
        }

        var response = req.CreateResponse(HttpStatusCode.OK);
        response.Headers.Add("Content-Type", "application/json; charset=utf-8");
        response.WriteAsJsonAsync(team);

        return response;
    }
}
