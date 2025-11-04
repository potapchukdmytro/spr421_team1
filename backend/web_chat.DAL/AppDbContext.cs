using Microsoft.EntityFrameworkCore;
using web_chat.DAL.Entities;

namespace web_chat.DAL
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions options) : base(options) { }

        public DbSet<MessageEntity> Messages { get; set; }
        public DbSet<UserEntity> Users { get; set; }
        public DbSet<RoomEntity> Rooms { get; set; }
        public DbSet<UserRoomEntity> UserRooms { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<UserEntity>(e =>
            {
                e.HasKey(u => u.Id);
                e.Property(u => u.UserName)
                .IsRequired()
                .HasMaxLength(100);
                e.Property(u => u.UserEmail)
                .IsRequired()
                .HasMaxLength(200);
                e.HasIndex(u => u.UserEmail)
                .IsUnique();

                // one-to-many: User - Messages
                e.HasMany(u => u.Messages)
                .WithOne(m => m.User)
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.SetNull);

                // one-to-many: User - UserRooms
                e.HasMany(u => u.UserRooms)
                .WithOne(ur => ur.User)
                .HasForeignKey(ur => ur.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<MessageEntity>(e =>
            {
                e.HasKey(m => m.Id);
                e.Property(m => m.Text)
                .IsRequired();
                e.Property(m => m.SentAt)
                .IsRequired()
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            builder.Entity<RoomEntity>(e =>
            {
                e.HasKey(r => r.Id);
                e.Property(r => r.Name)
                .IsRequired()
                .HasMaxLength(100);
                e.Property(r => r.IsPrivate)
                .IsRequired();

                // one-to-many: Room - Messages
                e.HasMany(r => r.Messages)
                .WithOne(m => m.Room)
                .HasForeignKey(m => m.RoomId)
                .OnDelete(DeleteBehavior.Cascade);

                // one-to-many: Room - UserRooms
                e.HasMany(r => r.UserRooms)
                .WithOne(ur => ur.Room)
                .HasForeignKey(ur => ur.RoomId)
                .OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<UserRoomEntity>(e =>
            {
                e.HasKey(ur => ur.Id);
                e.Property(ur => ur.JoinedAt)
                .IsRequired()
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
                e.Property(ur => ur.IsAdmin)
                .IsRequired();
                e.Property(ur => ur.IsBanned)
                .IsRequired();
            });
        }
    }
}
