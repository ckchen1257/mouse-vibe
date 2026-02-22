namespace mouse_vibe_server.Services;

/// <summary>
/// Wraps the Google Sheets API. All row indices are 0-based data rows (excluding the header row).
/// </summary>
public interface IGoogleSheetsService
{
    /// <summary>Get all worksheet (tab) names in the spreadsheet.</summary>
    Task<IList<string>> GetWorksheetNamesAsync(string spreadsheetId, CancellationToken ct = default);

    /// <summary>Get the numeric sheet ID for a given sheet name (needed for batchUpdate operations).</summary>
    Task<int> GetSheetIdByNameAsync(string spreadsheetId, string sheetName, CancellationToken ct = default);

    /// <summary>Get the header row and all data rows from a worksheet.</summary>
    Task<(IList<string> Headers, IList<IList<string>> Rows)> GetRowsAsync(string spreadsheetId, string sheetName, CancellationToken ct = default);

    /// <summary>Append a new row at the bottom of the worksheet.</summary>
    Task AppendRowAsync(string spreadsheetId, string sheetName, IList<string> values, CancellationToken ct = default);

    /// <summary>Update a data row. rowIndex is 0-based (row 0 = first data row below header).</summary>
    Task UpdateRowAsync(string spreadsheetId, string sheetName, int rowIndex, IList<string> values, CancellationToken ct = default);

    /// <summary>Delete a data row. rowIndex is 0-based.</summary>
    Task DeleteRowAsync(string spreadsheetId, string sheetName, int rowIndex, CancellationToken ct = default);

    /// <summary>Move a data row up or down by one position. rowIndex is 0-based.</summary>
    Task MoveRowAsync(string spreadsheetId, string sheetName, int rowIndex, string direction, CancellationToken ct = default);
}
