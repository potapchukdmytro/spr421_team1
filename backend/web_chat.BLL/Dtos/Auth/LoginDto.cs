using System.ComponentModel.DataAnnotations;

namespace web_chat.BLL.Dtos.Auth
{
    public class LoginDto
    {
        [Required(ErrorMessage = "Поле 'Email' є обов'язковим")]
        [EmailAddress(ErrorMessage = "Невірний формат електронної пошти")]
        public required string Email { get; set; }

        [Required(ErrorMessage = "Поле 'Password' є обов'язковим")]
        public required string Password { get; set; }
    }
}
