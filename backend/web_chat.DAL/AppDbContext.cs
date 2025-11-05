using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using web_chat.DAL.Entities;
using web_chat.DAL.Entities.Identity;

namespace web_chat.DAL
{
    public class AppDbContext : IdentityDbContext<UserEntity, ApplicationRole, string>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // DbSets for chat entities
        public DbSet<RoomEntity> Rooms { get; set; } = null!;
        public DbSet<MessageEntity> Messages { get; set; } = null!;
        public DbSet<UserRoomEntity> UserRooms { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Rename Identity tables to simpler names
            modelBuilder.Entity<UserEntity>().ToTable("Users");
            modelBuilder.Entity<ApplicationRole>().ToTable("Roles");

            // Configure Identity relationships to avoid shadow properties
            ConfigureIdentityRelationships(modelBuilder);
            
            ConfigureRoomEntity(modelBuilder);
            ConfigureMessageEntity(modelBuilder);
            ConfigureUserRoomEntity(modelBuilder);
        }

        private void ConfigureIdentityRelationships(ModelBuilder modelBuilder)
        {
            // Configure ApplicationUserRole
            modelBuilder.Entity<ApplicationUserRole>(entity =>
            {
                entity.HasOne(ur => ur.User)
                    .WithMany(u => u.UserRoles)
                    .HasForeignKey(ur => ur.UserId);

                entity.HasOne(ur => ur.Role)
                    .WithMany(r => r.UserRoles)
                    .HasForeignKey(ur => ur.RoleId);
            });

            // Configure ApplicationRoleClaim
            modelBuilder.Entity<ApplicationRoleClaim>(entity =>
            {
                entity.HasOne(rc => rc.Role)
                    .WithMany(r => r.RoleClaims)
                    .HasForeignKey(rc => rc.RoleId);
            });

            // Configure ApplicationUserClaim
            modelBuilder.Entity<ApplicationUserClaim>(entity =>
            {
                entity.HasOne(uc => uc.User)
                    .WithMany(u => u.Claims)
                    .HasForeignKey(uc => uc.UserId);
            });

            // Configure ApplicationUserLogin
            modelBuilder.Entity<ApplicationUserLogin>(entity =>
            {
                entity.HasOne(ul => ul.User)
                    .WithMany(u => u.Logins)
                    .HasForeignKey(ul => ul.UserId);
            });

            // Configure ApplicationUserToken
            modelBuilder.Entity<ApplicationUserToken>(entity =>
            {
                entity.HasOne(ut => ut.User)
                    .WithMany(u => u.Tokens)
                    .HasForeignKey(ut => ut.UserId);
            });
        }

        private void ConfigureRoomEntity(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<RoomEntity>(entity =>
            {
                entity.Property(e => e.Name).HasMaxLength(100);
            });
        }

        private void ConfigureMessageEntity(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<MessageEntity>(entity =>
            {
                entity.HasOne(e => e.User)
                    .WithMany(u => u.Messages)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.Room)
                    .WithMany(r => r.Messages)
                    .HasForeignKey(e => e.RoomId)
                    .OnDelete(DeleteBehavior.SetNull);
            });
        }

        private void ConfigureUserRoomEntity(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<UserRoomEntity>(entity =>
            {
                entity.HasOne(e => e.User)
                    .WithMany(u => u.UserRooms)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Room)
                    .WithMany(r => r.UserRooms)
                    .HasForeignKey(e => e.RoomId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => new { e.UserId, e.RoomId }).IsUnique();
            });
        }
    }
}