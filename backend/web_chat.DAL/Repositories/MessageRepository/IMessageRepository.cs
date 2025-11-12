using web_chat.DAL.Entities;

namespace web_chat.DAL.Repositories.MessageRepository
{
    public interface IMessageRepository
    {
        Task<MessageEntity> CreateAsync(MessageEntity message);
        Task<List<MessageEntity>> GetRoomMessagesAsync(string roomId);
    }
}