using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using web_chat.DAL;

namespace web_chat.Controllers
{
    [ApiController]
    [Route("api/rooms")]
    public class RoomsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RoomsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllRooms()
        {
            var rooms = await _context.Rooms
                .Select(r => new
                {
                    r.Id,
                    r.Name,
                    r.IsPrivate,
                    CreatedAt = r.CreatedDate
                })
                .ToListAsync();

            return Ok(rooms);
        }

        [HttpGet("{id}/messages")]
        public async Task<IActionResult> GetRoomMessages(string id)
        {
            var messages = await _context.Messages
                .Where(m => m.RoomId == id)
                .Include(m => m.User)
                .OrderBy(m => m.SentAt)
                .Select(m => new
                {
                    m.Id,
                    m.Text,
                    m.SentAt,
                    m.UserId,
                    UserName = m.User != null ? m.User.UserName : "Unknown",
                    IsMine = false // user authentication check later... 
                })
                .ToListAsync();

            return Ok(messages);
        }
    }
}
