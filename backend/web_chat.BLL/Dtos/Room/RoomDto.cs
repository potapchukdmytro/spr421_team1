namespace web_chat.BLL.Dtos.Room
{
    public class RoomDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool IsPrivate { get; set; }
    }
}
