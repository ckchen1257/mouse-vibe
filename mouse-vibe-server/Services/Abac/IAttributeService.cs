using mouse_vibe_server.Models.Abac.Dto;

namespace mouse_vibe_server.Services.Abac;

public interface IAttributeService
{
    Task<IReadOnlyList<UserAttributeDto>> GetAllAsync(CancellationToken ct = default);
    Task<UserAttributeDto?> GetByUserIdAsync(string userId, CancellationToken ct = default);
    Task<UserAttributeDto> UpsertAsync(UpsertUserAttributeRequest request, CancellationToken ct = default);
    Task<bool> DeleteAsync(string userId, CancellationToken ct = default);
    Task SyncDisplayNameAsync(string userId, string? displayName, CancellationToken ct = default);
}
