using System.ComponentModel.DataAnnotations;

namespace web_chat.BLL.Dtos.Room
{
    public class UpdateRoomDto
    {
        [Required]
        public string? Id { get; set; } 
        [Required]
        public string? Name { get; set; }
    }
}
