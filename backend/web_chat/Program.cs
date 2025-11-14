using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using web_chat.DAL;
using web_chat.DAL.Entities;
using web_chat.DAL.Entities.Identity;
using web_chat.DAL.Settings;
using web_chat.DAL.Extensions;
using web_chat.DAL.Seeders;
using web_chat.BLL.Services.Auth;
using web_chat.BLL.Settings;
using System.Text;
using web_chat.Hubs;
using web_chat.DAL.Repositories.RoomRepository;
using web_chat.DAL.Repositories.UserRoomRepository;
using web_chat.DAL.Repositories.MessageRepository;
using web_chat.BLL.Services.RoomService;
using web_chat.BLL.Services.UserRoomService;
using web_chat.BLL.Services.MessageService;
using web_chat.BLL.Services.UserService;

var builder = WebApplication.CreateBuilder(args);

// Додати служби до контейнера
builder.Services.AddControllers();

// Додати SignalR
builder.Services.AddSignalR();

// Ідентифікація (Identity)
builder.Services
    .AddIdentity<UserEntity, ApplicationRole>(options =>
    {
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireDigit = false;
        options.Password.RequiredLength = 6;
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// Налаштування
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));

// JWT-автентифікація
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtSettings>() ?? new JwtSettings();
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SecretKey ?? string.Empty));

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = key,
            ClockSkew = TimeSpan.Zero
        };

    // Для SignalR
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) &&
                    path.StartsWithSegments("/chat"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });
// Репозиторії
builder.Services.AddScoped<IUserRoomRepository, UserRoomRepository>();
builder.Services.AddScoped<IRoomRepository, RoomRepository>();
builder.Services.AddScoped<IMessageRepository, MessageRepository>();

// Користувацькі служби
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IRoomService, RoomService>();
builder.Services.AddScoped<IUserRoomService, UserRoomService>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<IUserService, UserService>();

builder.Services.AddDatabaseSeeders();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("dev", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://localhost:5174")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});


// Налаштування DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("axneo_db")); // Рядок підключення до бази даних
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Налаштування конвеєра HTTP-запитів
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("dev");

// app.UseHttpsRedirection(); // Disabled for development to allow HTTP requests

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapHub<ChatHub>("/chat");

// Застосувати міграції та засіяти (seed) базу даних
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    
    // Застосувати міграції (створить коректну схему Identity)
    if (db.Database.GetPendingMigrations().Any())
    {
        db.Database.Migrate();
    }
    
    // Спочатку ініціалізувати ролі (потрібно для реєстрації користувачів)
    var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
    await seeder.SeedAllAsync();
}

app.Run();