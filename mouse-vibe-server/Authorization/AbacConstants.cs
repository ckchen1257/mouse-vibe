namespace mouse_vibe_server.Authorization;

/// <summary>
/// Central place for authorization policy names and ABAC-related constants.
/// Avoids magic strings scattered across endpoints and handlers.
/// </summary>
public static class AbacConstants
{
    // ── Authorization policy names ──────────────────────────────────
    public const string AdminOnly = "AdminOnly";

    // ── Resource types ──────────────────────────────────────────────
    public const string WeatherForecastResource = "WeatherForecast";
    public const string SpreadsheetResource = "Spreadsheet";
    public const string WebhookResource = "Webhook";
}
