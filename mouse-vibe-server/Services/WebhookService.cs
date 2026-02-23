using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using mouse_vibe_server.Data;
using mouse_vibe_server.Models;
using mouse_vibe_server.Models.Dto;

namespace mouse_vibe_server.Services;

public sealed class WebhookService(AbacDbContext db) : IWebhookService
{
    public async Task<IReadOnlyList<WebhookSubscriptionDto>> GetAllAsync(CancellationToken ct = default)
    {
        return await db.WebhookSubscriptions
            .OrderByDescending(w => w.CreatedAt)
            .Select(w => ToDto(w))
            .ToListAsync(ct);
    }

    public async Task<WebhookSubscriptionDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var w = await db.WebhookSubscriptions.FindAsync([id], ct);
        return w is null ? null : ToDto(w);
    }

    public async Task<WebhookSubscriptionDto> CreateAsync(
        CreateWebhookRequest req, string createdBy, CancellationToken ct = default)
    {
        var secret = string.IsNullOrWhiteSpace(req.Secret)
            ? Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant()
            : req.Secret;

        var entity = new WebhookSubscription
        {
            Url = req.Url,
            Secret = secret,
            Description = req.Description,
            Events = req.Events,
            CreatedBy = createdBy
        };

        db.WebhookSubscriptions.Add(entity);
        await db.SaveChangesAsync(ct);

        return ToDto(entity);
    }

    public async Task<WebhookSubscriptionDto?> UpdateAsync(
        Guid id, UpdateWebhookRequest req, CancellationToken ct = default)
    {
        var entity = await db.WebhookSubscriptions.FindAsync([id], ct);
        if (entity is null) return null;

        entity.Url = req.Url;
        entity.Description = req.Description;
        entity.Events = req.Events;
        entity.IsActive = req.IsActive;

        if (!string.IsNullOrWhiteSpace(req.Secret))
            entity.Secret = req.Secret;

        await db.SaveChangesAsync(ct);
        return ToDto(entity);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await db.WebhookSubscriptions.FindAsync([id], ct);
        if (entity is null) return false;

        db.WebhookSubscriptions.Remove(entity);
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<WebhookEventListResponse> GetEventsAsync(
        Guid subscriptionId, int page, int pageSize, CancellationToken ct = default)
    {
        var query = db.WebhookEvents
            .Where(e => e.WebhookSubscriptionId == subscriptionId)
            .OrderByDescending(e => e.CreatedAt);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new WebhookEventDto(
                e.Id,
                e.WebhookSubscriptionId,
                e.EventType,
                e.Payload,
                e.Status.ToString(),
                e.HttpStatusCode,
                e.ResponseBody,
                e.RetryCount,
                e.MaxRetries,
                e.CreatedAt,
                e.DeliveredAt,
                e.LastAttemptAt
            ))
            .ToListAsync(ct);

        return new WebhookEventListResponse(items, totalCount);
    }

    public async Task<bool> RetryEventAsync(Guid subscriptionId, Guid eventId, CancellationToken ct = default)
    {
        var ev = await db.WebhookEvents
            .FirstOrDefaultAsync(e => e.Id == eventId && e.WebhookSubscriptionId == subscriptionId, ct);

        if (ev is null) return false;
        if (ev.Status is WebhookEventStatus.Pending or WebhookEventStatus.Delivered) return false;

        ev.Status = WebhookEventStatus.Pending;
        ev.NextRetryAt = DateTime.UtcNow;
        ev.RetryCount = 0;

        await db.SaveChangesAsync(ct);
        return true;
    }

    private static WebhookSubscriptionDto ToDto(WebhookSubscription w) =>
        new(w.Id, w.Url, w.Description, w.Events, w.IsActive, w.CreatedBy, w.CreatedAt);
}
