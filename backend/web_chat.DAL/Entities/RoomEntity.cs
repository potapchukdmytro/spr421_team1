namespace web_chat.DAL.Entities
{
    public class RoomEntity : BaseEntity
    {
        public required string Name { get; set; }
        public required bool IsPrivate { get; set; }
        public ICollection<UserRoomEntity> UserRooms { get; set; } = [];
        public ICollection<MessageEntity> Messages { get; set; } = [];
    }
}
