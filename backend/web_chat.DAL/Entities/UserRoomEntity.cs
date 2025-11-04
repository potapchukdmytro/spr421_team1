namespace web_chat.DAL.Entities
{
    public class UserRoomEntity : BaseEntity
    {
        public required DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        public required bool IsAdmin { get; set; }
        public required bool IsBanned { get; set; }

        public string? UserId { get; set; }
        public UserEntity? User { get; set; }
        public string? RoomId { get; set; }
        public RoomEntity? Room { get; set; }
    }
}
