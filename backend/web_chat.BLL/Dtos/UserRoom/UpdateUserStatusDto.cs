namespace web_chat.BLL.Dtos.UserRoom
{
    public class UpdateUserStatusDto
    {
        public string Id { get; set; } = null!;
        public string UserId { get; set; } = null!;
        public string RoomId { get; set; } = null!;
        public bool IsAdmin { get; set; } = false;
        public bool IsBanned { get; set; } = false;
    }
}
