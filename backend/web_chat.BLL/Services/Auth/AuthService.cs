using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using web_chat.BLL.Dtos.Auth;
using web_chat.BLL.Settings;
using web_chat.DAL.Entities;
using web_chat.DAL.Settings;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Text;

namespace web_chat.BLL.Services.Auth
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<UserEntity> _userManager;
        private readonly JwtSettings _jwtSettings;

        public AuthService(UserManager<UserEntity> userManager, IOptions<JwtSettings> jwtOptions)
        {
            _userManager = userManager;
            _jwtSettings = jwtOptions.Value;
        }

        public async Task<ServiceResponse> LoginAsync(LoginDto dto)
        {
            var user = await GetByLoginAsync(dto.Email);

            if(user == null)
            {
                return new ServiceResponse
                {
                    IsSuccess = false,
                    StatusCode = HttpStatusCode.BadRequest,
                    Message = "Логін вказано невірно"
                };
            }

            bool passwordResult = await _userManager.CheckPasswordAsync(user, dto.Password);

            if(!passwordResult)
            {
                return new ServiceResponse
                {
                    IsSuccess = false,
                    StatusCode = HttpStatusCode.BadRequest,
                    Message = "Пароль вказано невірно"
                };
            }

            string token = await GenerateJwtTokenAsync(user);

            return new ServiceResponse
            {
                Message = "Успішний вхід",
                Payload = token
            };
        }

        public async Task<ServiceResponse> RegisterAsync(RegisterDto dto)
        {
            var existing = await _userManager.Users
                .FirstOrDefaultAsync(u => u.NormalizedEmail == dto.Email.ToUpper() || u.NormalizedUserName == dto.UserName.ToUpper());

            if (existing != null)
            {
                return new ServiceResponse
                {
                    IsSuccess = false,
                    StatusCode = HttpStatusCode.BadRequest,
                    Message = "Користувач із таким email або логіном вже існує"
                };
            }

            var user = new UserEntity
            {
                UserName = dto.UserName,
                Email = dto.Email,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                return new ServiceResponse
                {
                    IsSuccess = false,
                    StatusCode = HttpStatusCode.BadRequest,
                    Message = errors
                };
            }

            await _userManager.AddToRoleAsync(user, RoleSettings.RoleUser);

            string token = await GenerateJwtTokenAsync(user);
            return new ServiceResponse
            {
                Message = "Користувача створено",
                Payload = token
            };
        }

        private async Task<UserEntity?> GetByLoginAsync(string login)
        {
            return await _userManager.Users
                .FirstOrDefaultAsync(u => u.NormalizedEmail == login.ToUpper()
                || u.NormalizedUserName == login.ToUpper());
        }

        private async Task<string> GenerateJwtTokenAsync(UserEntity user)
        {
            var claims = new List<Claim>
            {
                new Claim("id", user.Id!),
                new Claim("userName", user.UserName!),
                new Claim("email", user.Email!),

                new Claim(ClaimTypes.Name, user.UserName!), // для ChatHub
            };

            var userRoles = await _userManager.GetRolesAsync(user);
            
            if(userRoles.Count == 0)
            {
                userRoles.Add(RoleSettings.RoleUser);
            }

            var roleClaims = userRoles.Select(r => new Claim("roles", r));
            claims.AddRange(roleClaims);

            var secretKey = _jwtSettings.SecretKey;

            if(string.IsNullOrEmpty(secretKey))
            {
                throw new ArgumentNullException(nameof(secretKey));
            }

            var signInKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(signInKey, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                audience: _jwtSettings.Audience,
                issuer: _jwtSettings.Issuer,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(_jwtSettings.ExpireHours),
                signingCredentials: credentials
                );

            var handler = new JwtSecurityTokenHandler();
            return handler.WriteToken(token);
        }
    }
}
