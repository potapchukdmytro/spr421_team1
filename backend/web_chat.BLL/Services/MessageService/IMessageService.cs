using web_chat.BLL.Dtos.Message;
using web_chat.BLL.Services;

namespace web_chat.BLL.Services.MessageService
{
    public interface IMessageService
    {
        Task<ServiceResponse> CreateMessageAsync(CreateMessageDto messageDto);
        Task<ServiceResponse> GetRoomMessagesAsync(string roomId, string userId);
    }
}