using System.ComponentModel.DataAnnotations;

namespace web_chat.DAL.Entities
{
    public class RoomEntity : BaseEntity
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public bool IsPrivate { get; set; } = false;

        // Navigation properties
        public virtual ICollection<MessageEntity> Messages { get; set; } = [];
        public virtual ICollection<UserRoomEntity> UserRooms { get; set; } = [];
    }
}
