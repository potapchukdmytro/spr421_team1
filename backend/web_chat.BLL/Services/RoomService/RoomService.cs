using Microsoft.EntityFrameworkCore;
using web_chat.BLL.Dtos.Message;
using web_chat.BLL.Dtos.Room;
using web_chat.BLL.Services.MessageService;
using web_chat.DAL.Entities;
using web_chat.DAL.Repositories.RoomRepository;

namespace web_chat.BLL.Services.RoomService
{
    public class RoomService : IRoomService
    {
        private readonly IRoomRepository _roomRepository;
        private readonly IMessageService _messageService;
        
        public RoomService(IRoomRepository roomRepository, IMessageService messageService)
        {
            _roomRepository = roomRepository;
            _messageService = messageService;
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
            if(string.IsNullOrWhiteSpace(dto.CreatedById))
            {
                return new ServiceResponse
                {
                    Message = "CreatedById cannot be null or empty.",
                    StatusCode = System.Net.HttpStatusCode.BadRequest
                };
            }
            var room = new RoomEntity { 
                Id = Guid.NewGuid().ToString(),
                Name = dto.Name,
                IsPrivate = dto.IsPrivate,
                CreatedById = dto.CreatedById
            };
            await _roomRepository.CreateAsync(room);
            
            // Load the room with CreatedBy navigation property
            var createdRoom = await _roomRepository.GetAll()
                .Include(r => r.CreatedBy)
                .FirstOrDefaultAsync(r => r.Id == room.Id);
                
            var roomDto = new RoomDto
            {
                Id = createdRoom!.Id,
                Name = createdRoom.Name,
                IsPrivate = createdRoom.IsPrivate,
                CreatedById = createdRoom.CreatedById,
                CreatedByName = createdRoom.CreatedBy?.UserName ?? "Unknown"
            };
            return new ServiceResponse
            {
                Message = "Room created successfully.",
                Data = roomDto
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
                .Include(r => r.CreatedBy)
                .OrderBy(r => r.Name)
                .ToListAsync();

            List<RoomDto> roomDtos = [];

            foreach (var room in rooms)
            {
                var dto = new RoomDto
                { 
                    Id = room.Id,
                    Name = room.Name,
                    IsPrivate = room.IsPrivate,
                    CreatedById = room.CreatedById,
                    CreatedByName = room.CreatedBy?.UserName ?? "Unknown"
                };
                roomDtos.Add(dto);
            }
            return new ServiceResponse
            {
                Message = "Rooms successfully retrieved.",
                Data = roomDtos
            };
        }
        public async Task<ServiceResponse> GetRoomMessagesAsync(string roomId, string userId)
        {
            return await _messageService.GetRoomMessagesAsync(roomId, userId);
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