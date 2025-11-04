namespace web_chat.DAL.Entities
{
    public class UserEntity : BaseEntity
    {
        public required string UserName { get; set; }
        public required string UserEmail { get; set; }
        public ICollection<MessageEntity> Messages { get; set; } = [];
        public ICollection<UserRoomEntity> UserRooms { get; set; } = [];
    }
}
