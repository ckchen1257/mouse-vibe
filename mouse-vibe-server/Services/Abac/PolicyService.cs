using Microsoft.EntityFrameworkCore;
using mouse_vibe_server.Data;
using mouse_vibe_server.Models.Abac;
using mouse_vibe_server.Models.Abac.Dto;

namespace mouse_vibe_server.Services.Abac;

public sealed class PolicyService(AbacDbContext db) : IPolicyService
{
    public async Task<IReadOnlyList<PolicyDto>> GetAllAsync(CancellationToken ct = default)
    {
        return await db.Policies
            .OrderByDescending(p => p.Priority)
            .ThenBy(p => p.Name)
            .Select(p => ToDto(p))
            .ToListAsync(ct);
    }

    public async Task<PolicyDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var p = await db.Policies.FindAsync([id], ct);
        return p is null ? null : ToDto(p);
    }

    public async Task<PolicyDto> CreateAsync(CreatePolicyRequest req, string? createdBy, CancellationToken ct = default)
    {
        var policy = new AbacPolicy
        {
            Name = req.Name,
            Description = req.Description,
            Effect = Enum.Parse<PolicyEffect>(req.Effect, ignoreCase: true),
            Status = PolicyStatus.Active,
            Priority = req.Priority,
            SubjectRoles = req.SubjectRoles,
            SubjectTeams = req.SubjectTeams,
            ResourceType = req.ResourceType,
            ResourceId = req.ResourceId,
            Action = req.Action,
            CreatedBy = createdBy
        };

        db.Policies.Add(policy);
        await db.SaveChangesAsync(ct);
        return ToDto(policy);
    }

    public async Task<PolicyDto?> UpdateAsync(Guid id, UpdatePolicyRequest req, CancellationToken ct = default)
    {
        var policy = await db.Policies.FindAsync([id], ct);
        if (policy is null) return null;

        policy.Name = req.Name;
        policy.Description = req.Description;
        policy.Effect = Enum.Parse<PolicyEffect>(req.Effect, ignoreCase: true);
        policy.Status = Enum.Parse<PolicyStatus>(req.Status, ignoreCase: true);
        policy.Priority = req.Priority;
        policy.SubjectRoles = req.SubjectRoles;
        policy.SubjectTeams = req.SubjectTeams;
        policy.ResourceType = req.ResourceType;
        policy.ResourceId = req.ResourceId;
        policy.Action = req.Action;
        policy.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return ToDto(policy);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var policy = await db.Policies.FindAsync([id], ct);
        if (policy is null) return false;

        db.Policies.Remove(policy);
        await db.SaveChangesAsync(ct);
        return true;
    }

    private static PolicyDto ToDto(AbacPolicy p) => new(
        p.Id, p.Name, p.Description,
        p.Effect.ToString(), p.Status.ToString(), p.Priority,
        p.SubjectRoles, p.SubjectTeams,
        p.ResourceType, p.ResourceId, p.Action,
        p.CreatedAt, p.UpdatedAt, p.CreatedBy
    );
}
