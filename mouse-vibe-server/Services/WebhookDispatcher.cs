using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using mouse_vibe_server.Data;
using mouse_vibe_server.Models;

namespace mouse_vibe_server.Services;

public sealed class WebhookDispatcher(AbacDbContext db) : IWebhookDispatcher
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public async Task DispatchAsync(string eventType, object payload, CancellationToken ct = default)
    {
        var subscriptions = await db.WebhookSubscriptions
            .Where(w => w.IsActive)
            .ToListAsync(ct);

        var payloadJson = JsonSerializer.Serialize(payload, JsonOptions);
        var now = DateTime.UtcNow;

        foreach (var sub in subscriptions)
        {
            var events = sub.Events.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (!events.Contains(eventType, StringComparer.OrdinalIgnoreCase))
                continue;

            db.WebhookEvents.Add(new WebhookEvent
            {
                WebhookSubscriptionId = sub.Id,
                EventType = eventType,
                Payload = payloadJson,
                Status = WebhookEventStatus.Pending,
                NextRetryAt = now,
                CreatedAt = now
            });
        }

        await db.SaveChangesAsync(ct);
    }
}
