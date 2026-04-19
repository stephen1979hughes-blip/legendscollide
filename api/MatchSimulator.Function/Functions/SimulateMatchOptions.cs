using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using System.Net;

namespace MatchSimulator.Function.Functions;

public class SimulateMatchOptions
{
    [Function("SimulateMatchOptions")]
    public HttpResponseData Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "options", Route = "simulate")] HttpRequestData req)
    {
        var response = req.CreateResponse(HttpStatusCode.NoContent);
        response.Headers.TryAddWithoutValidation("Access-Control-Allow-Origin", "*");
        response.Headers.TryAddWithoutValidation("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.Headers.TryAddWithoutValidation("Access-Control-Allow-Headers", "Content-Type");
        response.Headers.TryAddWithoutValidation("Access-Control-Max-Age", "3600");
        return response;
    }
}
