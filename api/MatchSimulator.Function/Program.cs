using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using MatchSimulator.Function.Services;

var host = new HostBuilder()
    .ConfigureFunctionsWorkerDefaults()
    .ConfigureServices(services =>
    {
        services.AddSingleton<TeamDataLoader>();
        services.AddSingleton<SimulationEngine>();
        services.AddSingleton<CommentaryGenerator>();
    })
    .Build();

host.Run();
