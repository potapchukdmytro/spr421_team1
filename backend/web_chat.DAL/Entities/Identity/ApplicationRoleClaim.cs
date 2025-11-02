using Microsoft.AspNetCore.Identity;

namespace web_chat.DAL.Entities.Identity
{
    public class ApplicationRoleClaim : IdentityRoleClaim<string>
    {
        public virtual ApplicationRole? Role { get; set; }
    }
}
