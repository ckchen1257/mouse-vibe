using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using mouse_vibe_server.Data;
using mouse_vibe_server.Models;

namespace mouse_vibe_server.Services;

public sealed class WebhookDeliveryBackgroundService(
    IServiceScopeFactory scopeFactory,
    IHttpClientFactory httpClientFactory,
    ILogger<WebhookDeliveryBackgroundService> logger) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(5);

    // Exponential backoff: 30s, 2min, 8min, 30min, 2hr
    private static readonly TimeSpan[] RetryDelays =
    [
        TimeSpan.FromSeconds(30),
        TimeSpan.FromMinutes(2),
        TimeSpan.FromMinutes(8),
        TimeSpan.FromMinutes(30),
        TimeSpan.FromHours(2)
    ];

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await DeliverPendingEventsAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in webhook delivery loop");
            }

            await Task.Delay(PollInterval, stoppingToken);
        }
    }

    private async Task DeliverPendingEventsAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AbacDbContext>();
        var now = DateTime.UtcNow;

        var events = await db.WebhookEvents
            .Include(e => e.WebhookSubscription)
            .Where(e => e.Status == WebhookEventStatus.Pending && e.NextRetryAt <= now)
            .OrderBy(e => e.NextRetryAt)
            .Take(50)
            .ToListAsync(ct);

        foreach (var ev in events)
        {
            if (ev.WebhookSubscription is null || !ev.WebhookSubscription.IsActive)
            {
                ev.Status = WebhookEventStatus.Exhausted;
                continue;
            }

            await DeliverSingleEventAsync(db, ev, ev.WebhookSubscription, ct);
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task DeliverSingleEventAsync(
        AbacDbContext db, WebhookEvent ev, WebhookSubscription sub, CancellationToken ct)
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var signature = ComputeSignature(ev.Payload, sub.Secret);

        using var client = httpClientFactory.CreateClient("webhook");
        using var request = new HttpRequestMessage(HttpMethod.Post, sub.Url);
        request.Content = new StringContent(ev.Payload, Encoding.UTF8, "application/json");
        request.Headers.Add("X-Webhook-Event", ev.EventType);
        request.Headers.Add("X-Webhook-Signature", $"sha256={signature}");
        request.Headers.Add("X-Webhook-Timestamp", timestamp);

        ev.LastAttemptAt = DateTime.UtcNow;

        try
        {
            using var response = await client.SendAsync(request, ct);
            ev.HttpStatusCode = (int)response.StatusCode;

            var body = await response.Content.ReadAsStringAsync(ct);
            ev.ResponseBody = body.Length > 4096 ? body[..4096] : body;

            if (response.IsSuccessStatusCode)
            {
                ev.Status = WebhookEventStatus.Delivered;
                ev.DeliveredAt = DateTime.UtcNow;
                logger.LogInformation("Webhook delivered: event {EventId} to {Url}", ev.Id, sub.Url);
            }
            else
            {
                HandleFailure(ev);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            ev.HttpStatusCode = null;
            ev.ResponseBody = ex.Message.Length > 4096 ? ex.Message[..4096] : ex.Message;
            HandleFailure(ev);
            logger.LogWarning(ex, "Webhook delivery failed: event {EventId} to {Url}", ev.Id, sub.Url);
        }
    }

    private static void HandleFailure(WebhookEvent ev)
    {
        ev.RetryCount++;

        if (ev.RetryCount >= ev.MaxRetries)
        {
            ev.Status = WebhookEventStatus.Exhausted;
        }
        else
        {
            ev.Status = WebhookEventStatus.Pending;
            var delayIndex = Math.Min(ev.RetryCount - 1, RetryDelays.Length - 1);
            ev.NextRetryAt = DateTime.UtcNow + RetryDelays[delayIndex];
        }
    }

    private static string ComputeSignature(string payload, string secret)
    {
        var keyBytes = Encoding.UTF8.GetBytes(secret);
        var payloadBytes = Encoding.UTF8.GetBytes(payload);
        var hash = HMACSHA256.HashData(keyBytes, payloadBytes);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
