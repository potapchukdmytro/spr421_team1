using Microsoft.Extensions.DependencyInjection;
using web_chat.DAL.Entities;

namespace web_chat.DAL.Seeders
{
    public class TestDataSeeder : ISeeder
    {
        private readonly AppDbContext _context;

        public TestDataSeeder(AppDbContext context)
        {
            _context = context;
        }

        public async Task SeedAsync()
        {
            // Only seed if no rooms exist
            if (_context.Rooms.Any())
            {
                return;
            }

            // Create a test user
            var testUser = new UserEntity
            {
                Id = Guid.NewGuid().ToString(),
                UserName = "Dmytro Potapchuk",
                Email = "dmytro@test.com",
                CreatedDate = DateTime.UtcNow
            };
            _context.Users.Add(testUser);

            // Create a test room
            var testRoom = new RoomEntity
            {
                Id = Guid.NewGuid().ToString(),
                Name = "Dmytro Potapchuk",
                IsPrivate = true,
                CreatedDate = DateTime.UtcNow
            };
            _context.Rooms.Add(testRoom);

            // Create test messages
            var messages = new[]
            {
                new MessageEntity
                {
                    Id = Guid.NewGuid().ToString(),
                    Text = "Hey! How are you?",
                    SentAt = DateTime.UtcNow.AddMinutes(-35),
                    UserId = testUser.Id,
                    RoomId = testRoom.Id,
                    CreatedDate = DateTime.UtcNow.AddMinutes(-35)
                },
                new MessageEntity
                {
                    Id = Guid.NewGuid().ToString(),
                    Text = "Great! Just working on the chat UI",
                    SentAt = DateTime.UtcNow.AddMinutes(-34),
                    UserId = testUser.Id,
                    RoomId = testRoom.Id,
                    CreatedDate = DateTime.UtcNow.AddMinutes(-34)
                },
                new MessageEntity
                {
                    Id = Guid.NewGuid().ToString(),
                    Text = "Awesome! Can't wait to see it",
                    SentAt = DateTime.UtcNow.AddMinutes(-32),
                    UserId = testUser.Id,
                    RoomId = testRoom.Id,
                    CreatedDate = DateTime.UtcNow.AddMinutes(-32)
                },
                new MessageEntity
                {
                    Id = Guid.NewGuid().ToString(),
                    Text = "It's looking really good! Check it out soon 🚀",
                    SentAt = DateTime.UtcNow.AddMinutes(-30),
                    UserId = testUser.Id,
                    RoomId = testRoom.Id,
                    CreatedDate = DateTime.UtcNow.AddMinutes(-30)
                }
            };

            _context.Messages.AddRange(messages);

            // Create UserRoom relationship
            var userRoom = new UserRoomEntity
            {
                Id = Guid.NewGuid().ToString(),
                UserId = testUser.Id,
                RoomId = testRoom.Id,
                JoinedAt = DateTime.UtcNow,
                IsAdmin = true,
                IsBanned = false,
                CreatedDate = DateTime.UtcNow
            };
            _context.UserRooms.Add(userRoom);

            await _context.SaveChangesAsync();
        }
    }
}
