using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using web_chat.DAL.Entities.Identity;

namespace web_chat.DAL.Entities
{
    public class UserEntity : IdentityUser
    {
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

    // Навігаційні властивості для функціоналу чату
        public virtual ICollection<MessageEntity> Messages { get; set; } = [];
        public virtual ICollection<UserRoomEntity> UserRooms { get; set; } = [];
        
    // Навігаційні властивості Identity
        public virtual ICollection<ApplicationUserClaim> Claims { get; set; } = [];
        public virtual ICollection<ApplicationUserLogin> Logins { get; set; } = [];
        public virtual ICollection<ApplicationUserToken> Tokens { get; set; } = [];
        public virtual ICollection<ApplicationUserRole> UserRoles { get; set; } = [];
    }
}
