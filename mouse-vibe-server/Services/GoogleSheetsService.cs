using Google.Apis.Auth.OAuth2;
using Google.Apis.Services;
using Google.Apis.Sheets.v4;
using Google.Apis.Sheets.v4.Data;

namespace mouse_vibe_server.Services;

public sealed class GoogleSheetsService : IGoogleSheetsService
{
    private readonly SheetsService _sheets;

    public GoogleSheetsService(IConfiguration configuration)
    {
        var json = configuration["GoogleSheets:ServiceAccountKeyJson"]
            ?? throw new InvalidOperationException("GoogleSheets:ServiceAccountKeyJson is not configured.");
        var credential = GoogleCredential.FromJson(json)
            .CreateScoped(SheetsService.Scope.Spreadsheets);

        _sheets = new SheetsService(new BaseClientService.Initializer
        {
            HttpClientInitializer = credential,
            ApplicationName = "mouse-vibe-server"
        });
    }

    public async Task<IList<string>> GetWorksheetNamesAsync(string spreadsheetId, CancellationToken ct = default)
    {
        var request = _sheets.Spreadsheets.Get(spreadsheetId);
        request.Fields = "sheets.properties.title";
        var spreadsheet = await request.ExecuteAsync(ct);
        return spreadsheet.Sheets.Select(s => s.Properties.Title).ToList();
    }

    public async Task<int> GetSheetIdByNameAsync(string spreadsheetId, string sheetName, CancellationToken ct = default)
    {
        var request = _sheets.Spreadsheets.Get(spreadsheetId);
        request.Fields = "sheets.properties";
        var spreadsheet = await request.ExecuteAsync(ct);
        var sheet = spreadsheet.Sheets.FirstOrDefault(s =>
            string.Equals(s.Properties.Title, sheetName, StringComparison.OrdinalIgnoreCase))
            ?? throw new ArgumentException($"Worksheet '{sheetName}' not found.");
        return sheet.Properties.SheetId!.Value;
    }

    public async Task<(IList<string> Headers, IList<IList<string>> Rows)> GetRowsAsync(
        string spreadsheetId, string sheetName, CancellationToken ct = default)
    {
        var range = $"'{sheetName}'";
        var request = _sheets.Spreadsheets.Values.Get(spreadsheetId, range);
        request.ValueRenderOption = SpreadsheetsResource.ValuesResource.GetRequest.ValueRenderOptionEnum.FORMATTEDVALUE;
        var response = await request.ExecuteAsync(ct);

        var values = response.Values;
        if (values is null || values.Count == 0)
            return (Array.Empty<string>(), Array.Empty<IList<string>>());

        var headers = values[0].Select(v => v?.ToString() ?? "").ToList();
        var rows = values.Skip(1)
            .Select(row =>
            {
                // Pad row to match header length
                var cells = row.Select(v => v?.ToString() ?? "").ToList();
                while (cells.Count < headers.Count) cells.Add("");
                return (IList<string>)cells;
            })
            .ToList();

        return (headers, rows);
    }

    public async Task AppendRowAsync(string spreadsheetId, string sheetName, IList<string> values, CancellationToken ct = default)
    {
        var range = $"'{sheetName}'!A:A";
        var body = new ValueRange
        {
            Values = [values.Select(v => (object)v).ToList()]
        };

        var request = _sheets.Spreadsheets.Values.Append(body, spreadsheetId, range);
        request.ValueInputOption = SpreadsheetsResource.ValuesResource.AppendRequest.ValueInputOptionEnum.USERENTERED;
        request.InsertDataOption = SpreadsheetsResource.ValuesResource.AppendRequest.InsertDataOptionEnum.INSERTROWS;
        await request.ExecuteAsync(ct);
    }

    public async Task UpdateRowAsync(string spreadsheetId, string sheetName, int rowIndex, IList<string> values, CancellationToken ct = default)
    {
        // rowIndex is 0-based data row; sheet row = rowIndex + 2 (1-based, skip header)
        var sheetRow = rowIndex + 2;
        var range = $"'{sheetName}'!A{sheetRow}";
        var body = new ValueRange
        {
            Values = [values.Select(v => (object)v).ToList()]
        };

        var request = _sheets.Spreadsheets.Values.Update(body, spreadsheetId, range);
        request.ValueInputOption = SpreadsheetsResource.ValuesResource.UpdateRequest.ValueInputOptionEnum.USERENTERED;
        await request.ExecuteAsync(ct);
    }

    public async Task DeleteRowAsync(string spreadsheetId, string sheetName, int rowIndex, CancellationToken ct = default)
    {
        var sheetId = await GetSheetIdByNameAsync(spreadsheetId, sheetName, ct);
        // Sheet row = rowIndex + 1 (0-based sheet row, skip header)
        var sheetRowIndex = rowIndex + 1;

        var batchRequest = new BatchUpdateSpreadsheetRequest
        {
            Requests =
            [
                new Request
                {
                    DeleteDimension = new DeleteDimensionRequest
                    {
                        Range = new DimensionRange
                        {
                            SheetId = sheetId,
                            Dimension = "ROWS",
                            StartIndex = sheetRowIndex,
                            EndIndex = sheetRowIndex + 1
                        }
                    }
                }
            ]
        };

        await _sheets.Spreadsheets.BatchUpdate(batchRequest, spreadsheetId).ExecuteAsync(ct);
    }

    public async Task MoveRowAsync(string spreadsheetId, string sheetName, int rowIndex, string direction, CancellationToken ct = default)
    {
        var sheetId = await GetSheetIdByNameAsync(spreadsheetId, sheetName, ct);
        // Sheet row = rowIndex + 1 (0-based sheet row, skip header)
        var sourceIndex = rowIndex + 1;

        int destinationIndex;
        if (string.Equals(direction, "up", StringComparison.OrdinalIgnoreCase))
        {
            if (sourceIndex <= 1)
                throw new ArgumentException("Cannot move the first data row up.");
            destinationIndex = sourceIndex - 1;
        }
        else if (string.Equals(direction, "down", StringComparison.OrdinalIgnoreCase))
        {
            destinationIndex = sourceIndex + 2; // MoveDimension destination is "insert before" index
        }
        else
        {
            throw new ArgumentException("Direction must be 'up' or 'down'.");
        }

        var batchRequest = new BatchUpdateSpreadsheetRequest
        {
            Requests =
            [
                new Request
                {
                    MoveDimension = new MoveDimensionRequest
                    {
                        Source = new DimensionRange
                        {
                            SheetId = sheetId,
                            Dimension = "ROWS",
                            StartIndex = sourceIndex,
                            EndIndex = sourceIndex + 1
                        },
                        DestinationIndex = destinationIndex
                    }
                }
            ]
        };

        await _sheets.Spreadsheets.BatchUpdate(batchRequest, spreadsheetId).ExecuteAsync(ct);
    }
}
