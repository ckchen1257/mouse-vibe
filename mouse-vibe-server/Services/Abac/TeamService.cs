using Microsoft.EntityFrameworkCore;
using mouse_vibe_server.Data;
using mouse_vibe_server.Models.Abac;
using mouse_vibe_server.Models.Abac.Dto;

namespace mouse_vibe_server.Services.Abac;

public sealed class TeamService(AbacDbContext db) : ITeamService
{
    // ── CRUD ────────────────────────────────────────────────────

    public async Task<IReadOnlyList<TeamDto>> GetAllAsync(CancellationToken ct = default)
    {
        var teams = await db.Teams
            .Include(t => t.Members).ThenInclude(m => m.MemberTeam)
            .OrderBy(t => t.Name)
            .ToListAsync(ct);

        // Pre-load user display names for user members
        var userIds = teams.SelectMany(t => t.Members)
            .Where(m => m.MemberType == TeamMemberType.User && m.MemberUserId != null)
            .Select(m => m.MemberUserId!)
            .Distinct()
            .ToList();

        var userNames = userIds.Count > 0
            ? await db.UserAttributes.AsNoTracking()
                .Where(u => userIds.Contains(u.UserId))
                .ToDictionaryAsync(u => u.UserId, u => u.DisplayName, ct)
            : new Dictionary<string, string?>();

        return teams.Select(t => ToDto(t, userNames)).ToList();
    }

    public async Task<TeamDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var team = await db.Teams
            .Include(t => t.Members).ThenInclude(m => m.MemberTeam)
            .FirstOrDefaultAsync(t => t.Id == id, ct);

        if (team is null) return null;

        var userNames = await GetUserDisplayNamesAsync(team.Members, ct);
        return ToDto(team, userNames);
    }

    public async Task<TeamDto> CreateAsync(CreateTeamRequest req, CancellationToken ct = default)
    {
        var team = new Team { Name = req.Name };
        db.Teams.Add(team);
        await db.SaveChangesAsync(ct);
        return ToDto(team, new Dictionary<string, string?>());
    }

    public async Task<TeamDto?> UpdateAsync(Guid id, UpdateTeamRequest req, CancellationToken ct = default)
    {
        var team = await db.Teams
            .Include(t => t.Members).ThenInclude(m => m.MemberTeam)
            .FirstOrDefaultAsync(t => t.Id == id, ct);

        if (team is null) return null;

        team.Name = req.Name;
        team.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        var userNames = await GetUserDisplayNamesAsync(team.Members, ct);
        return ToDto(team, userNames);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var team = await db.Teams.FindAsync([id], ct);
        if (team is null) return false;

        db.Teams.Remove(team);
        await db.SaveChangesAsync(ct);
        return true;
    }

    // ── Member management ───────────────────────────────────────

    public async Task<TeamMemberDto?> AddMemberAsync(Guid teamId, AddTeamMemberRequest req, CancellationToken ct = default)
    {
        var team = await db.Teams.FindAsync([teamId], ct);
        if (team is null) return null;

        if (!Enum.TryParse<TeamMemberType>(req.MemberType, true, out var memberType))
            throw new ArgumentException($"Invalid MemberType: {req.MemberType}");

        var member = new TeamMember
        {
            TeamId = teamId,
            MemberType = memberType,
            MemberUserId = memberType == TeamMemberType.User ? req.MemberUserId : null,
            MemberTeamId = memberType == TeamMemberType.Team ? req.MemberTeamId : null,
        };

        // Cycle check for team members
        if (memberType == TeamMemberType.Team && req.MemberTeamId.HasValue)
        {
            if (req.MemberTeamId.Value == teamId)
                throw new InvalidOperationException("A team cannot be a member of itself.");

            if (await WouldCreateCycleAsync(teamId, req.MemberTeamId.Value, ct))
                throw new InvalidOperationException("Adding this team would create a circular membership.");
        }

        db.TeamMembers.Add(member);
        await db.SaveChangesAsync(ct);

        // Build display name
        string? displayName = null;
        if (memberType == TeamMemberType.User && member.MemberUserId != null)
        {
            displayName = (await db.UserAttributes.AsNoTracking()
                .FirstOrDefaultAsync(u => u.UserId == member.MemberUserId, ct))?.DisplayName;
        }
        else if (memberType == TeamMemberType.Team && member.MemberTeamId.HasValue)
        {
            displayName = (await db.Teams.AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == member.MemberTeamId, ct))?.Name;
        }

        return new TeamMemberDto(
            member.Id, member.MemberType.ToString(),
            member.MemberUserId, member.MemberTeamId,
            displayName, member.CreatedAt
        );
    }

    public async Task<bool> RemoveMemberAsync(Guid teamId, Guid memberId, CancellationToken ct = default)
    {
        var member = await db.TeamMembers
            .FirstOrDefaultAsync(m => m.Id == memberId && m.TeamId == teamId, ct);
        if (member is null) return false;

        db.TeamMembers.Remove(member);
        await db.SaveChangesAsync(ct);
        return true;
    }

    // ── Team resolution ─────────────────────────────────────────

    public async Task<HashSet<string>> ResolveUserTeamNamesAsync(string userId, CancellationToken ct = default)
    {
        // Load all teams and all team memberships
        var allTeams = await db.Teams.AsNoTracking().ToListAsync(ct);
        var allMembers = await db.TeamMembers.AsNoTracking().ToListAsync(ct);

        // Direct teams: teams where user is a member
        var directTeamIds = allMembers
            .Where(m => m.MemberType == TeamMemberType.User
                        && string.Equals(m.MemberUserId, userId, StringComparison.OrdinalIgnoreCase))
            .Select(m => m.TeamId)
            .ToHashSet();

        // Build reverse map: childTeamId → parentTeamIds
        // If TeamMember has TeamId=A, MemberType=Team, MemberTeamId=B
        // then B is inside A → B's parent is A
        var childToParents = new Dictionary<Guid, List<Guid>>();
        foreach (var m in allMembers.Where(m => m.MemberType == TeamMemberType.Team && m.MemberTeamId.HasValue))
        {
            if (!childToParents.TryGetValue(m.MemberTeamId!.Value, out var parents))
            {
                parents = [];
                childToParents[m.MemberTeamId!.Value] = parents;
            }
            parents.Add(m.TeamId);
        }

        // BFS: expand to all ancestor teams
        var resolvedIds = new HashSet<Guid>(directTeamIds);
        var queue = new Queue<Guid>(directTeamIds);
        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            if (childToParents.TryGetValue(current, out var parents))
            {
                foreach (var parentId in parents)
                {
                    if (resolvedIds.Add(parentId))
                        queue.Enqueue(parentId);
                }
            }
        }

        // Map IDs to names
        var teamLookup = allTeams.ToDictionary(t => t.Id, t => t.Name);
        return resolvedIds
            .Where(teamLookup.ContainsKey)
            .Select(id => teamLookup[id].ToLowerInvariant())
            .ToHashSet();
    }

    // ── Helpers ──────────────────────────────────────────────────

    private async Task<bool> WouldCreateCycleAsync(Guid teamId, Guid candidateChildTeamId, CancellationToken ct)
    {
        // Check if teamId is reachable from candidateChildTeamId via team memberships
        // i.e., if candidateChildTeamId already contains teamId (directly or transitively)
        var allMembers = await db.TeamMembers.AsNoTracking()
            .Where(m => m.MemberType == TeamMemberType.Team)
            .ToListAsync(ct);

        // Build parent→children map: TeamId has MemberTeamId as child
        var parentToChildren = new Dictionary<Guid, List<Guid>>();
        foreach (var m in allMembers.Where(m => m.MemberTeamId.HasValue))
        {
            if (!parentToChildren.TryGetValue(m.TeamId, out var children))
            {
                children = [];
                parentToChildren[m.TeamId] = children;
            }
            children.Add(m.MemberTeamId!.Value);
        }

        // BFS from candidateChildTeamId: can we reach teamId?
        var visited = new HashSet<Guid> { candidateChildTeamId };
        var q = new Queue<Guid>();
        q.Enqueue(candidateChildTeamId);
        while (q.Count > 0)
        {
            var current = q.Dequeue();
            if (parentToChildren.TryGetValue(current, out var children))
            {
                foreach (var child in children)
                {
                    if (child == teamId) return true;
                    if (visited.Add(child))
                        q.Enqueue(child);
                }
            }
        }

        return false;
    }

    private async Task<Dictionary<string, string?>> GetUserDisplayNamesAsync(
        IEnumerable<TeamMember> members, CancellationToken ct)
    {
        var userIds = members
            .Where(m => m.MemberType == TeamMemberType.User && m.MemberUserId != null)
            .Select(m => m.MemberUserId!)
            .Distinct()
            .ToList();

        if (userIds.Count == 0) return new Dictionary<string, string?>();

        return await db.UserAttributes.AsNoTracking()
            .Where(u => userIds.Contains(u.UserId))
            .ToDictionaryAsync(u => u.UserId, u => u.DisplayName, ct);
    }

    private static TeamDto ToDto(Team t, Dictionary<string, string?> userNames) => new(
        t.Id, t.Name,
        t.Members.Select(m => ToMemberDto(m, userNames)).OrderBy(m => m.MemberType).ThenBy(m => m.DisplayName).ToList(),
        t.CreatedAt, t.UpdatedAt
    );

    private static TeamMemberDto ToMemberDto(TeamMember m, Dictionary<string, string?> userNames)
    {
        var displayName = m.MemberType == TeamMemberType.User
            ? (m.MemberUserId != null && userNames.TryGetValue(m.MemberUserId, out var dn) ? dn ?? m.MemberUserId : m.MemberUserId)
            : m.MemberTeam?.Name;

        return new TeamMemberDto(
            m.Id, m.MemberType.ToString(),
            m.MemberUserId, m.MemberTeamId,
            displayName, m.CreatedAt
        );
    }
}
