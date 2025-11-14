using System.ComponentModel.DataAnnotations;

namespace web_chat.BLL.Dtos.Room
{
    public class CreateRoomDto
    {
        [Required(ErrorMessage = "Ім'я кімнати є обов'язковим")]
        public string? Name { get; set; }
        public bool IsPrivate { get; set; } = false;
        [Required(ErrorMessage = "ID творця є обов'язковим")]
        public string? CreatedById { get; set; }
    }
}
