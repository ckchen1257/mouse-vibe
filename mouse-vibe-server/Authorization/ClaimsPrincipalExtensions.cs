using System.Security.Claims;

namespace mouse_vibe_server.Authorization;

/// <summary>
/// Extension methods for extracting identity claims in a consistent way
/// across all endpoints and authorization handlers.
/// </summary>
public static class ClaimsPrincipalExtensions
{
    /// <summary>
    /// Extract the user's email from standard or custom claim types.
    /// Returns <c>null</c> when no email claim is present.
    /// </summary>
    public static string? GetEmail(this ClaimsPrincipal principal)
    {
        return principal.FindFirstValue(ClaimTypes.Email)
            ?? principal.FindFirstValue("email");
    }
}
