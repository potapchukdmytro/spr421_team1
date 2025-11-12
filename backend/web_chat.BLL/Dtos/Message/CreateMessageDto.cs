using System.ComponentModel.DataAnnotations;

namespace web_chat.BLL.Dtos.Message
{
    public class CreateMessageDto
    {
        [Required]
        [MaxLength(1000)]
        public string Text { get; set; } = string.Empty;

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public string RoomId { get; set; } = string.Empty;
    }
}