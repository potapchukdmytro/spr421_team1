using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace web_chat.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddCreatedByIdToRoom : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CreatedById",
                table: "Rooms",
                type: "text",
                nullable: true);

            // Get the first user to assign as creator for existing rooms
            migrationBuilder.Sql(@"
                UPDATE ""Rooms"" 
                SET ""CreatedById"" = (SELECT ""Id"" FROM ""Users"" LIMIT 1) 
                WHERE ""CreatedById"" IS NULL
            ");

            migrationBuilder.AlterColumn<string>(
                name: "CreatedById",
                table: "Rooms",
                type: "text",
                nullable: false,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Rooms_CreatedById",
                table: "Rooms",
                column: "CreatedById");

            migrationBuilder.AddForeignKey(
                name: "FK_Rooms_Users_CreatedById",
                table: "Rooms",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Rooms_Users_CreatedById",
                table: "Rooms");

            migrationBuilder.DropIndex(
                name: "IX_Rooms_CreatedById",
                table: "Rooms");

            migrationBuilder.AlterColumn<string>(
                name: "CreatedById",
                table: "Rooms",
                type: "text",
                nullable: true,
                oldNullable: false);

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "Rooms");
        }
    }
}
