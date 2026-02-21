using mouse_vibe_server.Models;

namespace mouse_vibe_server.Services;

public interface IWeatherForecastService
{
    IReadOnlyCollection<WeatherForecast> GetForecasts(int days = 5);
}
