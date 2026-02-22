using Microsoft.AspNetCore.Authorization;
using mouse_vibe_server.Data;
using Microsoft.EntityFrameworkCore;

namespace mouse_vibe_server.Authorization;

public sealed class AdminRequirement : IAuthorizationRequirement;

public sealed class AdminRequirementHandler(AbacDbContext db) : AuthorizationHandler<AdminRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        AdminRequirement requirement)
    {
        // 1. Check Firebase custom claim first (fastest path)
        var adminClaim = context.User.FindFirst("admin");
        if (adminClaim is not null && adminClaim.Value == "true")
        {
            context.Succeed(requirement);
            return;
        }

        // 2. Fall back to DB-based admin flag
        var email = context.User.GetEmail();
        if (email is null) return;

        var attrs = await db.UserAttributes.AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == email);

        if (attrs is { IsAdmin: true })
        {
            context.Succeed(requirement);
        }
    }
}
