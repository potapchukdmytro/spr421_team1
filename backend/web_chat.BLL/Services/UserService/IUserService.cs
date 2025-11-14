using web_chat.BLL.Dtos.User;

namespace web_chat.BLL.Services.UserService
{
    public interface IUserService
    {
        Task<ServiceResponse> SearchUsersAsync(string query);
    }
}