using Microsoft.EntityFrameworkCore;
using mouse_vibe_server.Data;
using mouse_vibe_server.Models.Abac;
using mouse_vibe_server.Models.Abac.Dto;

namespace mouse_vibe_server.Services.Abac;

public sealed class ResourceTypeService(AbacDbContext db) : IResourceTypeService
{
    public async Task<IReadOnlyList<ResourceTypeDto>> GetAllAsync(CancellationToken ct = default)
    {
        return await db.ResourceTypes
            .OrderBy(r => r.Name)
            .Select(r => new ResourceTypeDto(r.Id, r.Name, r.Description, r.CreatedAt))
            .ToListAsync(ct);
    }

    public async Task<ResourceTypeDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var r = await db.ResourceTypes.FindAsync([id], ct);
        return r is null ? null : new ResourceTypeDto(r.Id, r.Name, r.Description, r.CreatedAt);
    }

    public async Task<ResourceTypeDto> CreateAsync(CreateResourceTypeRequest req, CancellationToken ct = default)
    {
        var entity = new ResourceType
        {
            Name = req.Name,
            Description = req.Description
        };
        db.ResourceTypes.Add(entity);
        await db.SaveChangesAsync(ct);
        return new ResourceTypeDto(entity.Id, entity.Name, entity.Description, entity.CreatedAt);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await db.ResourceTypes.FindAsync([id], ct);
        if (entity is null) return false;

        db.ResourceTypes.Remove(entity);
        await db.SaveChangesAsync(ct);
        return true;
    }
}
