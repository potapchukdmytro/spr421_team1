namespace web_chat.DAL.Entities
{
    public class MessageEntity : BaseEntity
    {
        public required string Text { get; set; }
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        public string? UserId { get; set; }
        public UserEntity? User { get; set; }
        public string? RoomId { get; set; }
        public RoomEntity? Room { get; set; }
    }
}
