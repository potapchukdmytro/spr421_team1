using Microsoft.AspNetCore.Identity;
using web_chat.DAL.Entities.Identity;
using web_chat.DAL.Settings;

namespace web_chat.DAL.Seeders
{
    public class RoleSeeder : ISeeder
    {
        private readonly RoleManager<ApplicationRole> _roleManager;

        public RoleSeeder(RoleManager<ApplicationRole> roleManager)
        {
            _roleManager = roleManager;
        }

        public async Task SeedAsync()
        {
            var roles = new[]
            {
                new { Name = RoleSettings.RoleAdmin, Description = "Administrator role with full permissions" },
                new { Name = RoleSettings.RoleUser, Description = "Regular user role" }
            };

            foreach (var roleInfo in roles)
            {
                if (!await _roleManager.RoleExistsAsync(roleInfo.Name))
                {
                    var role = new ApplicationRole 
                    { 
                        Name = roleInfo.Name,
                        NormalizedName = roleInfo.Name.ToUpper()
                    };

                    var result = await _roleManager.CreateAsync(role);
                    
                    if (result.Succeeded)
                    {
                        Console.WriteLine($"✅ Role '{roleInfo.Name}' created successfully");
                    }
                    else
                    {
                        Console.WriteLine($"❌ Failed to create role '{roleInfo.Name}': {string.Join(", ", result.Errors.Select(e => e.Description))}");
                    }
                }
                else
                {
                    Console.WriteLine($"ℹ️ Role '{roleInfo.Name}' already exists");
                }
            }
        }
    }
}