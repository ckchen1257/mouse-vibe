using mouse_vibe_server.Authorization;
using mouse_vibe_server.Models.Abac;
using mouse_vibe_server.Models.Dto;
using mouse_vibe_server.Services;
using mouse_vibe_server.Services.Abac;

namespace mouse_vibe_server.Endpoints;

public static class GoogleSheetsEndpoints
{
    public static IEndpointRouteBuilder MapGoogleSheetsEndpoints(this IEndpointRouteBuilder endpoints)
    {
        // ── Admin: manage registered spreadsheets ────────────────────
        var admin = endpoints.MapGroup("/spreadsheets/admin")
            .RequireAuthorization(AbacConstants.AdminOnly)
            .WithTags("Spreadsheets Admin");

        admin.MapGet("/", async (IRegisteredSpreadsheetService svc, CancellationToken ct) =>
            Results.Ok(await svc.GetAllAsync(ct)));

        admin.MapGet("/{id:guid}", async (Guid id, IRegisteredSpreadsheetService svc, CancellationToken ct) =>
        {
            var dto = await svc.GetByIdAsync(id, ct);
            return dto is not null ? Results.Ok(dto) : Results.NotFound();
        });

        admin.MapPost("/", async (
            CreateRegisteredSpreadsheetRequest req,
            IRegisteredSpreadsheetService svc,
            HttpContext ctx,
            CancellationToken ct) =>
        {
            var userId = ctx.User.GetEmail() ?? "unknown";
            var dto = await svc.CreateAsync(req, userId, ct);
            return Results.Created($"/spreadsheets/admin/{dto.Id}", dto);
        });

        admin.MapPut("/{id:guid}", async (
            Guid id,
            UpdateRegisteredSpreadsheetRequest req,
            IRegisteredSpreadsheetService svc,
            CancellationToken ct) =>
        {
            var dto = await svc.UpdateAsync(id, req, ct);
            return dto is not null ? Results.Ok(dto) : Results.NotFound();
        });

        admin.MapDelete("/{id:guid}", async (Guid id, IRegisteredSpreadsheetService svc, CancellationToken ct) =>
        {
            var deleted = await svc.DeleteAsync(id, ct);
            return deleted ? Results.NoContent() : Results.NotFound();
        });

        // ── User: list registered spreadsheets (ABAC read) ─────────
        var sheets = endpoints.MapGroup("/spreadsheets")
            .RequireAuthorization()
            .WithTags("Spreadsheets");

        sheets.MapGet("/", async (
            IRegisteredSpreadsheetService svc,
            IAuthorizationDecisionService abac,
            HttpContext ctx,
            CancellationToken ct) =>
        {
            var userId = ctx.User.GetEmail();
            if (userId is null) return Results.Unauthorized();

            var ip = ctx.Connection.RemoteIpAddress?.ToString();
            var decision = await abac.EvaluateAsync(userId, "read", AbacConstants.SpreadsheetResource, ipAddress: ip, ct: ct);
            if (decision.Result == DecisionResult.Deny)
                return Results.Json(new { error = "Forbidden", reason = decision.Reason }, statusCode: 403);

            return Results.Ok(await svc.GetAllAsync(ct));
        });

        // ── Worksheets (tabs) ────────────────────────────────────────

        sheets.MapGet("/{id:guid}/worksheets", async (
            Guid id,
            IRegisteredSpreadsheetService regSvc,
            IGoogleSheetsService sheetsSvc,
            IAuthorizationDecisionService abac,
            HttpContext ctx,
            CancellationToken ct) =>
        {
            var userId = ctx.User.GetEmail();
            if (userId is null) return Results.Unauthorized();

            var ip = ctx.Connection.RemoteIpAddress?.ToString();
            var decision = await abac.EvaluateAsync(userId, "read", AbacConstants.SpreadsheetResource,
                resourceId: id.ToString(), ipAddress: ip, ct: ct);
            if (decision.Result == DecisionResult.Deny)
                return Results.Json(new { error = "Forbidden", reason = decision.Reason }, statusCode: 403);

            var reg = await regSvc.GetByIdAsync(id, ct);
            if (reg is null) return Results.NotFound();

            var names = await sheetsSvc.GetWorksheetNamesAsync(reg.GoogleSpreadsheetId, ct);
            return Results.Ok(new WorksheetListResponse(names.ToList()));
        });

        // ── Row operations ───────────────────────────────────────────

        sheets.MapGet("/{id:guid}/worksheets/{sheetName}/rows", async (
            Guid id,
            string sheetName,
            IRegisteredSpreadsheetService regSvc,
            IGoogleSheetsService sheetsSvc,
            IAuthorizationDecisionService abac,
            HttpContext ctx,
            CancellationToken ct) =>
        {
            var userId = ctx.User.GetEmail();
            if (userId is null) return Results.Unauthorized();

            var ip = ctx.Connection.RemoteIpAddress?.ToString();
            var decision = await abac.EvaluateAsync(userId, "read", AbacConstants.SpreadsheetResource,
                resourceId: id.ToString(), ipAddress: ip, ct: ct);
            if (decision.Result == DecisionResult.Deny)
                return Results.Json(new { error = "Forbidden", reason = decision.Reason }, statusCode: 403);

            var reg = await regSvc.GetByIdAsync(id, ct);
            if (reg is null) return Results.NotFound();

            var (headers, rows) = await sheetsSvc.GetRowsAsync(reg.GoogleSpreadsheetId, sheetName, ct);
            return Results.Ok(new SheetDataResponse(headers.ToList(), rows.Select(r => (IReadOnlyList<string>)r.ToList()).ToList()));
        });

        sheets.MapPost("/{id:guid}/worksheets/{sheetName}/rows", async (
            Guid id,
            string sheetName,
            CreateRowRequest req,
            IRegisteredSpreadsheetService regSvc,
            IGoogleSheetsService sheetsSvc,
            IAuthorizationDecisionService abac,
            IWebhookDispatcher webhookDispatcher,
            HttpContext ctx,
            CancellationToken ct) =>
        {
            var userId = ctx.User.GetEmail();
            if (userId is null) return Results.Unauthorized();

            var ip = ctx.Connection.RemoteIpAddress?.ToString();
            var decision = await abac.EvaluateAsync(userId, "write", AbacConstants.SpreadsheetResource,
                resourceId: id.ToString(), ipAddress: ip, ct: ct);
            if (decision.Result == DecisionResult.Deny)
                return Results.Json(new { error = "Forbidden", reason = decision.Reason }, statusCode: 403);

            var reg = await regSvc.GetByIdAsync(id, ct);
            if (reg is null) return Results.NotFound();

            await sheetsSvc.AppendRowAsync(reg.GoogleSpreadsheetId, sheetName, req.Values.ToList(), ct);

            await webhookDispatcher.DispatchAsync("row.created", new
            {
                @event = "row.created",
                timestamp = DateTime.UtcNow,
                spreadsheet = new { id, name = reg.Name, googleSpreadsheetId = reg.GoogleSpreadsheetId },
                worksheet = sheetName,
                user = userId,
                data = new { values = req.Values }
            }, ct);

            return Results.Created();
        });

        sheets.MapPut("/{id:guid}/worksheets/{sheetName}/rows/{rowIndex:int}", async (
            Guid id,
            string sheetName,
            int rowIndex,
            UpdateRowRequest req,
            IRegisteredSpreadsheetService regSvc,
            IGoogleSheetsService sheetsSvc,
            IAuthorizationDecisionService abac,
            IWebhookDispatcher webhookDispatcher,
            HttpContext ctx,
            CancellationToken ct) =>
        {
            var userId = ctx.User.GetEmail();
            if (userId is null) return Results.Unauthorized();

            var ip = ctx.Connection.RemoteIpAddress?.ToString();
            var decision = await abac.EvaluateAsync(userId, "write", AbacConstants.SpreadsheetResource,
                resourceId: id.ToString(), ipAddress: ip, ct: ct);
            if (decision.Result == DecisionResult.Deny)
                return Results.Json(new { error = "Forbidden", reason = decision.Reason }, statusCode: 403);

            var reg = await regSvc.GetByIdAsync(id, ct);
            if (reg is null) return Results.NotFound();

            // Capture before values for webhook
            var (headers, rows) = await sheetsSvc.GetRowsAsync(reg.GoogleSpreadsheetId, sheetName, ct);
            var beforeValues = rowIndex >= 0 && rowIndex < rows.Count ? rows[rowIndex].ToList() : [];

            await sheetsSvc.UpdateRowAsync(reg.GoogleSpreadsheetId, sheetName, rowIndex, req.Values.ToList(), ct);

            await webhookDispatcher.DispatchAsync("row.updated", new
            {
                @event = "row.updated",
                timestamp = DateTime.UtcNow,
                spreadsheet = new { id, name = reg.Name, googleSpreadsheetId = reg.GoogleSpreadsheetId },
                worksheet = sheetName,
                user = userId,
                data = new { rowIndex, before = beforeValues, after = req.Values }
            }, ct);

            return Results.NoContent();
        });

        sheets.MapDelete("/{id:guid}/worksheets/{sheetName}/rows/{rowIndex:int}", async (
            Guid id,
            string sheetName,
            int rowIndex,
            IRegisteredSpreadsheetService regSvc,
            IGoogleSheetsService sheetsSvc,
            IAuthorizationDecisionService abac,
            IWebhookDispatcher webhookDispatcher,
            HttpContext ctx,
            CancellationToken ct) =>
        {
            var userId = ctx.User.GetEmail();
            if (userId is null) return Results.Unauthorized();

            var ip = ctx.Connection.RemoteIpAddress?.ToString();
            var decision = await abac.EvaluateAsync(userId, "delete", AbacConstants.SpreadsheetResource,
                resourceId: id.ToString(), ipAddress: ip, ct: ct);
            if (decision.Result == DecisionResult.Deny)
                return Results.Json(new { error = "Forbidden", reason = decision.Reason }, statusCode: 403);

            var reg = await regSvc.GetByIdAsync(id, ct);
            if (reg is null) return Results.NotFound();

            // Capture deleted row data for webhook
            var (headers, rows) = await sheetsSvc.GetRowsAsync(reg.GoogleSpreadsheetId, sheetName, ct);
            var deletedValues = rowIndex >= 0 && rowIndex < rows.Count ? rows[rowIndex].ToList() : [];

            await sheetsSvc.DeleteRowAsync(reg.GoogleSpreadsheetId, sheetName, rowIndex, ct);

            await webhookDispatcher.DispatchAsync("row.deleted", new
            {
                @event = "row.deleted",
                timestamp = DateTime.UtcNow,
                spreadsheet = new { id, name = reg.Name, googleSpreadsheetId = reg.GoogleSpreadsheetId },
                worksheet = sheetName,
                user = userId,
                data = new { rowIndex, values = deletedValues }
            }, ct);

            return Results.NoContent();
        });

        sheets.MapPost("/{id:guid}/worksheets/{sheetName}/rows/{rowIndex:int}/move", async (
            Guid id,
            string sheetName,
            int rowIndex,
            MoveRowRequest req,
            IRegisteredSpreadsheetService regSvc,
            IGoogleSheetsService sheetsSvc,
            IAuthorizationDecisionService abac,
            HttpContext ctx,
            CancellationToken ct) =>
        {
            var userId = ctx.User.GetEmail();
            if (userId is null) return Results.Unauthorized();

            var ip = ctx.Connection.RemoteIpAddress?.ToString();
            var decision = await abac.EvaluateAsync(userId, "write", AbacConstants.SpreadsheetResource,
                resourceId: id.ToString(), ipAddress: ip, ct: ct);
            if (decision.Result == DecisionResult.Deny)
                return Results.Json(new { error = "Forbidden", reason = decision.Reason }, statusCode: 403);

            var reg = await regSvc.GetByIdAsync(id, ct);
            if (reg is null) return Results.NotFound();

            await sheetsSvc.MoveRowAsync(reg.GoogleSpreadsheetId, sheetName, rowIndex, req.Direction, ct);
            return Results.NoContent();
        });

        return endpoints;
    }
}
