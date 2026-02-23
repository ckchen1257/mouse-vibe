namespace mouse_vibe_server.Models;

public enum WebhookEventStatus
{
    Pending,
    Delivered,
    Failed,
    Exhausted
}

public sealed class WebhookEvent
{
    public Guid Id { get; set; }

    public Guid WebhookSubscriptionId { get; set; }
    public WebhookSubscription? WebhookSubscription { get; set; }

    /// <summary>Event type, e.g. "row.created".</summary>
    public required string EventType { get; set; }

    /// <summary>Full JSON payload.</summary>
    public required string Payload { get; set; }

    public WebhookEventStatus Status { get; set; } = WebhookEventStatus.Pending;

    public int? HttpStatusCode { get; set; }

    /// <summary>Truncated response body from the last attempt.</summary>
    public string? ResponseBody { get; set; }

    public int RetryCount { get; set; }
    public int MaxRetries { get; set; } = 5;

    public DateTime? NextRetryAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeliveredAt { get; set; }
    public DateTime? LastAttemptAt { get; set; }
}
