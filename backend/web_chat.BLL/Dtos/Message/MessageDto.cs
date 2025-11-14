namespace web_chat.BLL.Dtos.Message
{
    public class MessageDto
    {
        public string Id { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public DateTime SentAt { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public bool IsMine { get; set; } = false;
    }
}
