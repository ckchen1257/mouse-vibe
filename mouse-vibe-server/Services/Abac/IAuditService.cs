using mouse_vibe_server.Models.Abac.Dto;

namespace mouse_vibe_server.Services.Abac;

public interface IAuditService
{
    Task<IReadOnlyList<AuditLogDto>> QueryAsync(
        string? userId = null,
        string? resourceType = null,
        string? result = null,
        int page = 1,
        int pageSize = 50,
        CancellationToken ct = default);

    Task<int> CountAsync(
        string? userId = null,
        string? resourceType = null,
        string? result = null,
        CancellationToken ct = default);
}
