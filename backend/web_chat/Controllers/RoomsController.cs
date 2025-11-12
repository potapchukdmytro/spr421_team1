using Microsoft.AspNetCore.Mvc;
using web_chat.BLL.Dtos.Room;
using web_chat.BLL.Services.RoomService;

namespace web_chat.Controllers
{
    [ApiController]
    [Route("api/rooms")]
    public class RoomsController : ControllerBase
    {
        private readonly IRoomService _roomService;

        public RoomsController(IRoomService roomService)
        {
            _roomService = roomService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllRooms()
        {
            var response = await _roomService.GetAllRoomsAsync();
            return Ok(response);
        }

        [HttpGet("messages")]
        public async Task<IActionResult> GetRoomMessages([FromQuery] string roomId, [FromQuery] string userId)
        {
            var response = await _roomService.GetRoomMessagesAsync(roomId,userId);
            return Ok(response);
        }
        [HttpPut]
        public async Task<IActionResult> UpdateRoom([FromBody] UpdateRoomDto dto)
        {
            var response = await _roomService.UpdateRoomAsync(dto);
            return Ok(response);
        }
        [HttpDelete]
        public async Task<IActionResult> DeleteRoom([FromQuery] string roomId)
        {
            var response = await _roomService.DeleteRoomAsync(roomId);
            return Ok(response);
        }
        [HttpPost]
        public async Task<IActionResult> CreateRoom([FromBody] CreateRoomDto dto)
        {
            var response = await _roomService.CreateRoomAsync(dto);
            return Ok(response);
        }
        [HttpGet("by-id")]
        public async Task<IActionResult> GetRoomById([FromQuery] string roomId)
        {
            var response = await _roomService.GetRoomByIdAsync(roomId);
            return Ok(response);
        }
        [HttpGet("by-name")]
        public async Task<IActionResult> GetRoomByName([FromQuery] string roomName)
        {
            var response = await _roomService.GetRoomByNameAsync(roomName);
            return Ok(response);
        }
    }
}
