namespace mouse_vibe_server.Models.Dto;

// ── Registered Spreadsheet DTOs ─────────────────────────────────────

public sealed record RegisteredSpreadsheetDto(
    Guid Id,
    string Name,
    string GoogleSpreadsheetId,
    string? Description,
    string? CreatedBy,
    DateTime CreatedAt
);

public sealed record CreateRegisteredSpreadsheetRequest(
    string Name,
    string GoogleSpreadsheetId,
    string? Description
);

public sealed record UpdateRegisteredSpreadsheetRequest(
    string Name,
    string? Description
);

// ── Google Sheets Data DTOs ─────────────────────────────────────────

public sealed record WorksheetListResponse(
    IReadOnlyList<string> Worksheets
);

public sealed record SheetDataResponse(
    IReadOnlyList<string> Headers,
    IReadOnlyList<IReadOnlyList<string>> Rows
);

public sealed record CreateRowRequest(
    IReadOnlyList<string> Values
);

public sealed record UpdateRowRequest(
    IReadOnlyList<string> Values
);

public sealed record MoveRowRequest(
    string Direction // "up" or "down"
);
