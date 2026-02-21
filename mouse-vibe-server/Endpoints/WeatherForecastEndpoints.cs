using mouse_vibe_server.Services;

namespace mouse_vibe_server.Endpoints;

public static class WeatherForecastEndpoints
{
    public static IEndpointRouteBuilder MapWeatherForecastEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/weatherforecast", (IWeatherForecastService weatherForecastService) =>
        {
            return weatherForecastService.GetForecasts();
        })
        .WithName("GetWeatherForecast");

        return endpoints;
    }
}
