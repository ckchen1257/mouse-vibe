using mouse_vibe_server.Authorization;
using mouse_vibe_server.Models.Abac;
using mouse_vibe_server.Services;
using mouse_vibe_server.Services.Abac;

namespace mouse_vibe_server.Endpoints;

public static class WeatherForecastEndpoints
{
    public static IEndpointRouteBuilder MapWeatherForecastEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/weatherforecast", async (
            IWeatherForecastService weatherForecastService,
            IAuthorizationDecisionService abac,
            HttpContext ctx,
            CancellationToken ct) =>
        {
            var userId = ctx.User.GetEmail();

            if (userId is null) return Results.Unauthorized();

            var ip = ctx.Connection.RemoteIpAddress?.ToString();
            var decision = await abac.EvaluateAsync(userId, "read", AbacConstants.WeatherForecastResource, ipAddress: ip, ct: ct);

            if (decision.Result == DecisionResult.Deny)
            {
                return Results.Json(new { error = "Forbidden", reason = decision.Reason }, statusCode: 403);
            }

            return Results.Ok(weatherForecastService.GetForecasts());
        })
        .WithName("GetWeatherForecast")
        .RequireAuthorization();

        return endpoints;
    }
}
