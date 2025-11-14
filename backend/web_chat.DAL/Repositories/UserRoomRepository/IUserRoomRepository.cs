using web_chat.DAL.Entities;

namespace web_chat.DAL.Repositories.RoomRepository
{
    public interface IUserRoomRepository : IGenericRepository<UserRoomEntity>
    {
        public IQueryable<UserRoomEntity> UserRooms { get; }
        Task<List<string>> GetUserRoomsAsync(string userId);
        Task<List<RoomEntity>> GetUserRoomObjectsAsync(string userId);
        Task<bool> IsMemberAsync(UserRoomEntity entity);
        Task<string?> GetIdByUserIdRoomIdAsync(string userId,string RoomId);
    }
}
