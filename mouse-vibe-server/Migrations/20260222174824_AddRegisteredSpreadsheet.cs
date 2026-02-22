using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace mouse_vibe_server.Migrations
{
    /// <inheritdoc />
    public partial class AddRegisteredSpreadsheet : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "registered_spreadsheets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    GoogleSpreadsheetId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Description = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    CreatedBy = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_registered_spreadsheets", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_registered_spreadsheets_GoogleSpreadsheetId",
                table: "registered_spreadsheets",
                column: "GoogleSpreadsheetId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "registered_spreadsheets");
        }
    }
}
