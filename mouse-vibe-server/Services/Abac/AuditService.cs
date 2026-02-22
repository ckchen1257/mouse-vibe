using Microsoft.EntityFrameworkCore;
using mouse_vibe_server.Data;
using mouse_vibe_server.Models.Abac;
using mouse_vibe_server.Models.Abac.Dto;

namespace mouse_vibe_server.Services.Abac;

public sealed class AuditService(AbacDbContext db) : IAuditService
{
    public async Task<IReadOnlyList<AuditLogDto>> QueryAsync(
        string? userId = null,
        string? resourceType = null,
        string? result = null,
        int page = 1,
        int pageSize = 50,
        CancellationToken ct = default)
    {
        var query = BuildQuery(userId, resourceType, result);

        return await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => ToDto(a))
            .ToListAsync(ct);
    }

    public async Task<int> CountAsync(
        string? userId = null,
        string? resourceType = null,
        string? result = null,
        CancellationToken ct = default)
    {
        return await BuildQuery(userId, resourceType, result).CountAsync(ct);
    }

    private IQueryable<DecisionAuditLog> BuildQuery(string? userId, string? resourceType, string? result)
    {
        IQueryable<DecisionAuditLog> query = db.AuditLogs.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(userId))
            query = query.Where(a => a.UserId == userId);

        if (!string.IsNullOrWhiteSpace(resourceType))
            query = query.Where(a => a.ResourceType == resourceType);

        if (!string.IsNullOrWhiteSpace(result) && Enum.TryParse<DecisionResult>(result, true, out var dr))
            query = query.Where(a => a.Result == dr);

        return query;
    }

    private static AuditLogDto ToDto(DecisionAuditLog a) => new(
        a.Id, a.UserId, a.Action, a.ResourceType, a.ResourceId,
        a.Result.ToString(), a.MatchedPolicyId, a.Reason,
        a.SubjectAttributesSnapshot, a.IpAddress, a.CreatedAt
    );
}
