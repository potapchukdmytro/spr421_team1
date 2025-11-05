using Microsoft.AspNetCore.Identity;
using web_chat.DAL.Entities;

namespace web_chat.DAL.Entities.Identity
{
    public class ApplicationUserRole : IdentityUserRole<string>
    {
        public virtual UserEntity? User { get; set; }
        public virtual ApplicationRole? Role { get; set; }
    }
}
