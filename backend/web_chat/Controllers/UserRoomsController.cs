using Microsoft.AspNetCore.Mvc;
using web_chat.BLL.Dtos.UserRoom;
using web_chat.BLL.Services.UserRoomService;

namespace web_chat.Controllers
{
    [ApiController]
    [Route("api/user-rooms")]
    public class UserRoomsController : ControllerBase
    {
        private readonly IUserRoomService _userRoomService;
        public UserRoomsController(IUserRoomService userRoomService)
        {
            _userRoomService = userRoomService;
        }
        [HttpGet("by-userId")]
        public async Task<IActionResult> GetUserRooms([FromQuery] string userId)
        {
            var response = await _userRoomService.GetUserRoomsAsync(userId);
            return Ok(response);
        }

        [HttpGet("user-room-id")]
        public async Task<IActionResult> GetUserRoomId([FromQuery] string userId, [FromQuery] string roomId)
        {
            var response = await _userRoomService.GetUserRoomIdAsync(userId, roomId);
            return Ok(response);
        }
        [HttpGet]
        public async Task<IActionResult> GetAllUserRooms()
        {
            var response = await _userRoomService.GetAllUserRoomsAsync();
            return Ok(response);
        }
        [HttpPost("join")]
        public async Task<IActionResult> JoinRoom([FromBody] CreateRoomMemberDto dto)
        {
            var response = await _userRoomService.JoinRoomAsync(dto);
            return Ok(response);
        }
        [HttpPut("update-status")]
        public async Task<IActionResult> UpdateUserStatus([FromBody] UpdateUserStatusDto dto)
        {
            var response = await _userRoomService.UpdateUserStatus(dto);
            return Ok(response);
        }
        [HttpDelete("remove-member")]
        public async Task<IActionResult> RemoveMember([FromBody] string id)
        {
            var response = await _userRoomService.RemoveMemberAsync(id);
            return Ok(response);
        }
    }
}
