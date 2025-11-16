using System.Net;
using web_chat.BLL.Dtos.UserRoom;
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
            return new ServiceResponse
            {
                Message = "User rooms retrieved successfully.",
                Data = await _userRoomRepository.GetUserRoomsAsync(userId)
            };  
        }
        public async Task<ServiceResponse> RemoveMemberAsync(string id)
        {
            var userRoom = await _userRoomRepository.GetByIdAsync(id);
            if (userRoom == null) {
                return new ServiceResponse
                {
                    Message = "UserRoom not found.",
                    StatusCode = HttpStatusCode.NotFound
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
