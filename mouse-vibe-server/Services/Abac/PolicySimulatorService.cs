using Microsoft.EntityFrameworkCore;
using mouse_vibe_server.Data;
using mouse_vibe_server.Models.Abac;
using mouse_vibe_server.Models.Abac.Dto;

namespace mouse_vibe_server.Services.Abac;

public sealed class PolicySimulatorService(AbacDbContext db, ITeamService teamService) : IPolicySimulatorService
{
    public async Task<SimulateResponse> SimulateAsync(SimulateRequest request, CancellationToken ct = default)
    {
        var attrs = await db.UserAttributes.AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == request.UserId, ct);

        var policies = await db.Policies.AsNoTracking()
            .Where(p => p.Status == PolicyStatus.Active)
            .OrderByDescending(p => p.Priority)
            .ToListAsync(ct);

        var details = new List<PolicyEvaluationDetail>();
        AuthorizationDecision? finalDecision = null;

        var subjectRoles = PolicyEvaluator.SplitCsv(attrs?.Roles);
        var subjectTeams = await teamService.ResolveUserTeamNamesAsync(request.UserId, ct);

        foreach (var policy in policies)
        {
            var skipReason = PolicyEvaluator.GetSkipReason(policy, subjectRoles, subjectTeams,
                request.Action, request.ResourceType, request.ResourceId);

            var matched = skipReason is null;

            details.Add(new PolicyEvaluationDetail(
                policy.Id,
                policy.Name,
                policy.Effect.ToString(),
                matched,
                skipReason
            ));

            if (matched && finalDecision is null)
            {
                var result = policy.Effect == PolicyEffect.Allow ? DecisionResult.Allow : DecisionResult.Deny;
                finalDecision = new AuthorizationDecision(result, policy.Id,
                    $"Matched policy '{policy.Name}' (priority {policy.Priority}, effect {policy.Effect}).");
            }
        }

        finalDecision ??= attrs is null
            ? new AuthorizationDecision(DecisionResult.Deny, null, "No user attributes found – default deny.")
            : new AuthorizationDecision(DecisionResult.Deny, null, "No matching policy – default deny.");

        return new SimulateResponse(
            finalDecision.Result.ToString(),
            finalDecision.MatchedPolicyId,
            finalDecision.MatchedPolicyId.HasValue
                ? policies.FirstOrDefault(p => p.Id == finalDecision.MatchedPolicyId)?.Name
                : null,
            finalDecision.Reason,
            details
        );
    }
}
