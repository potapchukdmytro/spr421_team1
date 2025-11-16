using web_chat.BLL.Dtos.Message;
using web_chat.BLL.Dtos.Room;
using web_chat.DAL.Entities;

namespace web_chat.BLL.Services.RoomService
{
    public interface IRoomService
    {
        public Task<ServiceResponse> CreateRoomAsync(CreateRoomDto dto);
        public Task<ServiceResponse> UpdateRoomAsync(UpdateRoomDto dto);
        public Task<ServiceResponse> DeleteRoomAsync(string roomId);
        public Task<ServiceResponse> GetAllRoomsAsync();
        public Task<ServiceResponse> GetRoomByIdAsync(string roomId);
        public Task<ServiceResponse> GetRoomByNameAsync(string roomName);
        public Task<ServiceResponse> GetRoomMessagesAsync(string roomId,string userId);
    }
}
