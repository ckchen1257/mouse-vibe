using mouse_vibe_server.Models.Abac.Dto;

namespace mouse_vibe_server.Services.Abac;

public interface IPolicySimulatorService
{
    Task<SimulateResponse> SimulateAsync(SimulateRequest request, CancellationToken ct = default);
}
