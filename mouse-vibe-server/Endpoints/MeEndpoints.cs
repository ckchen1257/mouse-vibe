using System.Security.Claims;
using mouse_vibe_server.Authorization;
using mouse_vibe_server.Models.Abac.Dto;
using mouse_vibe_server.Services.Abac;

namespace mouse_vibe_server.Endpoints;

public static class MeEndpoints
{
    public static IEndpointRouteBuilder MapMeEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/me", async (HttpContext ctx, IAttributeService svc, CancellationToken ct) =>
        {
            var email = ctx.User.GetEmail();
            if (email is null) return Results.Unauthorized();

            var attrs = await svc.GetByUserIdAsync(email, ct);

            var response = new MeResponse(
                email,
                attrs?.DisplayName ?? ctx.User.FindFirstValue("name"),
                attrs?.IsAdmin ?? false
            );

            return Results.Ok(response);
        })
        .RequireAuthorization()
        .WithTags("Profile");

        endpoints.MapPost("/me/sync", async (HttpContext ctx, IAttributeService svc, CancellationToken ct) =>
        {
            var email = ctx.User.GetEmail();
            if (email is null) return Results.Unauthorized();

            var displayName = ctx.User.FindFirstValue("name");

            await svc.SyncDisplayNameAsync(email, displayName, ct);

            var attrs = await svc.GetByUserIdAsync(email, ct);

            var response = new MeResponse(
                email,
                attrs?.DisplayName ?? displayName,
                attrs?.IsAdmin ?? false
            );

            return Results.Ok(response);
        })
        .RequireAuthorization()
        .WithTags("Profile");

        return endpoints;
    }
}
