using System.Net;
using web_chat.BLL.Dtos.UserRoom;
using web_chat.BLL.Dtos.Room;
using web_chat.DAL.Entities;
using web_chat.DAL.Repositories.RoomRepository;
using Microsoft.EntityFrameworkCore;

namespace web_chat.BLL.Services.UserRoomService
{
    public class UserRoomService : IUserRoomService
    {
        private readonly IUserRoomRepository _userRoomRepository;
        public UserRoomService(IUserRoomRepository userRoomRepository)
        {
            _userRoomRepository = userRoomRepository;
        }
        public async Task<ServiceResponse> JoinRoomAsync(CreateRoomMemberDto dto)
        {
            var userRooom = new UserRoomEntity
            {
                UserId = dto.UserId,
                RoomId = dto.RoomId
            };

            if (!await _userRoomRepository.IsMemberAsync(userRooom))
            {
                await _userRoomRepository.CreateAsync(userRooom);
                return new ServiceResponse
                {
                    Message = "User added to room successfully."
                };
            }
            return new ServiceResponse
            {
                Message = "User is already a member of the room.",
                StatusCode = HttpStatusCode.BadRequest
            };
        }
        public async Task<ServiceResponse> GetUserRoomsAsync(string userId)
        {
            var roomIds = await _userRoomRepository.GetUserRoomsAsync(userId);
            var rooms = await _userRoomRepository.GetUserRoomObjectsAsync(userId);
            
            var roomDtos = rooms.Select(r => new RoomDto
            {
                Id = r.Id,
                Name = r.Name,
                IsPrivate = r.IsPrivate,
                CreatedById = r.CreatedById,
                CreatedByName = r.CreatedBy?.UserName ?? "Unknown"
            }).ToList();
            
            return new ServiceResponse
            {
                Message = "User rooms retrieved successfully.",
                Data = roomDtos
            };  
        }
        public async Task<ServiceResponse> GetUserRoomIdAsync(string userId, string roomId)
        {
            var userRoomId = await _userRoomRepository.GetIdByUserIdRoomIdAsync(userId, roomId);
            return new ServiceResponse
            {
                Message = "User room ID retrieved successfully.",
                Data = userRoomId
            };
        }

        public async Task<ServiceResponse> RemoveMemberAsync(string id)
        {
            var userRoom = await _userRoomRepository.GetByIdAsync(id);
            if (userRoom == null)
            {
                return new ServiceResponse
                {
                    Message = "UserRoom not found.",
                    StatusCode = HttpStatusCode.NotFound
                };
            }

            // Check if user is the room creator
            var room = await _userRoomRepository.UserRooms
                .Where(ur => ur.Id == id)
                .Include(ur => ur.Room)
                .Select(ur => ur.Room)
                .FirstOrDefaultAsync();

            if (room != null && room.CreatedById == userRoom.UserId)
            {
                return new ServiceResponse
                {
                    Message = "Room creators cannot leave their own rooms. Use delete instead.",
                    StatusCode = HttpStatusCode.BadRequest
                };
            }

            if (await _userRoomRepository.IsMemberAsync(userRoom))
            {
                await _userRoomRepository.DeleteAsync(userRoom);
                return new ServiceResponse
                {
                    Message = "User removed from room successfully."
                };
            }
            return new ServiceResponse
            {
                Message = "User is not a member of the room.",
                StatusCode = HttpStatusCode.BadRequest
            };
        }

        public async Task<ServiceResponse> UpdateUserStatus(UpdateUserStatusDto dto)
        {
            var userRoom = new UserRoomEntity
            {
                Id = dto.Id,
                UserId = dto.UserId,
                RoomId = dto.RoomId,
                IsAdmin = dto.IsAdmin,
                IsBanned = dto.IsBanned
            };
            await _userRoomRepository.UpdateAsync(userRoom);
            return new ServiceResponse
            {
                Message = "User status updated successfully."
            };
        }

        public async Task<ServiceResponse> GetAllUserRoomsAsync()
        {
            return new ServiceResponse
            {
                Message = "Rooms successfully retrieved.",
                Data = await _userRoomRepository.UserRooms
                .OrderBy(ur => ur.JoinedAt) // Сортування по даті приєднання
                .ToListAsync()
            };
        }
        public async Task<string?> GetIdByUserIdRoomIdAsync(string userId, string roomId)
        {
            return await _userRoomRepository.GetIdByUserIdRoomIdAsync(userId, roomId);
        }
    }
}
