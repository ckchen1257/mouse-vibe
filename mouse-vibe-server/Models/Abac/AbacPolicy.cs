namespace mouse_vibe_server.Models.Abac;

/// <summary>
/// An ABAC policy rule that maps a set of attribute conditions to an allow/deny decision.
/// </summary>
public sealed class AbacPolicy
{
    public Guid Id { get; set; }

    /// <summary>Human-readable name, e.g. "Allow managers to read forecasts".</summary>
    public required string Name { get; set; }

    /// <summary>Optional description.</summary>
    public string? Description { get; set; }

    /// <summary>Allow or Deny.</summary>
    public PolicyEffect Effect { get; set; } = PolicyEffect.Allow;

    /// <summary>Current status – inactive policies are skipped during evaluation.</summary>
    public PolicyStatus Status { get; set; } = PolicyStatus.Active;

    /// <summary>Higher priority wins when multiple policies match (higher = stronger).</summary>
    public int Priority { get; set; }

    // ── Subject conditions ──────────────────────────────────────────
    /// <summary>Comma-separated required roles, e.g. "admin,editor". Null = any role.</summary>
    public string? SubjectRoles { get; set; }

    /// <summary>Comma-separated required team names. Null = any team.</summary>
    public string? SubjectTeams { get; set; }

    // ── Resource conditions ─────────────────────────────────────────
    /// <summary>Resource type the policy applies to, e.g. "WeatherForecast". Null = any.</summary>
    public string? ResourceType { get; set; }

    /// <summary>Specific resource id. Null = any.</summary>
    public string? ResourceId { get; set; }

    // ── Action condition ────────────────────────────────────────────
    /// <summary>Single action: Read, Write, or Delete. Null = any action.</summary>
    public string? Action { get; set; }

    // ── Metadata ────────────────────────────────────────────────────
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
}
