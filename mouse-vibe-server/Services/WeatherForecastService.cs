using mouse_vibe_server.Models;

namespace mouse_vibe_server.Services;

public sealed class WeatherForecastService : IWeatherForecastService
{
    private static readonly string[] Summaries =
    [
        "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
    ];

    public IReadOnlyCollection<WeatherForecast> GetForecasts(int days = 5)
    {
        if (days <= 0)
        {
            return [];
        }

        var forecasts = Enumerable.Range(1, days)
            .Select(index => new WeatherForecast(
                DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                Random.Shared.Next(-20, 55),
                Summaries[Random.Shared.Next(Summaries.Length)]))
            .ToArray();

        return forecasts;
    }
}
