using Microsoft.EntityFrameworkCore;
using web_chat.DAL.Entities;

namespace web_chat.DAL.Repositories.MessageRepository
{
    public class MessageRepository : IMessageRepository
    {
        private readonly AppDbContext _context;

        public MessageRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<MessageEntity> CreateAsync(MessageEntity message)
        {
            _context.Messages.Add(message);
            await _context.SaveChangesAsync();
            
            // Завантажити інформацію про користувача для створеного повідомлення
            return await _context.Messages
                .Include(m => m.User)
                .Include(m => m.Room)
                .FirstAsync(m => m.Id == message.Id);
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