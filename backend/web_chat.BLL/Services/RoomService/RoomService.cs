using Microsoft.EntityFrameworkCore;
using web_chat.BLL.Dtos.Message;
using web_chat.BLL.Dtos.Room;
using web_chat.DAL.Entities;
using web_chat.DAL.Repositories.RoomRepository;

namespace web_chat.BLL.Services.RoomService
{
    public class RoomService : IRoomService
    {
        private readonly IRoomRepository _roomRepository;
        public RoomService(IRoomRepository roomRepository)
        {
            _roomRepository = roomRepository;
        }
        public async Task<ServiceResponse> CreateRoomAsync(CreateRoomDto dto)
        {
            if(string.IsNullOrWhiteSpace(dto.Name))
            {
                return new ServiceResponse
                {
                    Message = "Room name cannot be null or empty.",
                    StatusCode = System.Net.HttpStatusCode.BadRequest
                };
            }
            var room = new RoomEntity { 
                Id = Guid.NewGuid().ToString(),
                Name = dto.Name,
                IsPrivate = dto.IsPrivate
            };
            await _roomRepository.CreateAsync(room);
            return new ServiceResponse
            {
                Message = "Room created successfully.",
                Payload = room,
                Data = room
            };
        }
        public async Task<ServiceResponse> UpdateRoomAsync(UpdateRoomDto dto)
        {
            if(string.IsNullOrWhiteSpace(dto.Name) || dto.Id == null)
            {
                return new ServiceResponse
                {
                    Message = "Room name or id cannot be null or empty.",
                    StatusCode = System.Net.HttpStatusCode.BadRequest
                };
            }
            var room = await _roomRepository.GetByIdAsync(dto.Id);
            if(room == null)
            {
                return new ServiceResponse
                {
                    Message = "Room not found.",
                    StatusCode = System.Net.HttpStatusCode.NotFound
                };
            }
            room.Name = dto.Name;
            await _roomRepository.UpdateAsync(room);
            return new ServiceResponse
            {
                Message = "Room updated successfully."
            };
        }
        public async Task<ServiceResponse> DeleteRoomAsync(string roomId)
        {
            var room = await _roomRepository.GetByIdAsync(roomId);
            if(room == null)
            {
                throw new InvalidOperationException("Room not found.");
            }
            await _roomRepository.DeleteAsync(room);
            return new ServiceResponse
            {
                Message = "Room deleted successfully."
            };
        }
        public async Task<ServiceResponse> GetAllRoomsAsync()
        {
            var rooms= await _roomRepository.Rooms
                .OrderBy(r => r.Name)
                .ToListAsync();

            List<RoomDto> roomDtos = [];

            foreach (var room in rooms)
            {
                var dto = new RoomDto
                { 
                    Id = room.Id,
                    Name = room.Name,
                    IsPrivate = room.IsPrivate
                };
                roomDtos.Add(dto);
            }
            return new ServiceResponse
            {
                Message = "Rooms successfully retrieved.",
                Payload = roomDtos,
                Data = roomDtos
            };
        }
        public async Task<ServiceResponse> GetRoomMessagesAsync(string roomId,string userId)
        {
            var messages = await _roomRepository.GetRoomMessagesAsync(roomId);
            var payload = messages.Select(m => new MessageDto
            {
                Id = m.Id,
                Text = m.Text,
                SentAt = m.SentAt,
                UserId = m.UserId!,
                UserName = m.User?.UserName!,
                IsMine = m.UserId == userId
            }).ToList();
            return new ServiceResponse
            {
                Message = "Messages successfully retrieved.",
                Payload = payload,
                Data = payload
            };
        }

        public async Task<ServiceResponse> GetRoomByIdAsync(string roomId)
        {
            if(roomId == null)
            {
                return new ServiceResponse
                {
                    Message = "Room id cannot be null.",
                    StatusCode = System.Net.HttpStatusCode.BadRequest
                };
            }
            var room = await _roomRepository.GetByIdAsync(roomId);
            if(room == null)
            {
                return new ServiceResponse
                {
                    Message = "Room not found.",
                    StatusCode = System.Net.HttpStatusCode.NotFound
                };
            }
            return new ServiceResponse
            {
                Message = "Room retrieved successfully.",
                Data = new RoomDto
                {
                    Id = room.Id,
                    Name = room.Name,
                    IsPrivate = room.IsPrivate
                }
            };
        }

        public async Task<ServiceResponse> GetRoomByNameAsync(string roomName)
        {
            if(string.IsNullOrEmpty(roomName))
            {
                return new ServiceResponse
                {
                    Message = "Room name cannot be null or empty.",
                    StatusCode = System.Net.HttpStatusCode.BadRequest
                };
            }
            return new ServiceResponse
            {
                Message = "Room retrieved successfully.",
                Data = await _roomRepository.GetByNameAsync(roomName)
            };
        }
    }
}