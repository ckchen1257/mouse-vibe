using System.Security.Claims;
using mouse_vibe_server.Authorization;
using mouse_vibe_server.Models.Abac.Dto;
using mouse_vibe_server.Services.Abac;

namespace mouse_vibe_server.Endpoints;

public static class PolicyEndpoints
{
    public static IEndpointRouteBuilder MapPolicyEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/abac/policies")
            .RequireAuthorization(AbacConstants.AdminOnly)
            .WithTags("ABAC Policies");

        group.MapGet("/", async (IPolicyService svc, CancellationToken ct) =>
            Results.Ok(await svc.GetAllAsync(ct)));

        group.MapGet("/{id:guid}", async (Guid id, IPolicyService svc, CancellationToken ct) =>
        {
            var dto = await svc.GetByIdAsync(id, ct);
            return dto is not null ? Results.Ok(dto) : Results.NotFound();
        });

        group.MapPost("/", async (CreatePolicyRequest req, IPolicyService svc, HttpContext ctx, CancellationToken ct) =>
        {
            var userId = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var dto = await svc.CreateAsync(req, userId, ct);
            return Results.Created($"/abac/policies/{dto.Id}", dto);
        });

        group.MapPut("/{id:guid}", async (Guid id, UpdatePolicyRequest req, IPolicyService svc, CancellationToken ct) =>
        {
            var dto = await svc.UpdateAsync(id, req, ct);
            return dto is not null ? Results.Ok(dto) : Results.NotFound();
        });

        group.MapDelete("/{id:guid}", async (Guid id, IPolicyService svc, CancellationToken ct) =>
        {
            var deleted = await svc.DeleteAsync(id, ct);
            return deleted ? Results.NoContent() : Results.NotFound();
        });

        return endpoints;
    }
}
