namespace mouse_vibe_server.Models.Abac;

/// <summary>
/// Records every ABAC authorization decision for audit / compliance.
/// </summary>
public sealed class DecisionAuditLog
{
    public Guid Id { get; set; }

    /// <summary>Email of the requesting user.</summary>
    public required string UserId { get; set; }

    /// <summary>Action attempted, e.g. "read".</summary>
    public required string Action { get; set; }

    /// <summary>Resource type, e.g. "WeatherForecast".</summary>
    public required string ResourceType { get; set; }

    /// <summary>Optional resource identifier.</summary>
    public string? ResourceId { get; set; }

    /// <summary>Final decision.</summary>
    public DecisionResult Result { get; set; }

    /// <summary>ID of the policy that determined the outcome (if any).</summary>
    public Guid? MatchedPolicyId { get; set; }

    /// <summary>Human-readable reason / explanation.</summary>
    public string? Reason { get; set; }

    /// <summary>Snapshot of subject attributes at decision time (JSON).</summary>
    public string? SubjectAttributesSnapshot { get; set; }

    /// <summary>Client IP at request time.</summary>
    public string? IpAddress { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
