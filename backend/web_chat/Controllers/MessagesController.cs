using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using web_chat.BLL.Services.MessageService;
using web_chat.BLL.Services.UserRoomService;

namespace web_chat.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/messages")]
    // УВАГА: Цей контролер містить ТЕСТОВІ HTTP-ендпоїнти для локальної перевірки скриптом
    // backend/scripts/e2e_http_test.py. Не призначено для продакшену — за потреби
    // обмежте доступ, приберіть маршрути або захистіть їх окремою політикою.
    public class MessagesController : ControllerBase
    {
        private readonly IMessageService _messageService;
        private readonly IUserRoomService _userRoomService;

        public MessagesController(IMessageService messageService, IUserRoomService userRoomService)
        {
            _messageService = messageService;
            _userRoomService = userRoomService;
        }

        // ТЕСТОВИЙ маршрут: отримати історію повідомлень кімнати.
        // Використовується локальним скриптом e2e_http_test.py
        [HttpGet("room/{roomId}")]
        public async Task<IActionResult> GetRoomMessages(string roomId)
        {
            var userId = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User ID not found in token." });
            }

            var response = await _messageService.GetRoomMessagesAsync(roomId, userId);
            return Ok(response);
        }

        public class SendMessageRequest
        {
            public string RoomId { get; set; } = string.Empty;
            public string Text { get; set; } = string.Empty;
        }

        // ТЕСТОВИЙ маршрут: відправити повідомлення через HTTP.
        // Використовується локальним скриптом e2e_http_test.py
        [HttpPost]
        public async Task<IActionResult> Send([FromBody] SendMessageRequest request)
        {
            var userId = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User ID not found in token." });
            }

            // Basic validation
            if (string.IsNullOrWhiteSpace(request.Text))
            {
                return BadRequest(new { message = "Message cannot be empty." });
            }
            if (request.Text.Length > 1000)
            {
                return BadRequest(new { message = "Message is too long (max 1000 characters)." });
            }

            // Membership check
            var membershipId = await _userRoomService.GetIdByUserIdRoomIdAsync(userId, request.RoomId);
            if (membershipId is null)
            {
                return Forbid();
            }

            var result = await _messageService.CreateMessageAsync(new web_chat.BLL.Dtos.Message.CreateMessageDto
            {
                RoomId = request.RoomId,
                Text = request.Text,
                UserId = userId
            });

            return Ok(result);
        }
    }
}