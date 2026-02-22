using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using mouse_vibe_server.Data;
using mouse_vibe_server.Models.Abac;
using mouse_vibe_server.Models.Abac.Dto;

namespace mouse_vibe_server.Services.Abac;

public sealed class AuthorizationDecisionService(AbacDbContext db, ITeamService teamService) : IAuthorizationDecisionService
{
    public async Task<AuthorizationDecision> EvaluateAsync(
        string userId,
        string action,
        string resourceType,
        string? resourceId = null,
        string? ipAddress = null,
        CancellationToken ct = default)
    {
        // 1. Load subject attributes
        var attrs = await db.UserAttributes.AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == userId, ct);

        // 2. Resolve user teams from TeamMember graph
        var subjectTeams = await teamService.ResolveUserTeamNamesAsync(userId, ct);

        // 3. Load active policies ordered by priority desc
        var policies = await db.Policies.AsNoTracking()
            .Where(p => p.Status == PolicyStatus.Active)
            .OrderByDescending(p => p.Priority)
            .ToListAsync(ct);

        // 4. Evaluate – delegates to shared PolicyEvaluator
        var decision = PolicyEvaluator.Evaluate(policies, attrs, subjectTeams, action, resourceType, resourceId);

        // 5. Write audit log
        var audit = new DecisionAuditLog
        {
            UserId = userId,
            Action = action,
            ResourceType = resourceType,
            ResourceId = resourceId,
            Result = decision.Result,
            MatchedPolicyId = decision.MatchedPolicyId,
            Reason = decision.Reason,
            SubjectAttributesSnapshot = attrs is not null ? JsonSerializer.Serialize(new
            {
                attrs.UserId,
                attrs.Roles,
                Teams = string.Join(",", subjectTeams),
                attrs.IsAdmin
            }) : null,
            IpAddress = ipAddress
        };
        db.AuditLogs.Add(audit);
        await db.SaveChangesAsync(ct);

        return decision;
    }
}
