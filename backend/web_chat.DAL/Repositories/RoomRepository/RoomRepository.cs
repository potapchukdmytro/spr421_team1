using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using web_chat.DAL.Entities;
using Microsoft.EntityFrameworkCore;

namespace web_chat.DAL.Repositories.RoomRepository
{
    public class RoomRepository : GenericRepository<RoomEntity>, IRoomRepository
    {
        public RoomRepository(AppDbContext context) 
            : base(context) { }
        public IQueryable<RoomEntity> Rooms => GetAll();

        public async Task<RoomEntity?> GetByNameAsync(string roomName)
        {
            return await _context.Rooms
                .FirstOrDefaultAsync(r => r.Name == roomName);
        }

        public async Task<List<MessageEntity>> GetRoomMessagesAsync(string roomId)
        {
            return await _context.Messages
                .Where(m => m.RoomId == roomId)
                .Include(m => m.User)
                .OrderBy(m => m.SentAt)
                .ToListAsync();
        }
    }
}
