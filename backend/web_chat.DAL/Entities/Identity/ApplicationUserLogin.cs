using Microsoft.AspNetCore.Identity;
using web_chat.DAL.Entities;

namespace web_chat.DAL.Entities.Identity
{
    public class ApplicationUserLogin : IdentityUserLogin<string>
    {
        public virtual UserEntity? User { get; set; }
    }
}
