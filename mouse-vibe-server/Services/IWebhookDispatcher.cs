namespace mouse_vibe_server.Services;

public interface IWebhookDispatcher
{
    Task DispatchAsync(string eventType, object payload, CancellationToken ct = default);
}
