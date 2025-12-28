using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClonePinterest.API.Migrations
{
    /// <inheritdoc />
    public partial class AddImageDimensionsToPin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ImageHeight",
                table: "Pins",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ImageWidth",
                table: "Pins",
                type: "INTEGER",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageHeight",
                table: "Pins");

            migrationBuilder.DropColumn(
                name: "ImageWidth",
                table: "Pins");
        }
    }
}
