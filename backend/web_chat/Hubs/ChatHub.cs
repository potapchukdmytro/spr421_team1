using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using web_chat.BLL.Dtos.UserRoom;
using web_chat.BLL.Dtos.Room;
using web_chat.BLL.Dtos.Message;
using web_chat.BLL.Services.RoomService;
using web_chat.BLL.Services.UserRoomService;
using web_chat.BLL.Services.MessageService;

namespace web_chat.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IUserRoomService _userRoomService;
        private readonly IRoomService _roomService;
        private readonly IMessageService _messageService;
        
        public ChatHub(IUserRoomService userRoomService, IRoomService roomService, IMessageService messageService)
        {
            _userRoomService = userRoomService;
            _roomService = roomService;
            _messageService = messageService;
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
            var userId = GetUserId();
            var userName = Context.User?.Identity?.Name;

            // Базова валідація
            if (string.IsNullOrWhiteSpace(message))
            {
                await Clients.Caller.SendAsync("MessageError", new { roomId, error = "Message cannot be empty." });
                return;
            }
            if (message.Length > 1000)
            {
                await Clients.Caller.SendAsync("MessageError", new { roomId, error = "Message is too long (max 1000 characters)." });
                return;
            }

            // Перевірка членства користувача в кімнаті
            var membershipId = await _userRoomService.GetIdByUserIdRoomIdAsync(userId, roomId);
            if (membershipId is null)
            {
                await Clients.Caller.SendAsync("MessageError", new { roomId, error = "You are not a member of this room." });
                return;
            }

            // Збереження повідомлення в БД
            var createMessageDto = new CreateMessageDto
            {
                Text = message,
                UserId = userId,
                RoomId = roomId
            };

            var saveResult = await _messageService.CreateMessageAsync(createMessageDto);

            if (saveResult.IsSuccess)
            {
                var savedMessage = saveResult.Data as MessageDto;

                // Надсилаємо повідомлення з додатковою інформацією всім клієнтам у кімнаті
                await Clients.Group(roomId).SendAsync("ReceiveMessage", new
                {
                    id = savedMessage?.Id,
                    userName = userName,
                    message = message,
                    sentAt = savedMessage?.SentAt,
                    userId = userId
                });
            }
            else
            {
                // Якщо збереження не вдалося, надсилаємо помилку лише відправнику
                await Clients.Caller.SendAsync("MessageError", new { roomId, error = saveResult.Message });
            }
        }
        public async Task SendToSome(string message, List<string> roomIds)
        {
            var userId = GetUserId();
            var userName = Context.User?.Identity?.Name;

            // Базова валідація
            if (string.IsNullOrWhiteSpace(message))
            {
                await Clients.Caller.SendAsync("MessageError", new { error = "Message cannot be empty." });
                return;
            }
            if (message.Length > 1000)
            {
                await Clients.Caller.SendAsync("MessageError", new { error = "Message is too long (max 1000 characters)." });
                return;
            }

            foreach (var roomId in roomIds)
            {
                // Перевірка членства користувача в кімнаті
                var membershipId = await _userRoomService.GetIdByUserIdRoomIdAsync(userId, roomId);
                if (membershipId is null)
                {
                    await Clients.Caller.SendAsync("MessageError", new { roomId, error = "You are not a member of this room." });
                    continue;
                }

                // Збереження повідомлення в БД для кожної кімнати
                var createMessageDto = new CreateMessageDto
                {
                    Text = message,
                    UserId = userId,
                    RoomId = roomId
                };

                var saveResult = await _messageService.CreateMessageAsync(createMessageDto);

                if (saveResult.IsSuccess)
                {
                    var savedMessage = saveResult.Data as MessageDto;

                    await Clients.Group(roomId).SendAsync("ReceiveMessage", new
                    {
                        id = savedMessage?.Id,
                        userName = userName,
                        message = message,
                        sentAt = savedMessage?.SentAt,
                        userId = userId
                    });
                }
                else
                {
                    await Clients.Caller.SendAsync("MessageError", new { roomId, error = saveResult.Message });
                }
            }
        }
        public async Task CreateRoom(string roomName, bool isPrivate, List<string> userIds)
        {
            var userId = GetUserId();
            var response = await _roomService.CreateRoomAsync(new CreateRoomDto
            {
                Name = roomName,
                IsPrivate = isPrivate,
                CreatedById = userId
            });
            var room = response.Data as RoomDto ?? new RoomDto();
            await Groups.AddToGroupAsync(Context.ConnectionId, room.Id);

            // Add the creator to the room first
            await _userRoomService.JoinRoomAsync(new CreateRoomMemberDto
            {
                UserId = userId,
                RoomId = room.Id
            });

            // Then add the invited users
            foreach (var memberUserId in userIds)
            {
                await _userRoomService.JoinRoomAsync(new CreateRoomMemberDto
                {
                    UserId = memberUserId,
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

        public async Task AddUserToRoom(string userId, string roomId)
        {
            // Check if the current user has permission to add users to this room
            var currentUserId = GetUserId();
            
            // Verify the room exists and current user is the creator or admin
            var roomResponse = await _roomService.GetRoomByIdAsync(roomId);
            if (!roomResponse.IsSuccess || roomResponse.Data == null)
            {
                await Clients.Caller.SendAsync("AddUserError", new { error = "Room not found" });
                return;
            }
            
            var room = roomResponse.Data as RoomDto;
            if (room == null || room.CreatedById != currentUserId)
            {
                await Clients.Caller.SendAsync("AddUserError", new { error = "Only room creator can add users" });
                return;
            }

            // Add the user to the room
            await _userRoomService.JoinRoomAsync(new CreateRoomMemberDto
            {
                UserId = userId,
                RoomId = roomId
            });

            // Notify the added user to refresh their rooms list
            // Send to all clients - the frontend will filter by user ID
            await Clients.All.SendAsync("RoomAdded", new { userId, roomId, roomName = room.Name });

            await Clients.Caller.SendAsync("UserAddedToRoom", new { userId, roomId, roomName = room.Name });
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
