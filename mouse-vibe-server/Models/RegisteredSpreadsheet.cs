namespace mouse_vibe_server.Models;

/// <summary>
/// A Google Spreadsheet registered in the system for editing via the Google Sheets API.
/// The actual data lives in Google Sheets; only the registration metadata is stored locally.
/// </summary>
public sealed class RegisteredSpreadsheet
{
    public Guid Id { get; set; }

    /// <summary>Display name for the spreadsheet.</summary>
    public required string Name { get; set; }

    /// <summary>The Google Sheets spreadsheet ID (from the URL).</summary>
    public required string GoogleSpreadsheetId { get; set; }

    /// <summary>Optional description.</summary>
    public string? Description { get; set; }

    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
