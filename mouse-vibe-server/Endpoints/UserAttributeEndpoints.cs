using mouse_vibe_server.Authorization;
using mouse_vibe_server.Models.Abac.Dto;
using mouse_vibe_server.Services.Abac;

namespace mouse_vibe_server.Endpoints;

public static class UserAttributeEndpoints
{
    public static IEndpointRouteBuilder MapUserAttributeEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/abac/users")
            .RequireAuthorization(AbacConstants.AdminOnly)
            .WithTags("ABAC User Attributes");

        group.MapGet("/", async (IAttributeService svc, CancellationToken ct) =>
            Results.Ok(await svc.GetAllAsync(ct)));

        group.MapGet("/{userId}", async (string userId, IAttributeService svc, CancellationToken ct) =>
        {
            var dto = await svc.GetByUserIdAsync(userId, ct);
            return dto is not null ? Results.Ok(dto) : Results.NotFound();
        });

        group.MapPut("/", async (UpsertUserAttributeRequest req, IAttributeService svc, CancellationToken ct) =>
        {
            var dto = await svc.UpsertAsync(req, ct);
            return Results.Ok(dto);
        });

        group.MapDelete("/{userId}", async (string userId, IAttributeService svc, CancellationToken ct) =>
        {
            var deleted = await svc.DeleteAsync(userId, ct);
            return deleted ? Results.NoContent() : Results.NotFound();
        });

        return endpoints;
    }
}
