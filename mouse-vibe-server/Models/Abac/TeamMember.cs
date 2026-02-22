namespace mouse_vibe_server.Models.Abac;

/// <summary>
/// A member of a team. Can be either a user (by email) or another team.
/// </summary>
public sealed class TeamMember
{
    public Guid Id { get; set; }

    /// <summary>The team this member belongs to.</summary>
    public Guid TeamId { get; set; }

    /// <summary>Navigation to the owning team.</summary>
    public Team Team { get; set; } = null!;

    /// <summary>Whether this member is a User or a Team.</summary>
    public TeamMemberType MemberType { get; set; }

    /// <summary>User email – populated when MemberType == User.</summary>
    public string? MemberUserId { get; set; }

    /// <summary>Sub-team ID – populated when MemberType == Team.</summary>
    public Guid? MemberTeamId { get; set; }

    /// <summary>Navigation to the sub-team (when MemberType == Team).</summary>
    public Team? MemberTeam { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
