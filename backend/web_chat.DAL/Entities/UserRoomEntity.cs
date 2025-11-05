using System.ComponentModel.DataAnnotations;

namespace web_chat.DAL.Entities
{
    public class UserRoomEntity : BaseEntity
    {
        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public string RoomId { get; set; } = string.Empty;

        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        public bool IsAdmin { get; set; } = false;
        public bool IsBanned { get; set; } = false;

        // Navigation properties
        public virtual UserEntity User { get; set; } = null!;
        public virtual RoomEntity Room { get; set; } = null!;
    }
}
