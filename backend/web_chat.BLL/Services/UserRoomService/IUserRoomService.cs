using web_chat.BLL.Dtos.UserRoom;

namespace web_chat.BLL.Services.UserRoomService
{
    public interface IUserRoomService
    {
        public Task<ServiceResponse> JoinRoomAsync(CreateRoomMemberDto dto);
        public Task<ServiceResponse> RemoveMemberAsync(string id);
        public Task<ServiceResponse> GetUserRoomsAsync(string userId);
        public Task<ServiceResponse> GetUserRoomIdAsync(string userId, string roomId);
        public Task<ServiceResponse> UpdateUserStatus(UpdateUserStatusDto dto);
        public Task<ServiceResponse> GetAllUserRoomsAsync();
        public Task<string?> GetIdByUserIdRoomIdAsync(string userId, string roomId);
    }
}
