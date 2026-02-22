using mouse_vibe_server.Models.Abac.Dto;

namespace mouse_vibe_server.Services.Abac;

public interface IAuthorizationDecisionService
{
    /// <summary>
    /// Evaluate ABAC policies for the given subject / action / resource / environment context
    /// and return a decision (allow/deny) with audit.
    /// </summary>
    Task<AuthorizationDecision> EvaluateAsync(
        string userId,
        string action,
        string resourceType,
        string? resourceId = null,
        string? ipAddress = null,
        CancellationToken ct = default);
}
