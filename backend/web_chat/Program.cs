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

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Identity
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

// Settings
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));

// JWT Auth
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

        // Allow SignalR to get JWT token from query string
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

// Custom services
builder.Services.AddScoped<IAuthService, AuthService>();

// Room management services
builder.Services.AddScoped<web_chat.BLL.Services.RoomService.IRoomService, web_chat.BLL.Services.RoomService.RoomService>();
builder.Services.AddScoped<web_chat.DAL.Repositories.RoomRepository.IRoomRepository, web_chat.DAL.Repositories.RoomRepository.RoomRepository>();
builder.Services.AddScoped<web_chat.BLL.Services.UserRoomService.IUserRoomService, web_chat.BLL.Services.UserRoomService.UserRoomService>();
builder.Services.AddScoped<web_chat.DAL.Repositories.RoomRepository.IUserRoomRepository, web_chat.DAL.Repositories.UserRoomRepository.UserRoomRepository>();

// Add database seeders
builder.Services.AddDatabaseSeeders();

// SignalR
builder.Services.AddSignalR();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("dev", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "https://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle


// DbContext - THIS IS THE CORRECT, SINGLE ENTRY
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("hosted_db3"));
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("dev");

// Disable HTTPS redirection in development to avoid CORS issues
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseWebSockets();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<web_chat.Hubs.ChatHub>("/hubs/chat");

// Apply pending migrations and seed database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    
    // Apply migrations (proper Identity schema)
    if (db.Database.GetPendingMigrations().Any())
    {
        db.Database.Migrate();
    }
    
    // Seed roles FIRST (required for user registration) 
    var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
    await seeder.SeedAllAsync();
    
    // Seed test data (one room with messages)
    var testSeeder = scope.ServiceProvider.GetRequiredService<TestDataSeeder>();
    await testSeeder.SeedAsync();
}

app.Run();