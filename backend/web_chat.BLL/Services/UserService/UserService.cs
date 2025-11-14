using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using web_chat.BLL.Dtos.User;
using web_chat.DAL.Entities;
using System.Net;

namespace web_chat.BLL.Services.UserService
{
    public class UserService : IUserService
    {
        private readonly UserManager<UserEntity> _userManager;

        public UserService(UserManager<UserEntity> userManager)
        {
            _userManager = userManager;
        }

        public async Task<ServiceResponse> SearchUsersAsync(string query)
        {
            try
            {
                var lowerQuery = query.ToLower();
                var users = await _userManager.Users
                    .Where(u => u.UserName.ToLower().Contains(lowerQuery) || u.Email.ToLower().Contains(lowerQuery))
                    .Select(u => new UserDto
                    {
                        Id = u.Id,
                        UserName = u.UserName,
                        Email = u.Email,
                        CreatedDate = u.CreatedDate
                    })
                    .ToListAsync();

                return new ServiceResponse
                {
                    IsSuccess = true,
                    StatusCode = HttpStatusCode.OK,
                    Data = users
                };
            }
            catch (Exception ex)
            {
                return new ServiceResponse
                {
                    IsSuccess = false,
                    StatusCode = HttpStatusCode.InternalServerError,
                    Message = $"Помилка при пошуку користувачів: {ex.Message}"
                };
            }
        }
    }
}