using mouse_vibe_server.Models.Dto;

namespace mouse_vibe_server.Services;

public interface IWebhookService
{
    Task<IReadOnlyList<WebhookSubscriptionDto>> GetAllAsync(CancellationToken ct = default);
    Task<WebhookSubscriptionDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<WebhookSubscriptionDto> CreateAsync(CreateWebhookRequest req, string createdBy, CancellationToken ct = default);
    Task<WebhookSubscriptionDto?> UpdateAsync(Guid id, UpdateWebhookRequest req, CancellationToken ct = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct = default);
    Task<WebhookEventListResponse> GetEventsAsync(Guid subscriptionId, int page, int pageSize, CancellationToken ct = default);
    Task<bool> RetryEventAsync(Guid subscriptionId, Guid eventId, CancellationToken ct = default);
}
