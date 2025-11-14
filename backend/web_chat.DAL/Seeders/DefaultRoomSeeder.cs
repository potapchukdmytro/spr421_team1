using Microsoft.EntityFrameworkCore;
using web_chat.DAL.Entities;

namespace web_chat.DAL.Seeders
{
    public class DefaultRoomSeeder : ISeeder
    {
        private readonly AppDbContext _context;
        public const string DEFAULT_ROOM_NAME = "Web Chat Official";

        public DefaultRoomSeeder(AppDbContext context)
        {
            _context = context;
        }

        public async Task SeedAsync()
        {
            // Check if the default room already exists
            var existingRoom = await _context.Rooms
                .FirstOrDefaultAsync(r => r.Name == DEFAULT_ROOM_NAME);

            string roomId;

            if (existingRoom != null)
            {
                Console.WriteLine($"✅ Default room '{DEFAULT_ROOM_NAME}' already exists");
                roomId = existingRoom.Id;
            }
            else
            {
                // Create the default room
                var defaultRoom = new RoomEntity
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = DEFAULT_ROOM_NAME,
                    IsPrivate = false,
                    CreatedDate = DateTime.UtcNow
                };

                _context.Rooms.Add(defaultRoom);
                await _context.SaveChangesAsync();
                roomId = defaultRoom.Id;

                Console.WriteLine($"✅ Default room '{DEFAULT_ROOM_NAME}' created successfully");
            }

            // Add all existing users who aren't already in the default room
            var allUsers = await _context.Users.ToListAsync();
            var usersInRoom = await _context.UserRooms
                .Where(ur => ur.RoomId == roomId)
                .Select(ur => ur.UserId)
                .ToListAsync();

            var usersToAdd = allUsers.Where(u => !usersInRoom.Contains(u.Id)).ToList();

            if (usersToAdd.Any())
            {
                foreach (var user in usersToAdd)
                {
                    var userRoom = new UserRoomEntity
                    {
                        Id = Guid.NewGuid().ToString(),
                        UserId = user.Id,
                        RoomId = roomId,
                        JoinedAt = DateTime.UtcNow
                    };
                    _context.UserRooms.Add(userRoom);
                }

                await _context.SaveChangesAsync();
                Console.WriteLine($"✅ Added {usersToAdd.Count} existing users to '{DEFAULT_ROOM_NAME}'");
            }
        }

        public static async Task<string?> GetDefaultRoomIdAsync(AppDbContext context)
        {
            var room = await context.Rooms
                .FirstOrDefaultAsync(r => r.Name == DEFAULT_ROOM_NAME);
            return room?.Id;
        }
    }
}
