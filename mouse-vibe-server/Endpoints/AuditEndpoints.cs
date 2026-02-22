using mouse_vibe_server.Authorization;
using mouse_vibe_server.Services.Abac;

namespace mouse_vibe_server.Endpoints;

public static class AuditEndpoints
{
    public static IEndpointRouteBuilder MapAuditEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/abac/audit")
            .RequireAuthorization(AbacConstants.AdminOnly)
            .WithTags("ABAC Audit");

        group.MapGet("/", async (
            string? userId,
            string? resourceType,
            string? result,
            int? page,
            int? pageSize,
            IAuditService svc,
            CancellationToken ct) =>
        {
            var p = Math.Max(page ?? 1, 1);
            var ps = Math.Clamp(pageSize ?? 50, 1, 200);

            var items = await svc.QueryAsync(userId, resourceType, result, p, ps, ct);
            var total = await svc.CountAsync(userId, resourceType, result, ct);

            return Results.Ok(new { items, total, page = p, pageSize = ps });
        });

        return endpoints;
    }
}
