using mouse_vibe_server.Models.Abac.Dto;

namespace mouse_vibe_server.Services.Abac;

public interface IResourceTypeService
{
    Task<IReadOnlyList<ResourceTypeDto>> GetAllAsync(CancellationToken ct = default);
    Task<ResourceTypeDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ResourceTypeDto> CreateAsync(CreateResourceTypeRequest request, CancellationToken ct = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct = default);
}
