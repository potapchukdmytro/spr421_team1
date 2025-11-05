using web_chat.BLL.Dtos.Auth;

namespace web_chat.BLL.Services.Auth
{
    public interface IAuthService
    {
        Task<ServiceResponse> LoginAsync(LoginDto dto); 
        Task<ServiceResponse> RegisterAsync(RegisterDto dto);
    }
}
