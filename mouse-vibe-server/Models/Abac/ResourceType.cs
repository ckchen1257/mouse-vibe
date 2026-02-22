namespace mouse_vibe_server.Models.Abac;

/// <summary>
/// A registered resource type that policies can reference.
/// Resource types correspond to developed features, e.g. "WeatherForecast".
/// </summary>
public sealed class ResourceType
{
    public Guid Id { get; set; }

    /// <summary>Unique resource type name, e.g. "WeatherForecast".</summary>
    public required string Name { get; set; }

    /// <summary>Optional description.</summary>
    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
