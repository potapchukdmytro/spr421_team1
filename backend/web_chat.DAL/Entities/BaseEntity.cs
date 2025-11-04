namespace web_chat.DAL.Entities
{
    public interface IBaseEntity
    {
        string Id { get; set; }
        DateTime CreatedDate { get; set; }
    }
    public class BaseEntity : IBaseEntity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }
}
