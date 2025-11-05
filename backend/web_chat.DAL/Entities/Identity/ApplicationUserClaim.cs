using Microsoft.AspNetCore.Identity;
using web_chat.DAL.Entities;

namespace web_chat.DAL.Entities.Identity
{
    public class ApplicationUserClaim : IdentityUserClaim<string>
    {
        public virtual UserEntity? User { get; set; }
    }
}
