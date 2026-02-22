using mouse_vibe_server.Models.Abac;
using mouse_vibe_server.Models.Abac.Dto;

namespace mouse_vibe_server.Services.Abac;

/// <summary>
/// Shared, stateless ABAC policy-matching logic.
/// Used by both <see cref="AuthorizationDecisionService"/> (runtime) and
/// <see cref="PolicySimulatorService"/> (dry-run) so the two paths can never drift.
/// </summary>
public static class PolicyEvaluator
{
    /// <summary>
    /// Evaluate ordered policies and return the first-match decision.
    /// Policies must already be filtered to Active and ordered by Priority desc.
    /// </summary>
    public static AuthorizationDecision Evaluate(
        IReadOnlyList<AbacPolicy> policies,
        UserAttribute? attrs,
        HashSet<string> subjectTeams,
        string action,
        string resourceType,
        string? resourceId)
    {
        if (attrs is null)
        {
            return new AuthorizationDecision(DecisionResult.Deny, null, "No user attributes found – default deny.");
        }

        var subjectRoles = SplitCsv(attrs.Roles);

        foreach (var policy in policies)
        {
            if (!MatchesSubject(policy, subjectRoles, subjectTeams)) continue;
            if (!MatchesResource(policy, resourceType, resourceId)) continue;
            if (!MatchesAction(policy, action)) continue;

            var result = policy.Effect == PolicyEffect.Allow ? DecisionResult.Allow : DecisionResult.Deny;
            return new AuthorizationDecision(result, policy.Id,
                $"Matched policy '{policy.Name}' (priority {policy.Priority}, effect {policy.Effect}).");
        }

        return new AuthorizationDecision(DecisionResult.Deny, null, "No matching policy – default deny.");
    }

    /// <summary>
    /// Return the skip-reason for a policy, or <c>null</c> if the policy matches.
    /// Useful for simulator / debug output.
    /// </summary>
    public static string? GetSkipReason(
        AbacPolicy policy,
        HashSet<string> subjectRoles,
        HashSet<string> subjectTeams,
        string action,
        string resourceType,
        string? resourceId)
    {
        if (!string.IsNullOrWhiteSpace(policy.SubjectRoles))
        {
            var required = SplitCsv(policy.SubjectRoles);
            if (!required.Overlaps(subjectRoles))
                return $"Subject roles [{string.Join(", ", subjectRoles)}] do not match required [{policy.SubjectRoles}]";
        }

        if (!string.IsNullOrWhiteSpace(policy.SubjectTeams))
        {
            var required = SplitCsv(policy.SubjectTeams);
            if (!required.Overlaps(subjectTeams))
                return $"Subject teams [{string.Join(", ", subjectTeams)}] do not match required [{policy.SubjectTeams}]";
        }

        if (!string.IsNullOrWhiteSpace(policy.ResourceType) &&
            !string.Equals(policy.ResourceType.Trim(), resourceType, StringComparison.OrdinalIgnoreCase))
            return $"Resource type '{resourceType}' does not match '{policy.ResourceType}'";

        if (!string.IsNullOrWhiteSpace(policy.ResourceId) &&
            !string.Equals(policy.ResourceId.Trim(), resourceId, StringComparison.OrdinalIgnoreCase))
            return $"Resource id '{resourceId}' does not match '{policy.ResourceId}'";

        if (!string.IsNullOrWhiteSpace(policy.Action) &&
            !string.Equals(policy.Action.Trim(), action, StringComparison.OrdinalIgnoreCase))
            return $"Action '{action}' does not match '{policy.Action}'";

        return null;
    }

    // ── Matchers ────────────────────────────────────────────────────

    internal static bool MatchesSubject(AbacPolicy policy, HashSet<string> roles, HashSet<string> teams)
    {
        if (!string.IsNullOrWhiteSpace(policy.SubjectRoles))
        {
            var required = SplitCsv(policy.SubjectRoles);
            if (!required.Overlaps(roles)) return false;
        }

        if (!string.IsNullOrWhiteSpace(policy.SubjectTeams))
        {
            var required = SplitCsv(policy.SubjectTeams);
            if (!required.Overlaps(teams)) return false;
        }

        return true;
    }

    internal static bool MatchesResource(AbacPolicy policy, string resourceType, string? resourceId)
    {
        if (!string.IsNullOrWhiteSpace(policy.ResourceType) &&
            !string.Equals(policy.ResourceType.Trim(), resourceType, StringComparison.OrdinalIgnoreCase))
            return false;

        if (!string.IsNullOrWhiteSpace(policy.ResourceId) &&
            !string.Equals(policy.ResourceId.Trim(), resourceId, StringComparison.OrdinalIgnoreCase))
            return false;

        return true;
    }

    internal static bool MatchesAction(AbacPolicy policy, string action)
    {
        if (string.IsNullOrWhiteSpace(policy.Action)) return true;
        return string.Equals(policy.Action.Trim(), action, StringComparison.OrdinalIgnoreCase);
    }

    public static HashSet<string> SplitCsv(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return [];
        return value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(s => s.ToLowerInvariant())
            .ToHashSet();
    }
}
