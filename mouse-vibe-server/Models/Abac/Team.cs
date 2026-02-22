namespace mouse_vibe_server.Models.Abac;

/// <summary>
/// A team that can contain users and other teams as members.
/// </summary>
public sealed class Team
{
    public Guid Id { get; set; }

    /// <summary>Unique team name, e.g. "Engineering".</summary>
    public required string Name { get; set; }

    /// <summary>Members of this team (users and sub-teams).</summary>
    public ICollection<TeamMember> Members { get; set; } = [];

    /// <summary>TeamMember records where this team is the sub-team (reverse navigation).</summary>
    public ICollection<TeamMember> MemberOf { get; set; } = [];

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
