using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using mouse_vibe_server.Authorization;
using mouse_vibe_server.Data;
using mouse_vibe_server.Endpoints;
using mouse_vibe_server.Services;
using mouse_vibe_server.Services.Abac;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddSingleton<IWeatherForecastService, WeatherForecastService>();

// ── Database ────────────────────────────────────────────────────────
builder.Services.AddDbContext<AbacDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("AbacDb")));

// ── ABAC Services ───────────────────────────────────────────────────
builder.Services.AddScoped<IPolicyService, PolicyService>();
builder.Services.AddScoped<IAttributeService, AttributeService>();
builder.Services.AddScoped<IAuthorizationDecisionService, AuthorizationDecisionService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IPolicySimulatorService, PolicySimulatorService>();
builder.Services.AddScoped<ITeamService, TeamService>();
builder.Services.AddScoped<IResourceTypeService, ResourceTypeService>();

var firebaseProjectId = builder.Configuration["Firebase:ProjectId"];
if (string.IsNullOrWhiteSpace(firebaseProjectId))
{
    throw new InvalidOperationException("Firebase:ProjectId is required for JWT authentication.");
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = $"https://securetoken.google.com/{firebaseProjectId}";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = $"https://securetoken.google.com/{firebaseProjectId}",
            ValidateAudience = true,
            ValidAudience = firebaseProjectId,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(2)
        };
    });

builder.Services.AddScoped<IAuthorizationHandler, AdminRequirementHandler>();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AbacConstants.AdminOnly, policy =>
        policy.RequireAuthenticatedUser()
              .AddRequirements(new AdminRequirement()));
});

var configuredOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (configuredOrigins is { Length: > 0 })
        {
            policy.WithOrigins(configuredOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

var app = builder.Build();

// ── Auto-migrate database on startup ────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AbacDbContext>();
    await db.Database.MigrateAsync();

    // Seed default admin if not exists
    var initialAdminEmail = app.Configuration["InitialAdmin:Email"];
    var initialAdminDisplayName = app.Configuration["InitialAdmin:DisplayName"] ?? "Admin";
    if (!string.IsNullOrWhiteSpace(initialAdminEmail)
        && !await db.UserAttributes.AnyAsync(u => u.UserId == initialAdminEmail))
    {
        db.UserAttributes.Add(new mouse_vibe_server.Models.Abac.UserAttribute
        {
            UserId = initialAdminEmail,
            DisplayName = initialAdminDisplayName,
            Roles = "admin",
            IsAdmin = true
        });
        await db.SaveChangesAsync();
    }

    // Seed default resource type "WeatherForecast" if not exists
    if (!await db.ResourceTypes.AnyAsync(r => r.Name == AbacConstants.WeatherForecastResource))
    {
        db.ResourceTypes.Add(new mouse_vibe_server.Models.Abac.ResourceType
        {
            Name = AbacConstants.WeatherForecastResource,
            Description = "Weather forecast data"
        });
        await db.SaveChangesAsync();
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapWeatherForecastEndpoints();
app.MapPolicyEndpoints();
app.MapUserAttributeEndpoints();
app.MapAuditEndpoints();
app.MapPolicySimulatorEndpoints();
app.MapTeamEndpoints();
app.MapResourceTypeEndpoints();
app.MapMeEndpoints();

app.Run();
