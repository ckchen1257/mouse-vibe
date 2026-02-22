namespace mouse_vibe_server.Models.Abac;

/// <summary>
/// Stores ABAC-relevant attributes for a user, keyed by email address.
/// </summary>
public sealed class UserAttribute
{
    public Guid Id { get; set; }

    /// <summary>User email – the primary user identifier.</summary>
    public required string UserId { get; set; }

    /// <summary>Display name (synced from Firebase or manually set).</summary>
    public string? DisplayName { get; set; }

    /// <summary>Comma-separated roles, e.g. "admin,viewer".</summary>
    public string? Roles { get; set; }

    /// <summary>Whether this user is an ABAC admin (can manage policies/attributes).</summary>
    public bool IsAdmin { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
