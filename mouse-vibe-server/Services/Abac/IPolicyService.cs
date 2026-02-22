using mouse_vibe_server.Models.Abac;
using mouse_vibe_server.Models.Abac.Dto;

namespace mouse_vibe_server.Services.Abac;

public interface IPolicyService
{
    Task<IReadOnlyList<PolicyDto>> GetAllAsync(CancellationToken ct = default);
    Task<PolicyDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<PolicyDto> CreateAsync(CreatePolicyRequest request, string? createdBy, CancellationToken ct = default);
    Task<PolicyDto?> UpdateAsync(Guid id, UpdatePolicyRequest request, CancellationToken ct = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct = default);
}
