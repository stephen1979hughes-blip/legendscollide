using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using MatchSimulator.Function.Services;
using MatchSimulator.Function.Data;
using Microsoft.EntityFrameworkCore;

// Use project directory
var dbDir = Path.Combine(AppContext.BaseDirectory, "data");
Directory.CreateDirectory(dbDir);
var dbPath = Path.Combine(dbDir, "football.db");

Console.WriteLine($"[DB] Path: {dbPath}");
Console.WriteLine($"[DB] Directory created: {Directory.Exists(dbDir)}");

var host = new HostBuilder()
    .ConfigureFunctionsWorkerDefaults()
    .ConfigureServices(services =>
    {
        services.AddDbContext<FootballDbContext>(options =>
            options.UseSqlite($"Data Source={dbPath}"));

        services.AddSingleton<TeamDataLoader>();
        services.AddSingleton<CommentaryGenerator>();
        services.AddSingleton<ClaudeAgentService>();
        services.AddSingleton<NormalizedDataLoader>();
        services.AddSingleton<SqliteDataLoader>();
        services.AddSingleton<ClassicTeamsLoader>();
    })
    .Build();

// Initialize database synchronously
try
{
    using (var scope = host.Services.CreateScope())
    {
        // Load normalized data (countries, clubs, national teams, players)
        var dataLoader = scope.ServiceProvider.GetRequiredService<NormalizedDataLoader>();
        var jsonPath = Path.Combine(AppContext.BaseDirectory, "Data", "teams-data-normalized.json");
        var initTask = dataLoader.InitializeAsync(jsonPath);
        initTask.GetAwaiter().GetResult();

        // Load classic teams and link with existing players
        var classicTeamsLoader = scope.ServiceProvider.GetRequiredService<ClassicTeamsLoader>();
        var classicTask = classicTeamsLoader.InitializeClassicTeamsAsync();
        classicTask.GetAwaiter().GetResult();
    }
    Console.WriteLine("[DB] Initialization complete!");
}
catch (Exception ex)
{
    Console.WriteLine($"[DB] Error during initialization: {ex.Message}");
    Console.WriteLine($"[DB] StackTrace: {ex.StackTrace}");
}

host.Run();
