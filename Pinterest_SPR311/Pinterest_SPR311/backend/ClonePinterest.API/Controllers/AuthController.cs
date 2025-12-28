using ClonePinterest.API.Data;
using ClonePinterest.API.DTOs.Auth;
using ClonePinterest.API.Models;
using ClonePinterest.API.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.Extensions.Logging;

namespace ClonePinterest.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IPasswordService _passwordService;
    private readonly IJwtService _jwtService;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<AuthController> _logger;

    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
    private const long MaxFileSize = 5 * 1024 * 1024; // 5MB для аватара

    public AuthController(
        ApplicationDbContext context,
        IPasswordService passwordService,
        IJwtService jwtService,
        IWebHostEnvironment environment,
        ILogger<AuthController> logger)
    {
        _context = context;
        _passwordService = passwordService;
        _jwtService = jwtService;
        _environment = environment;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid model state for registration");
                return BadRequest(ModelState);
            }

            // Перевірка чи існує користувач з таким email
            if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email))
            {
                _logger.LogWarning("Registration attempt with existing email: {Email}", registerDto.Email);
                return BadRequest(new { message = "User with this email already exists" });
            }

            // Перевірка чи існує користувач з таким username
            if (await _context.Users.AnyAsync(u => u.Username == registerDto.Username))
            {
                _logger.LogWarning("Registration attempt with existing username: {Username}", registerDto.Username);
                return BadRequest(new { message = "User with this username already exists" });
            }

            // Створення нового користувача
            var user = new User
            {
                Email = registerDto.Email,
                Username = registerDto.Username,
                PasswordHash = _passwordService.HashPassword(registerDto.Password),
                Role = "User",
                Visibility = "Public",
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User registered successfully: {Username} (ID: {UserId})", user.Username, user.Id);

            // Генерація токену
            var token = _jwtService.GenerateToken(user);

            var response = new AuthResponseDto
            {
                Token = token,
                UserId = user.Id,
                Username = user.Username,
                Email = user.Email
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user registration");
            return StatusCode(500, new { message = "An error occurred during registration. Please try again." });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Пошук користувача за email
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == loginDto.Email);

        if (user == null || !_passwordService.VerifyPassword(loginDto.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }

        // Генерація токену
        var token = _jwtService.GenerateToken(user);

        var response = new AuthResponseDto
        {
            Token = token,
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email
        };

        return Ok(response);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        return Ok(new
        {
            Id = user.Id,
            Email = user.Email,
            Username = user.Username,
            Bio = user.Bio,
            AvatarUrl = user.AvatarUrl,
            Role = user.Role
        });
    }

    [HttpGet("google")]
    public IActionResult GoogleLogin()
    {
        return Challenge("Google");
    }

    [HttpGet("google-callback")]
    public async Task<IActionResult> GoogleCallback()
    {
        if (!User.Identity?.IsAuthenticated ?? true)
        {
            return Unauthorized(new { message = "Google authentication error" });
        }

        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var name = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
        var picture = User.FindFirst("picture")?.Value;

        if (string.IsNullOrEmpty(email))
        {
            return BadRequest(new { message = "Failed to get email from Google" });
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
        {
            var username = name ?? email.Split('@')[0];
            
            var baseUsername = username;
            var counter = 1;
            while (await _context.Users.AnyAsync(u => u.Username == username))
            {
                username = $"{baseUsername}{counter}";
                counter++;
            }

            user = new User
            {
                Email = email,
                Username = username,
                PasswordHash = string.Empty,
                AvatarUrl = picture,
                Role = "User",
                Visibility = "Public",
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }
        else
        {
            if (string.IsNullOrEmpty(user.AvatarUrl) && !string.IsNullOrEmpty(picture))
            {
                user.AvatarUrl = picture;
                await _context.SaveChangesAsync();
            }
        }

        var token = _jwtService.GenerateToken(user);

        var frontendUrl = "http://localhost:5173";
        return Redirect($"{frontendUrl}/auth/google-callback?token={token}");
    }

    [HttpPut("profile")]
    [Authorize]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UpdateProfile([FromForm] UpdateProfileDto updateProfileDto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "User not authorized" });
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            _logger.LogInformation("Updating profile for user {UserId}. Username: {Username}, Bio: {Bio}, HasAvatar: {HasAvatar}",
                userId, updateProfileDto.Username, updateProfileDto.Bio, updateProfileDto.Avatar != null);

            // Обновление username (если передан)
            if (updateProfileDto.Username != null)
            {
                var newUsername = updateProfileDto.Username.Trim();
                if (string.IsNullOrEmpty(newUsername))
                {
                    return BadRequest(new { message = "Username cannot be empty" });
                }
                
                if (newUsername != user.Username)
                {
                    // Проверяем, не занят ли username другим пользователем
                    if (await _context.Users.AnyAsync(u => u.Username == newUsername && u.Id != userId))
                    {
                        return BadRequest(new { message = "User with this username already exists" });
                    }
                    user.Username = newUsername;
                }
            }

            // Обновление bio (если передан)
            if (updateProfileDto.Bio != null)
            {
                user.Bio = updateProfileDto.Bio.Trim();
            }

            // Обработка загрузки аватара
            var avatarFile = updateProfileDto.Avatar ?? Request.Form.Files.FirstOrDefault(f => f.Name == "avatar");
            if (avatarFile != null && avatarFile.Length > 0)
            {
                // Валидация файла
                var extension = Path.GetExtension(avatarFile.FileName).ToLowerInvariant();
                if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
                {
                    return BadRequest(new { message = "Invalid file format. Allowed: jpg, jpeg, png, gif, webp" });
                }

                if (avatarFile.Length > MaxFileSize)
                {
                    return BadRequest(new { message = "File size cannot exceed 5MB" });
                }

                // Удаляем старый аватар, если он был загружен локально
                if (!string.IsNullOrEmpty(user.AvatarUrl) && user.AvatarUrl.StartsWith("/uploads/"))
                {
                    var oldFilePath = Path.Combine(_environment.ContentRootPath, "wwwroot", user.AvatarUrl.TrimStart('/'));
                    if (System.IO.File.Exists(oldFilePath))
                    {
                        try
                        {
                            System.IO.File.Delete(oldFilePath);
                        }
                        catch
                        {
                            // Игнорируем ошибки при удалении старого файла
                        }
                    }
                }

                // Создаем уникальное имя файла
                var fileName = $"avatar_{userId}_{Guid.NewGuid()}{extension}";
                var uploadsPath = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", "avatars");

                // Создаем папку если её нет
                if (!Directory.Exists(uploadsPath))
                {
                    Directory.CreateDirectory(uploadsPath);
                }

                var filePath = Path.Combine(uploadsPath, fileName);

                // Сохраняем файл
                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await avatarFile.CopyToAsync(fileStream);
                }

                    // Обновляем URL аватара
                user.AvatarUrl = $"/uploads/avatars/{fileName}";
            }
            // Если передан avatarUrl (для внешних URL) и файл не загружен, обновляем его
            else if (!string.IsNullOrEmpty(updateProfileDto.AvatarUrl))
            {
                user.AvatarUrl = updateProfileDto.AvatarUrl;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Profile updated successfully for user {UserId}", userId);

            return Ok(new
            {
                Id = user.Id,
                Email = user.Email,
                Username = user.Username,
                Bio = user.Bio,
                AvatarUrl = user.AvatarUrl,
                Role = user.Role,
                message = "Profile updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating profile for user");
            return StatusCode(500, new { message = "Error updating profile", error = ex.Message });
        }
    }
}


