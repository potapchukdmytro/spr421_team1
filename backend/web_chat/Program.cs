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

// DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
{
    // NOTE TO BACKEND TEAM: Switch back to "axneo_db" for your local testing
    // Currently using "DefaultDb" for main development
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultDb"));
    //options.UseNpgsql(builder.Configuration.GetConnectionString("axneo_db")); // for backend team testing, uncomment if needed
});

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
    });

// Custom services
builder.Services.AddScoped<IAuthService, AuthService>();

// Add database seeders
builder.Services.AddDatabaseSeeders();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("dev", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173", "http://localhost:5174")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle


// DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultDb"));
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

app.UseHttpsRedirection();

app.UseCors("dev");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Apply pending migrations and seed database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    
    // Apply migrations (this will create proper Identity schema)
    if (db.Database.GetPendingMigrations().Any())
    {
        db.Database.Migrate();
    }
    
    // Seed test data (one room with messages)
    var testSeeder = scope.ServiceProvider.GetRequiredService<TestDataSeeder>();
    await testSeeder.SeedAsync();
    
    // Seed database
    // var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
    // await seeder.SeedAllAsync();
}

app.Run();