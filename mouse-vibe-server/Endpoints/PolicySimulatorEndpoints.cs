using mouse_vibe_server.Authorization;
using mouse_vibe_server.Models.Abac.Dto;
using mouse_vibe_server.Services.Abac;

namespace mouse_vibe_server.Endpoints;

public static class PolicySimulatorEndpoints
{
    public static IEndpointRouteBuilder MapPolicySimulatorEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/abac/simulate", async (SimulateRequest req, IPolicySimulatorService svc, CancellationToken ct) =>
            Results.Ok(await svc.SimulateAsync(req, ct)))
            .RequireAuthorization(AbacConstants.AdminOnly)
            .WithTags("ABAC Simulator");

        return endpoints;
    }
}
