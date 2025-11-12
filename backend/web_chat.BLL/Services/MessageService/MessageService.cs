using web_chat.BLL.Dtos.Message;
using web_chat.BLL.Services;
using web_chat.DAL.Entities;
using web_chat.DAL.Repositories.MessageRepository;

namespace web_chat.BLL.Services.MessageService
{
    public class MessageService : IMessageService
    {
        private readonly IMessageRepository _messageRepository;

        public MessageService(IMessageRepository messageRepository)
        {
            _messageRepository = messageRepository;
        }

        public async Task<ServiceResponse> CreateMessageAsync(CreateMessageDto messageDto)
        {
            try
            {
                var messageEntity = new MessageEntity
                {
                    Text = messageDto.Text,
                    UserId = messageDto.UserId,
                    RoomId = messageDto.RoomId,
                    SentAt = DateTime.UtcNow
                };

                var createdMessage = await _messageRepository.CreateAsync(messageEntity);

                var messageResponse = new MessageDto
                {
                    Id = createdMessage.Id,
                    Text = createdMessage.Text,
                    SentAt = createdMessage.SentAt,
                    UserId = createdMessage.UserId ?? string.Empty,
                    UserName = createdMessage.User?.UserName ?? string.Empty,
                    IsMine = false // Клієнт встановлює це поле для поточного користувача
                };

                return new ServiceResponse
                {
                    IsSuccess = true,
                    Message = "Message created successfully",
                    Data = messageResponse
                };
            }
            catch (Exception ex)
            {
                return new ServiceResponse
                {
                    IsSuccess = false,
                    Message = $"Error creating message: {ex.Message}"
                };
            }
        }

        public async Task<ServiceResponse> GetRoomMessagesAsync(string roomId, string userId)
        {
            try
            {
                var messages = await _messageRepository.GetRoomMessagesAsync(roomId);

                var payload = messages.Select(m => new MessageDto
                {
                    Id = m.Id,
                    Text = m.Text,
                    SentAt = m.SentAt,
                    UserId = m.UserId ?? string.Empty,
                    UserName = m.User?.UserName ?? string.Empty,
                    IsMine = m.UserId == userId
                }).ToList();

                return new ServiceResponse
                {
                    IsSuccess = true,
                    Message = "Messages retrieved successfully",
                    Data = payload
                };
            }
            catch (Exception ex)
            {
                return new ServiceResponse
                {
                    IsSuccess = false,
                    Message = $"Error retrieving messages: {ex.Message}"
                };
            }
        }
    }
}