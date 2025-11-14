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
            // Виконувати сидінг лише якщо кімнат ще немає
            if (_context.Rooms.Any())
            {
                return;
            }

            // Створити тестового користувача
            var testUser = new UserEntity
            {
                Id = Guid.NewGuid().ToString(),
                UserName = "Dmytro Potapchuk",
                Email = "dmytro@test.com",
                CreatedDate = DateTime.UtcNow
            };
            _context.Users.Add(testUser);

            // Створити тестову кімнату
            var testRoom = new RoomEntity
            {
                Id = Guid.NewGuid().ToString(),
                Name = "Dmytro Potapchuk",
                IsPrivate = true,
                CreatedById = testUser.Id,
                CreatedDate = DateTime.UtcNow
            };
            _context.Rooms.Add(testRoom);

            // Створити тестові повідомлення
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

            // Створити зв'язок UserRoom (членство користувача у кімнаті)
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
