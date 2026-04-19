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
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "teams/{id}")] HttpRequestData req,
        string id)
    {
        var team = _dataLoader.GetTeamById(id);

        if (team == null)
        {
            var errorResponse = req.CreateResponse(HttpStatusCode.NotFound);
            errorResponse.Headers.TryAddWithoutValidation("Access-Control-Allow-Origin", "*");
            errorResponse.Headers.TryAddWithoutValidation("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            errorResponse.Headers.TryAddWithoutValidation("Access-Control-Allow-Headers", "Content-Type");
            await errorResponse.WriteAsJsonAsync(new { error = "Team not found" });
            return errorResponse;
        }

        var response = req.CreateResponse(HttpStatusCode.OK);
        response.Headers.TryAddWithoutValidation("Access-Control-Allow-Origin", "*");
        response.Headers.TryAddWithoutValidation("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.Headers.TryAddWithoutValidation("Access-Control-Allow-Headers", "Content-Type");
        await response.WriteAsJsonAsync(team);
        return response;
    }
}
