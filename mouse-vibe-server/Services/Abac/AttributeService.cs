using Microsoft.EntityFrameworkCore;
using mouse_vibe_server.Data;
using mouse_vibe_server.Models.Abac;
using mouse_vibe_server.Models.Abac.Dto;

namespace mouse_vibe_server.Services.Abac;

public sealed class AttributeService(AbacDbContext db) : IAttributeService
{
    public async Task<IReadOnlyList<UserAttributeDto>> GetAllAsync(CancellationToken ct = default)
    {
        return await db.UserAttributes
            .OrderBy(u => u.UserId)
            .Select(u => ToDto(u))
            .ToListAsync(ct);
    }

    public async Task<UserAttributeDto?> GetByUserIdAsync(string userId, CancellationToken ct = default)
    {
        var u = await db.UserAttributes.FirstOrDefaultAsync(x => x.UserId == userId, ct);
        return u is null ? null : ToDto(u);
    }

    public async Task<UserAttributeDto> UpsertAsync(UpsertUserAttributeRequest req, CancellationToken ct = default)
    {
        var existing = await db.UserAttributes.FirstOrDefaultAsync(x => x.UserId == req.UserId, ct);

        if (existing is not null)
        {
            existing.DisplayName = req.DisplayName;
            existing.Roles = req.Roles;
            existing.IsAdmin = req.IsAdmin;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            existing = new UserAttribute
            {
                UserId = req.UserId,
                DisplayName = req.DisplayName,
                Roles = req.Roles,
                IsAdmin = req.IsAdmin
            };
            db.UserAttributes.Add(existing);
        }

        await db.SaveChangesAsync(ct);
        return ToDto(existing);
    }

    public async Task<bool> DeleteAsync(string userId, CancellationToken ct = default)
    {
        var u = await db.UserAttributes.FirstOrDefaultAsync(x => x.UserId == userId, ct);
        if (u is null) return false;

        db.UserAttributes.Remove(u);
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task SyncDisplayNameAsync(string userId, string? displayName, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(displayName)) return;

        var existing = await db.UserAttributes.FirstOrDefaultAsync(x => x.UserId == userId, ct);
        if (existing is null) return;

        if (existing.DisplayName != displayName)
        {
            existing.DisplayName = displayName;
            existing.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
        }
    }

    private static UserAttributeDto ToDto(UserAttribute u) => new(
        u.Id, u.UserId, u.DisplayName,
        u.Roles, u.IsAdmin,
        u.CreatedAt, u.UpdatedAt
    );
}
