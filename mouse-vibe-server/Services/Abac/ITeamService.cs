using mouse_vibe_server.Models.Abac.Dto;

namespace mouse_vibe_server.Services.Abac;

public interface ITeamService
{
    Task<IReadOnlyList<TeamDto>> GetAllAsync(CancellationToken ct = default);
    Task<TeamDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<TeamDto> CreateAsync(CreateTeamRequest request, CancellationToken ct = default);
    Task<TeamDto?> UpdateAsync(Guid id, UpdateTeamRequest request, CancellationToken ct = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct = default);

    // ── Member management ──────────────────────────────────────
    Task<TeamMemberDto?> AddMemberAsync(Guid teamId, AddTeamMemberRequest request, CancellationToken ct = default);
    Task<bool> RemoveMemberAsync(Guid teamId, Guid memberId, CancellationToken ct = default);

    // ── Team resolution for authorization ──────────────────────
    /// <summary>
    /// Resolve all team names a user belongs to (direct + inherited via team-in-team membership).
    /// </summary>
    Task<HashSet<string>> ResolveUserTeamNamesAsync(string userId, CancellationToken ct = default);
}
