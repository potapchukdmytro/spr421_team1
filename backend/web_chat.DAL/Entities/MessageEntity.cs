using System.ComponentModel.DataAnnotations;

namespace web_chat.DAL.Entities
{
    public class MessageEntity : BaseEntity
    {
        [Required]
        public string Text { get; set; } = string.Empty;

        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        // Foreign keys
        public string? UserId { get; set; }
        public string? RoomId { get; set; }

        // Navigation properties
        public virtual UserEntity? User { get; set; }
        public virtual RoomEntity? Room { get; set; }
    }
}