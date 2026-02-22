using mouse_vibe_server.Authorization;
using mouse_vibe_server.Models.Abac.Dto;
using mouse_vibe_server.Services.Abac;

namespace mouse_vibe_server.Endpoints;

public static class TeamEndpoints
{
    public static IEndpointRouteBuilder MapTeamEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/abac/teams")
            .RequireAuthorization(AbacConstants.AdminOnly)
            .WithTags("ABAC Teams");

        group.MapGet("/", async (ITeamService svc, CancellationToken ct) =>
            Results.Ok(await svc.GetAllAsync(ct)));

        group.MapGet("/{id:guid}", async (Guid id, ITeamService svc, CancellationToken ct) =>
        {
            var dto = await svc.GetByIdAsync(id, ct);
            return dto is not null ? Results.Ok(dto) : Results.NotFound();
        });

        group.MapPost("/", async (CreateTeamRequest req, ITeamService svc, CancellationToken ct) =>
        {
            var dto = await svc.CreateAsync(req, ct);
            return Results.Created($"/abac/teams/{dto.Id}", dto);
        });

        group.MapPut("/{id:guid}", async (Guid id, UpdateTeamRequest req, ITeamService svc, CancellationToken ct) =>
        {
            var dto = await svc.UpdateAsync(id, req, ct);
            return dto is not null ? Results.Ok(dto) : Results.NotFound();
        });

        group.MapDelete("/{id:guid}", async (Guid id, ITeamService svc, CancellationToken ct) =>
        {
            var deleted = await svc.DeleteAsync(id, ct);
            return deleted ? Results.NoContent() : Results.NotFound();
        });

        // ── Member management ──────────────────────────────────

        group.MapPost("/{id:guid}/members", async (Guid id, AddTeamMemberRequest req, ITeamService svc, CancellationToken ct) =>
        {
            try
            {
                var dto = await svc.AddMemberAsync(id, req, ct);
                return dto is not null ? Results.Created($"/abac/teams/{id}/members/{dto.Id}", dto) : Results.NotFound();
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new { error = ex.Message });
            }
        });

        group.MapDelete("/{id:guid}/members/{memberId:guid}", async (Guid id, Guid memberId, ITeamService svc, CancellationToken ct) =>
        {
            var removed = await svc.RemoveMemberAsync(id, memberId, ct);
            return removed ? Results.NoContent() : Results.NotFound();
        });

        return endpoints;
    }
}
