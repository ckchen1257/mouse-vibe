using Microsoft.EntityFrameworkCore;
using mouse_vibe_server.Models.Abac;

namespace mouse_vibe_server.Data;

public sealed class AbacDbContext : DbContext
{
    public AbacDbContext(DbContextOptions<AbacDbContext> options) : base(options) { }

    public DbSet<AbacPolicy> Policies => Set<AbacPolicy>();
    public DbSet<UserAttribute> UserAttributes => Set<UserAttribute>();
    public DbSet<DecisionAuditLog> AuditLogs => Set<DecisionAuditLog>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<TeamMember> TeamMembers => Set<TeamMember>();
    public DbSet<ResourceType> ResourceTypes => Set<ResourceType>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ── AbacPolicy ──────────────────────────────────────────────
        modelBuilder.Entity<AbacPolicy>(e =>
        {
            e.ToTable("abac_policies");
            e.HasKey(p => p.Id);
            e.Property(p => p.Id).HasDefaultValueSql("gen_random_uuid()");
            e.Property(p => p.Name).HasMaxLength(256).IsRequired();
            e.Property(p => p.Description).HasMaxLength(1024);
            e.Property(p => p.Effect).HasConversion<string>().HasMaxLength(16);
            e.Property(p => p.Status).HasConversion<string>().HasMaxLength(16);
            e.Property(p => p.SubjectRoles).HasMaxLength(512);
            e.Property(p => p.SubjectTeams).HasMaxLength(512);
            e.Property(p => p.ResourceType).HasMaxLength(128);
            e.Property(p => p.ResourceId).HasMaxLength(256);
            e.Property(p => p.Action).HasMaxLength(32);
            e.Property(p => p.CreatedBy).HasMaxLength(256);

            e.HasIndex(p => p.Status);
            e.HasIndex(p => new { p.ResourceType, p.Action });
        });

        // ── UserAttribute ────────────────────────────────────────────
        modelBuilder.Entity<UserAttribute>(e =>
        {
            e.ToTable("abac_user_attributes");
            e.HasKey(u => u.Id);
            e.Property(u => u.Id).HasDefaultValueSql("gen_random_uuid()");
            e.Property(u => u.UserId).HasMaxLength(256).IsRequired();
            e.Property(u => u.DisplayName).HasMaxLength(256);
            e.Property(u => u.Roles).HasMaxLength(512);

            e.HasIndex(u => u.UserId).IsUnique();
        });

        // ── DecisionAuditLog ─────────────────────────────────────────
        modelBuilder.Entity<DecisionAuditLog>(e =>
        {
            e.ToTable("abac_audit_logs");
            e.HasKey(a => a.Id);
            e.Property(a => a.Id).HasDefaultValueSql("gen_random_uuid()");
            e.Property(a => a.UserId).HasMaxLength(256).IsRequired();
            e.Property(a => a.Action).HasMaxLength(64).IsRequired();
            e.Property(a => a.ResourceType).HasMaxLength(128).IsRequired();
            e.Property(a => a.ResourceId).HasMaxLength(256);
            e.Property(a => a.Result).HasConversion<string>().HasMaxLength(16);
            e.Property(a => a.Reason).HasMaxLength(1024);
            e.Property(a => a.SubjectAttributesSnapshot).HasColumnType("jsonb");
            e.Property(a => a.IpAddress).HasMaxLength(64);

            e.HasIndex(a => a.UserId);
            e.HasIndex(a => a.CreatedAt);
            e.HasIndex(a => new { a.ResourceType, a.ResourceId });
        });

        // ── Team ─────────────────────────────────────────────────────
        modelBuilder.Entity<Team>(e =>
        {
            e.ToTable("abac_teams");
            e.HasKey(t => t.Id);
            e.Property(t => t.Id).HasDefaultValueSql("gen_random_uuid()");
            e.Property(t => t.Name).HasMaxLength(128).IsRequired();

            e.HasIndex(t => t.Name).IsUnique();
        });

        // ── TeamMember ───────────────────────────────────────────────
        modelBuilder.Entity<TeamMember>(e =>
        {
            e.ToTable("abac_team_members");
            e.HasKey(m => m.Id);
            e.Property(m => m.Id).HasDefaultValueSql("gen_random_uuid()");
            e.Property(m => m.MemberType).HasConversion<string>().HasMaxLength(16);
            e.Property(m => m.MemberUserId).HasMaxLength(256);

            e.HasOne(m => m.Team)
                .WithMany(t => t.Members)
                .HasForeignKey(m => m.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(m => m.MemberTeam)
                .WithMany(t => t.MemberOf)
                .HasForeignKey(m => m.MemberTeamId)
                .OnDelete(DeleteBehavior.Cascade);

            // Prevent duplicate memberships
            e.HasIndex(m => new { m.TeamId, m.MemberType, m.MemberUserId, m.MemberTeamId }).IsUnique();
        });

        // ── ResourceType ─────────────────────────────────────────────
        modelBuilder.Entity<ResourceType>(e =>
        {
            e.ToTable("abac_resource_types");
            e.HasKey(r => r.Id);
            e.Property(r => r.Id).HasDefaultValueSql("gen_random_uuid()");
            e.Property(r => r.Name).HasMaxLength(128).IsRequired();
            e.Property(r => r.Description).HasMaxLength(512);

            e.HasIndex(r => r.Name).IsUnique();
        });
    }
}
