namespace mouse_vibe_server.Models;

public sealed class WebhookSubscription
{
    public Guid Id { get; set; }

    /// <summary>Target URL to POST webhook events to.</summary>
    public required string Url { get; set; }

    /// <summary>HMAC-SHA256 secret for signing payloads.</summary>
    public required string Secret { get; set; }

    /// <summary>Optional description.</summary>
    public string? Description { get; set; }

    /// <summary>Comma-separated event types, e.g. "row.created,row.updated,row.deleted".</summary>
    public required string Events { get; set; }

    public bool IsActive { get; set; } = true;

    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
