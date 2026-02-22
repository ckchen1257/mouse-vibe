using Microsoft.EntityFrameworkCore;
using mouse_vibe_server.Data;
using mouse_vibe_server.Models;
using mouse_vibe_server.Models.Dto;

namespace mouse_vibe_server.Services;

public sealed class RegisteredSpreadsheetService(AbacDbContext db) : IRegisteredSpreadsheetService
{
    public async Task<IReadOnlyList<RegisteredSpreadsheetDto>> GetAllAsync(CancellationToken ct = default)
    {
        return await db.RegisteredSpreadsheets
            .OrderBy(s => s.Name)
            .Select(s => new RegisteredSpreadsheetDto(
                s.Id, s.Name, s.GoogleSpreadsheetId, s.Description, s.CreatedBy, s.CreatedAt))
            .ToListAsync(ct);
    }

    public async Task<RegisteredSpreadsheetDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var s = await db.RegisteredSpreadsheets.FindAsync([id], ct);
        return s is null ? null : new RegisteredSpreadsheetDto(
            s.Id, s.Name, s.GoogleSpreadsheetId, s.Description, s.CreatedBy, s.CreatedAt);
    }

    public async Task<RegisteredSpreadsheetDto> CreateAsync(
        CreateRegisteredSpreadsheetRequest req, string createdBy, CancellationToken ct = default)
    {
        var entity = new RegisteredSpreadsheet
        {
            Name = req.Name,
            GoogleSpreadsheetId = req.GoogleSpreadsheetId,
            Description = req.Description,
            CreatedBy = createdBy
        };

        db.RegisteredSpreadsheets.Add(entity);
        await db.SaveChangesAsync(ct);

        return new RegisteredSpreadsheetDto(
            entity.Id, entity.Name, entity.GoogleSpreadsheetId, entity.Description, entity.CreatedBy, entity.CreatedAt);
    }

    public async Task<RegisteredSpreadsheetDto?> UpdateAsync(
        Guid id, UpdateRegisteredSpreadsheetRequest req, CancellationToken ct = default)
    {
        var entity = await db.RegisteredSpreadsheets.FindAsync([id], ct);
        if (entity is null) return null;

        entity.Name = req.Name;
        entity.Description = req.Description;
        await db.SaveChangesAsync(ct);

        return new RegisteredSpreadsheetDto(
            entity.Id, entity.Name, entity.GoogleSpreadsheetId, entity.Description, entity.CreatedBy, entity.CreatedAt);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await db.RegisteredSpreadsheets.FindAsync([id], ct);
        if (entity is null) return false;

        db.RegisteredSpreadsheets.Remove(entity);
        await db.SaveChangesAsync(ct);
        return true;
    }
}
