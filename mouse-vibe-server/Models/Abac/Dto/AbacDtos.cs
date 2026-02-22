namespace mouse_vibe_server.Models.Abac.Dto;

// ── Policy DTOs ─────────────────────────────────────────────────────

public sealed record PolicyDto(
    Guid Id,
    string Name,
    string? Description,
    string Effect,
    string Status,
    int Priority,
    string? SubjectRoles,
    string? SubjectTeams,
    string? ResourceType,
    string? ResourceId,
    string? Action,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string? CreatedBy
);

public sealed record CreatePolicyRequest(
    string Name,
    string? Description,
    string Effect,
    int Priority,
    string? SubjectRoles,
    string? SubjectTeams,
    string? ResourceType,
    string? ResourceId,
    string? Action
);

public sealed record UpdatePolicyRequest(
    string Name,
    string? Description,
    string Effect,
    string Status,
    int Priority,
    string? SubjectRoles,
    string? SubjectTeams,
    string? ResourceType,
    string? ResourceId,
    string? Action
);

// ── User Attribute DTOs ─────────────────────────────────────────────

public sealed record UserAttributeDto(
    Guid Id,
    string UserId,
    string? DisplayName,
    string? Roles,
    bool IsAdmin,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed record UpsertUserAttributeRequest(
    string UserId,
    string? DisplayName,
    string? Roles,
    bool IsAdmin
);

// ── Team DTOs ───────────────────────────────────────────────────────

public sealed record TeamDto(
    Guid Id,
    string Name,
    IReadOnlyList<TeamMemberDto> Members,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed record TeamMemberDto(
    Guid Id,
    string MemberType,
    string? MemberUserId,
    Guid? MemberTeamId,
    string? DisplayName,
    DateTime CreatedAt
);

public sealed record CreateTeamRequest(
    string Name
);

public sealed record UpdateTeamRequest(
    string Name
);

public sealed record AddTeamMemberRequest(
    string MemberType,
    string? MemberUserId,
    Guid? MemberTeamId
);

// ── Resource Type DTOs ──────────────────────────────────────────────

public sealed record ResourceTypeDto(
    Guid Id,
    string Name,
    string? Description,
    DateTime CreatedAt
);

public sealed record CreateResourceTypeRequest(
    string Name,
    string? Description
);

// ── Audit DTOs ──────────────────────────────────────────────────────

public sealed record AuditLogDto(
    Guid Id,
    string UserId,
    string Action,
    string ResourceType,
    string? ResourceId,
    string Result,
    Guid? MatchedPolicyId,
    string? Reason,
    string? SubjectAttributesSnapshot,
    string? IpAddress,
    DateTime CreatedAt
);

// ── Policy Simulator DTOs ───────────────────────────────────────────

public sealed record SimulateRequest(
    string UserId,
    string Action,
    string ResourceType,
    string? ResourceId,
    DateTime? UtcNow
);

public sealed record SimulateResponse(
    string Result,
    Guid? MatchedPolicyId,
    string? MatchedPolicyName,
    string Reason,
    IReadOnlyCollection<PolicyEvaluationDetail> EvaluatedPolicies
);

public sealed record PolicyEvaluationDetail(
    Guid PolicyId,
    string PolicyName,
    string Effect,
    bool Matched,
    string? SkipReason
);

// ── Authorization Decision ──────────────────────────────────────────

public sealed record AuthorizationDecision(
    DecisionResult Result,
    Guid? MatchedPolicyId,
    string Reason
);

// ── Me / Profile ────────────────────────────────────────────────────

public sealed record MeResponse(
    string UserId,
    string? DisplayName,
    bool IsAdmin
);
