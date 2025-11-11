using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using web_chat.DAL.Entities;

namespace web_chat.DAL.Repositories.RoomRepository
{
    public interface IRoomRepository : IGenericRepository<RoomEntity>
    {
        IQueryable<RoomEntity> Rooms { get; }
        public Task<List<MessageEntity>> GetRoomMessagesAsync(string roomId);
        public Task<RoomEntity?> GetByNameAsync(string roomName);
    }
}
