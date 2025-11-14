using Microsoft.Extensions.DependencyInjection;
using web_chat.DAL.Seeders;

namespace web_chat.DAL.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddDatabaseSeeders(this IServiceCollection services)
        {
            services.AddScoped<RoleSeeder>();
            services.AddScoped<DefaultRoomSeeder>();
            services.AddScoped<TestDataSeeder>();
            services.AddScoped<DatabaseSeeder>();
            
            return services;
        }
    }
}