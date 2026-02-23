using mouse_vibe_server.Authorization;
using mouse_vibe_server.Models.Abac;
using mouse_vibe_server.Models.Dto;
using mouse_vibe_server.Services;
using mouse_vibe_server.Services.Abac;

namespace mouse_vibe_server.Endpoints;

public static class WebhookEndpoints
{
    public static IEndpointRouteBuilder MapWebhookEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/webhooks")
            .RequireAuthorization()
            .WithTags("Webhooks");

        // ── List all subscriptions ──────────────────────────────────
        group.MapGet("/", async (
            IWebhookService svc,
            IAuthorizationDecisionService abac,
            HttpContext ctx,
            CancellationToken ct) =>
        {
            var userId = ctx.User.GetEmail();
            if (userId is null) return Results.Unauthorized();

            var ip = ctx.Connection.RemoteIpAddress?.ToString();
            var decision = await abac.EvaluateAsync(userId, "read", AbacConstants.WebhookResource, ipAddress: ip, ct: ct);
            if (decision.Result == DecisionResult.Deny)
                return Results.Json(new { error = "Forbidden", reason = decision.Reason }, statusCode: 403);

            return Results.Ok(await svc.GetAllAsync(ct));
        });

        // ── Get subscription by ID ──────────────────────────────────
        group.MapGet("/{id:guid}", async (
            Guid id,
            IWebhookService svc,
            IAuthorizationDecisionService abac,
            HttpContext ctx,
            CancellationToken ct) =>
        {
            var userId = ctx.User.GetEmail();
            if (userId is null) return Results.Unauthorized();

            var ip = ctx.Connection.RemoteIpAddress?.ToString();
            var decision = await abac.EvaluateAsync(userId, "read", AbacConstants.WebhookResource,
                resourceId: id.ToString(), ipAddress: ip, ct: ct);
            if (decision.Result == DecisionResult.Deny)
                return Results.Json(new { error = "Forbidden", reason = decision.Reason }, statusCode: 403);

            var dto = await svc.GetByIdAsync(id, ct);
            return dto is not null ? Results.Ok(dto) : Results.NotFound();
        });

        // ── Create subscription ─────────────────────────────────────
        group.MapPost("/", async (
            CreateWebhookRequest req,
            IWebhookService svc,
            IAuthorizationDecisionService abac,
            HttpContext ctx,
            CancellationToken ct) =>
        {
            var userId = ctx.User.GetEmail();
            if (userId is null) return Results.Unauthorized();

            var ip = ctx.Connection.RemoteIpAddress?.ToString();
            var decision = await abac.EvaluateAsync(userId, "write", AbacConstants.WebhookResource, ipAddress: ip, ct: ct);
            if (decision.Result == DecisionResult.Deny)
                return Results.Json(new { error = "Forbidden", reason = decision.Reason }, statusCode: 403);

            var dto = await svc.CreateAsync(req, userId, ct);
            return Results.Created($"/webhooks/{dto.Id}", dto);
        });

        // ── Update subscription ─────────────────────────────────────
        group.MapPut("/{id:guid}", async (
            Guid id,
            UpdateWebhookRequest req,
            IWebhookService svc,
            IAuthorizationDecisionService abac,
            HttpContext ctx,
            CancellationToken ct) =>
        {
            var userId = ctx.User.GetEmail();
            if (userId is null) return Results.Unauthorized();

            var ip = ctx.Connection.RemoteIpAddress?.ToString();
            var decision = await abac.EvaluateAsync(userId, "write", AbacConstants.WebhookResource,
                resourceId: id.ToString(), ipAddress: ip, ct: ct);
            if (decision.Result == DecisionResult.Deny)
                return Results.Json(new { error = "Forbidden", reason = decision.Reason }, statusCode: 403);

            var dto = await svc.UpdateAsync(id, req, ct);
            return dto is not null ? Results.Ok(dto) : Results.NotFound();
        });

        // ── Delete subscription ─────────────────────────────────────
        group.MapDelete("/{id:guid}", async (
            Guid id,
            IWebhookService svc,
            IAuthorizationDecisionService abac,
            HttpContext ctx,
            CancellationToken ct) =>
        {
            var userId = ctx.User.GetEmail();
            if (userId is null) return Results.Unauthorized();

            var ip = ctx.Connection.RemoteIpAddress?.ToString();
            var decision = await abac.EvaluateAsync(userId, "delete", AbacConstants.WebhookResource,
                resourceId: id.ToString(), ipAddress: ip, ct: ct);
            if (decision.Result == DecisionResult.Deny)
                return Results.Json(new { error = "Forbidden", reason = decision.Reason }, statusCode: 403);

            var deleted = await svc.DeleteAsync(id, ct);
            return deleted ? Results.NoContent() : Results.NotFound();
        });

        // ── List events for a subscription ──────────────────────────
        group.MapGet("/{id:guid}/events", async (
            Guid id,
            int? page,
            int? pageSize,
            IWebhookService svc,
            IAuthorizationDecisionService abac,
            HttpContext ctx,
            CancellationToken ct) =>
        {
            var userId = ctx.User.GetEmail();
            if (userId is null) return Results.Unauthorized();

            var ip = ctx.Connection.RemoteIpAddress?.ToString();
            var decision = await abac.EvaluateAsync(userId, "read", AbacConstants.WebhookResource,
                resourceId: id.ToString(), ipAddress: ip, ct: ct);
            if (decision.Result == DecisionResult.Deny)
                return Results.Json(new { error = "Forbidden", reason = decision.Reason }, statusCode: 403);

            var result = await svc.GetEventsAsync(id, page ?? 1, Math.Clamp(pageSize ?? 20, 1, 100), ct);
            return Results.Ok(result);
        });

        // ── Retry a failed event ────────────────────────────────────
        group.MapPost("/{id:guid}/events/{eventId:guid}/retry", async (
            Guid id,
            Guid eventId,
            IWebhookService svc,
            IAuthorizationDecisionService abac,
            HttpContext ctx,
            CancellationToken ct) =>
        {
            var userId = ctx.User.GetEmail();
            if (userId is null) return Results.Unauthorized();

            var ip = ctx.Connection.RemoteIpAddress?.ToString();
            var decision = await abac.EvaluateAsync(userId, "write", AbacConstants.WebhookResource,
                resourceId: id.ToString(), ipAddress: ip, ct: ct);
            if (decision.Result == DecisionResult.Deny)
                return Results.Json(new { error = "Forbidden", reason = decision.Reason }, statusCode: 403);

            var retried = await svc.RetryEventAsync(id, eventId, ct);
            return retried ? Results.Ok() : Results.NotFound();
        });

        return endpoints;
    }
}
