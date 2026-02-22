using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace mouse_vibe_server.Migrations
{
    /// <inheritdoc />
    public partial class InitialRefactor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "abac_audit_logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    UserId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Action = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ResourceType = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    ResourceId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Result = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    MatchedPolicyId = table.Column<Guid>(type: "uuid", nullable: true),
                    Reason = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    SubjectAttributesSnapshot = table.Column<string>(type: "jsonb", nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_abac_audit_logs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "abac_policies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Description = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    Effect = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    SubjectRoles = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    SubjectTeams = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    ResourceType = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    ResourceId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Action = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_abac_policies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "abac_resource_types",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Name = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Description = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_abac_resource_types", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "abac_teams",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Name = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_abac_teams", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "abac_user_attributes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    UserId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Roles = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    IsAdmin = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_abac_user_attributes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "abac_team_members",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    TeamId = table.Column<Guid>(type: "uuid", nullable: false),
                    MemberType = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    MemberUserId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    MemberTeamId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_abac_team_members", x => x.Id);
                    table.ForeignKey(
                        name: "FK_abac_team_members_abac_teams_MemberTeamId",
                        column: x => x.MemberTeamId,
                        principalTable: "abac_teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_abac_team_members_abac_teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "abac_teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_abac_audit_logs_CreatedAt",
                table: "abac_audit_logs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_abac_audit_logs_ResourceType_ResourceId",
                table: "abac_audit_logs",
                columns: new[] { "ResourceType", "ResourceId" });

            migrationBuilder.CreateIndex(
                name: "IX_abac_audit_logs_UserId",
                table: "abac_audit_logs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_abac_policies_ResourceType_Action",
                table: "abac_policies",
                columns: new[] { "ResourceType", "Action" });

            migrationBuilder.CreateIndex(
                name: "IX_abac_policies_Status",
                table: "abac_policies",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_abac_resource_types_Name",
                table: "abac_resource_types",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_abac_team_members_MemberTeamId",
                table: "abac_team_members",
                column: "MemberTeamId");

            migrationBuilder.CreateIndex(
                name: "IX_abac_team_members_TeamId_MemberType_MemberUserId_MemberTeam~",
                table: "abac_team_members",
                columns: new[] { "TeamId", "MemberType", "MemberUserId", "MemberTeamId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_abac_teams_Name",
                table: "abac_teams",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_abac_user_attributes_UserId",
                table: "abac_user_attributes",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "abac_audit_logs");

            migrationBuilder.DropTable(
                name: "abac_policies");

            migrationBuilder.DropTable(
                name: "abac_resource_types");

            migrationBuilder.DropTable(
                name: "abac_team_members");

            migrationBuilder.DropTable(
                name: "abac_user_attributes");

            migrationBuilder.DropTable(
                name: "abac_teams");
        }
    }
}
