using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using web_chat.BLL.Dtos.UserRoom;
using web_chat.BLL.Dtos.Room;
using web_chat.BLL.Services.RoomService;
using web_chat.BLL.Services.UserRoomService;

namespace web_chat.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IUserRoomService _userRoomService;
        private readonly IRoomService _roomService;
        public ChatHub(IUserRoomService userRoomService, IRoomService roomService)
        {
            _userRoomService = userRoomService;
            _roomService = roomService;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();

            // Можливо потім: змінювати статус користувача на "онлайн - true"

            var response = await _userRoomService.GetUserRoomsAsync(userId);
            var userRooms = response.Data as List<string> ?? new List<string>();

            foreach (var roomId in userRooms) // Під'єднуємо користувача до його кімнат
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, roomId); 
            }

            await base.OnConnectedAsync();
        }

        public async Task Send(string message, string roomId)
        {
            var userName = Context.User?.Identity?.Name;

            await Clients.Group(roomId).SendAsync("ReceiveMessage", new {userName, message});

            //todo : зберігати повідомлення в БД
        }
        public async Task SendToSome(string message, List<string> roomIds)
        {
            foreach (var roomId in roomIds)
            {
                var userName = Context.User?.Identity?.Name;
                await Clients.Group(roomId).SendAsync("ReceiveMessage", new { userName, message });
            }
        }
        public async Task CreateRoom(string roomName, bool isPrivate, List<string> userIds)
        {
            var response = await _roomService.CreateRoomAsync(new CreateRoomDto
            {
                Name = roomName,
                IsPrivate = isPrivate
            });
            var room = response.Data as RoomDto ?? new RoomDto();
            await Groups.AddToGroupAsync(Context.ConnectionId, room.Id);

            foreach (var userId in userIds)
            {
                await _userRoomService.JoinRoomAsync(new CreateRoomMemberDto
                {
                    UserId = userId,
                    RoomId = room.Id
                });
            }

            await Clients.Caller.SendAsync("RoomCreated", room.Id, room.Name);
        }
        public async Task JoinRoom(string roomId)
        {
            var userId = GetUserId();

            var userName = Context.User?.Identity?.Name;

            await _userRoomService.JoinRoomAsync(new CreateRoomMemberDto
            {
                UserId = userId,
                RoomId = roomId
            });

            await Groups.AddToGroupAsync(Context.ConnectionId,roomId);

            await Clients.Group(roomId).SendAsync("UserJoined.", new { userName, roomId, message = $"{userName} joined to the group."});
        }

        public async Task LeaveRoom(string roomId)
        {
            var userId = GetUserId();

            var userName = Context.User?.Identity?.Name;

            var userRoomId = await _userRoomService.GetIdByUserIdRoomIdAsync(userId, roomId);

            if(userRoomId == null)
            {
                throw new InvalidOperationException("User is not a member of the room.");
            }

            await _userRoomService.RemoveMemberAsync(userRoomId);

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);

            await Clients.Group(roomId).SendAsync("UserLeft", new { userName, roomId, message = $"{userName} left the group." });
        }
        public async Task DeleteRoom(string roomId)
        {
            await _roomService.DeleteRoomAsync(roomId);

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);

            await Clients.Group(roomId).SendAsync("RoomDeleted", roomId);
        }
        private string GetUserId()
        {
            var userId = Context.User?.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthorizedAccessException("User ID not found in claims.");
            }
            return userId;
        }
    }
}
