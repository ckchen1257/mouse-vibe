namespace mouse_vibe_server.Models.Dto;

// ── Webhook Subscription DTOs ───────────────────────────────────────

public sealed record WebhookSubscriptionDto(
    Guid Id,
    string Url,
    string? Description,
    string Events,
    bool IsActive,
    string? CreatedBy,
    DateTime CreatedAt
);

public sealed record CreateWebhookRequest(
    string Url,
    string? Secret,
    string? Description,
    string Events
);

public sealed record UpdateWebhookRequest(
    string Url,
    string? Secret,
    string? Description,
    string Events,
    bool IsActive
);

// ── Webhook Event DTOs ──────────────────────────────────────────────

public sealed record WebhookEventDto(
    Guid Id,
    Guid WebhookSubscriptionId,
    string EventType,
    string Payload,
    string Status,
    int? HttpStatusCode,
    string? ResponseBody,
    int RetryCount,
    int MaxRetries,
    DateTime CreatedAt,
    DateTime? DeliveredAt,
    DateTime? LastAttemptAt
);

public sealed record WebhookEventListResponse(
    IReadOnlyList<WebhookEventDto> Items,
    int TotalCount
);
