using Microsoft.EntityFrameworkCore;
using web_chat.DAL.Entities;
using web_chat.DAL.Repositories.RoomRepository;

namespace web_chat.DAL.Repositories.UserRoomRepository
{
    public class UserRoomRepository
        : GenericRepository<UserRoomEntity>, IUserRoomRepository
    {
        public UserRoomRepository(AppDbContext context)
            : base(context){ }

        public IQueryable<UserRoomEntity> UserRooms => GetAll();

        public async Task<string?> GetIdByUserIdRoomIdAsync(string userId, string RoomId)
        {
            return await UserRooms
                .Where(ur => ur.UserId == userId && ur.RoomId == RoomId)
                .Select(ur => ur.Id)
                .FirstOrDefaultAsync();
        }
        public async Task<List<string>> GetUserRoomsAsync(string userId)
        {
            return await UserRooms
                .Where(ur => ur.UserId == userId)
                .Select(ur => ur.RoomId)
                .ToListAsync();
        }
        public async Task<List<RoomEntity>> GetUserRoomObjectsAsync(string userId)
        {
            return await UserRooms
                .Where(ur => ur.UserId == userId)
                .Include(ur => ur.Room)
                .ThenInclude(r => r.CreatedBy)
                .Select(ur => ur.Room)
                .ToListAsync();
        }
        public async Task<bool> IsMemberAsync(UserRoomEntity entity)
        {
            return await UserRooms
                .AnyAsync(ur => ur.UserId == entity.UserId && ur.RoomId == entity.RoomId);
        }
    }
}
