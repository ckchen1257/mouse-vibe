using mouse_vibe_server.Authorization;
using mouse_vibe_server.Models.Abac.Dto;
using mouse_vibe_server.Services.Abac;

namespace mouse_vibe_server.Endpoints;

public static class ResourceTypeEndpoints
{
    public static IEndpointRouteBuilder MapResourceTypeEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/abac/resource-types")
            .RequireAuthorization(AbacConstants.AdminOnly)
            .WithTags("ABAC Resource Types");

        group.MapGet("/", async (IResourceTypeService svc, CancellationToken ct) =>
            Results.Ok(await svc.GetAllAsync(ct)));

        group.MapGet("/{id:guid}", async (Guid id, IResourceTypeService svc, CancellationToken ct) =>
        {
            var dto = await svc.GetByIdAsync(id, ct);
            return dto is not null ? Results.Ok(dto) : Results.NotFound();
        });

        group.MapPost("/", async (CreateResourceTypeRequest req, IResourceTypeService svc, CancellationToken ct) =>
        {
            var dto = await svc.CreateAsync(req, ct);
            return Results.Created($"/abac/resource-types/{dto.Id}", dto);
        });

        group.MapDelete("/{id:guid}", async (Guid id, IResourceTypeService svc, CancellationToken ct) =>
        {
            var deleted = await svc.DeleteAsync(id, ct);
            return deleted ? Results.NoContent() : Results.NotFound();
        });

        return endpoints;
    }
}
