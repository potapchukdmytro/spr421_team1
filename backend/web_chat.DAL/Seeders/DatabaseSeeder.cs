using Microsoft.Extensions.DependencyInjection;

namespace web_chat.DAL.Seeders
{
    public class DatabaseSeeder
    {
        private readonly IServiceProvider _serviceProvider;

        public DatabaseSeeder(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public async Task SeedAllAsync()
        {
            Console.WriteLine("🌱 Starting database seeding...");

            try
            {
                // Seed roles
                using var scope = _serviceProvider.CreateScope();
                var roleSeeder = scope.ServiceProvider.GetRequiredService<RoleSeeder>();
                await roleSeeder.SeedAsync();

                Console.WriteLine("✅ Database seeding completed successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Database seeding failed: {ex.Message}");
                throw;
            }
        }
    }
}