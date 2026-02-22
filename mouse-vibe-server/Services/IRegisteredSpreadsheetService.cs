using mouse_vibe_server.Models.Dto;

namespace mouse_vibe_server.Services;

public interface IRegisteredSpreadsheetService
{
    Task<IReadOnlyList<RegisteredSpreadsheetDto>> GetAllAsync(CancellationToken ct = default);
    Task<RegisteredSpreadsheetDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<RegisteredSpreadsheetDto> CreateAsync(CreateRegisteredSpreadsheetRequest req, string createdBy, CancellationToken ct = default);
    Task<RegisteredSpreadsheetDto?> UpdateAsync(Guid id, UpdateRegisteredSpreadsheetRequest req, CancellationToken ct = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct = default);
}
