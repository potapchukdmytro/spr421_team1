using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using web_chat.BLL.Services.UserService;
using web_chat.Extensions;

namespace web_chat.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UsersController : Controller
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchUsersAsync([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest("Query parameter is required");
            }

            var response = await _userService.SearchUsersAsync(query);
            return this.ToActionResult(response);
        }
    }
}