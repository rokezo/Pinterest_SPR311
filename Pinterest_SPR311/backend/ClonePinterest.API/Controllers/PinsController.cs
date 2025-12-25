using ClonePinterest.API.Data;
using ClonePinterest.API.DTOs.Pin;
using ClonePinterest.API.Models;
using ClonePinterest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp;
using System.Security.Claims;

namespace ClonePinterest.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PinsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<PinsController> _logger;
    private readonly IPinterestService _pinterestService;

    // Дозволені формати зображень
    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB

    public PinsController(
        ApplicationDbContext context,
        IWebHostEnvironment environment,
        ILogger<PinsController> logger,
        IPinterestService pinterestService)
    {
        _context = context;
        _environment = environment;
        _logger = logger;
        _pinterestService = pinterestService;
    }

    /// <summary>
    /// Створення нового піна з завантаженням зображення
    /// </summary>
    [HttpPost]
    [Authorize]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> CreatePin([FromForm] CreatePinDto createPinDto)
    {
        try
        {
            // Отримуємо ID поточного користувача
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "User not authorized" });
            }

            // Перевіряємо чи існує користувач
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Перевіряємо чи є файл (з DTO або з Form.Files)
            var file = createPinDto.Image ?? Request.Form.Files.FirstOrDefault();
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Image is required" });
            }

            // Валідація файлу
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
            {
                return BadRequest(new { message = "Invalid file format. Allowed: jpg, jpeg, png, gif, webp" });
            }

            if (file.Length > MaxFileSize)
            {
                return BadRequest(new { message = "File size cannot exceed 10MB" });
            }

            // Створюємо унікальне ім'я файлу
            var fileName = $"{Guid.NewGuid()}{extension}";
            var uploadsPath = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads");

            // Створюємо папку якщо її немає
            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }

            var filePath = Path.Combine(uploadsPath, fileName);

            // Зберігаємо файл в пам'ять для визначення розмірів та збереження
            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            memoryStream.Position = 0; // скидаємо позицію для читання

            // Визначаємо розміри зображення (для masonry grid як в Pinterest)
            int? imageWidth = null;
            int? imageHeight = null;
            
            try
            {
                memoryStream.Position = 0;
                using (var image = await Image.LoadAsync(memoryStream))
                {
                    imageWidth = image.Width;
                    imageHeight = image.Height;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Не вдалося визначити розміри зображення {FileName}", file.FileName);
                // Продовжуємо без розмірів, не критично
            }

            // Зберігаємо файл на диск
            memoryStream.Position = 0;
            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await memoryStream.CopyToAsync(fileStream);
            }

            // Формуємо URL для доступу до зображення
            var imageUrl = $"/uploads/{fileName}";

            // Створюємо пін
            var pin = new Pin
            {
                Title = createPinDto.Title,
                Description = createPinDto.Description,
                ImageUrl = imageUrl,
                ImageWidth = imageWidth,
                ImageHeight = imageHeight,
                Link = createPinDto.Link,
                OwnerId = userId,
                Visibility = createPinDto.Visibility ?? "Public",
                CreatedAt = DateTime.UtcNow
            };

            _context.Pins.Add(pin);
            await _context.SaveChangesAsync();

            // Завантажуємо дані для відповіді
            await _context.Entry(pin).Reference(p => p.Owner).LoadAsync();

            var response = new PinDto
            {
                Id = pin.Id,
                Title = pin.Title,
                Description = pin.Description,
                ImageUrl = pin.ImageUrl,
                ImageWidth = pin.ImageWidth,
                ImageHeight = pin.ImageHeight,
                Link = pin.Link,
                OwnerId = pin.OwnerId,
                OwnerUsername = pin.Owner.Username,
                OwnerAvatarUrl = pin.Owner.AvatarUrl,
                Visibility = pin.Visibility,
                CreatedAt = pin.CreatedAt,
                LikesCount = 0,
                CommentsCount = 0
            };

            return CreatedAtAction(nameof(GetPin), new { id = pin.Id }, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Помилка при створенні піна");
            return StatusCode(500, new { message = "Error creating pin" });
        }
    }

    /// <summary>
    /// Пошук зображень через Pexels API
    /// </summary>
    [HttpGet("search")]
    public async Task<IActionResult> SearchPins([FromQuery] string query = "", [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 50) pageSize = 20;

            List<PinterestImage> images;
            if (string.IsNullOrWhiteSpace(query))
            {
                images = await _pinterestService.GetTrendingImagesAsync(pageSize);
            }
            else
            {
                images = await _pinterestService.SearchImagesAsync(query, page, pageSize);
            }

            var pinDtos = images.Select((img, index) => new PinDto
            {
                Id = -(page * 1000 + index),
                Title = img.Description ?? "Image",
                Description = img.Description ?? "Beautiful image from Pexels",
                ImageUrl = img.ImageUrl,
                ImageWidth = img.Width,
                ImageHeight = img.Height,
                Link = img.Link,
                OwnerId = 0,
                OwnerUsername = img.AuthorName ?? "Pexels",
                OwnerAvatarUrl = string.Empty,
                Visibility = "Public",
                CreatedAt = DateTime.UtcNow,
                LikesCount = 0,
                CommentsCount = 0
            }).ToList();

            return Ok(new
            {
                pins = pinDtos,
                totalCount = pinDtos.Count,
                page,
                pageSize,
                totalPages = 1
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Помилка при пошуку зображень");
            return StatusCode(500, new { message = "Error searching images" });
        }
    }

    /// <summary>
    /// Отримання списку пінів з пагінацією
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPins([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] bool useApi = true)
    {
        try
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 20;

            if (useApi)
            {
                var images = await _pinterestService.GetTrendingImagesAsync(pageSize);
                var apiPinDtos = images.Select((img, index) => new PinDto
                {
                    Id = -(page * 1000 + index),
                    Title = img.Description ?? "Image",
                    Description = img.Description ?? "Beautiful image from Pexels",
                    ImageUrl = img.ImageUrl,
                    ImageWidth = img.Width,
                    ImageHeight = img.Height,
                    Link = img.Link,
                    OwnerId = 0,
                    OwnerUsername = img.AuthorName ?? "Pexels",
                    OwnerAvatarUrl = string.Empty,
                    Visibility = "Public",
                    CreatedAt = DateTime.UtcNow,
                    LikesCount = 0,
                    CommentsCount = 0
                }).ToList();

                return Ok(new
                {
                    pins = apiPinDtos,
                    totalCount = apiPinDtos.Count,
                    page,
                    pageSize,
                    totalPages = 1
                });
            }

            int? currentUserId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                {
                    currentUserId = userId;
                }
            }

            var query = _context.Pins
                .Include(p => p.Owner)
                .Include(p => p.Likes)
                .Include(p => p.Comments)
                .Where(p => !p.IsHidden && !p.IsReported)
                .Where(p => p.Visibility == "Public" || (currentUserId.HasValue && p.OwnerId == currentUserId.Value))
                .OrderByDescending(p => p.CreatedAt);

            var totalCount = await query.CountAsync();
            var pins = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var pinDtos = pins.Select(p => new PinDto
            {
                Id = p.Id,
                Title = p.Title,
                Description = p.Description,
                ImageUrl = p.ImageUrl,
                ImageWidth = p.ImageWidth,
                ImageHeight = p.ImageHeight,
                Link = p.Link,
                OwnerId = p.OwnerId,
                OwnerUsername = p.Owner.Username,
                OwnerAvatarUrl = p.Owner.AvatarUrl,
                Visibility = p.Visibility,
                CreatedAt = p.CreatedAt,
                LikesCount = p.Likes.Count,
                CommentsCount = p.Comments.Count
            }).ToList();

            return Ok(new
            {
                pins = pinDtos,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Помилка при отриманні списку пінів");
            return StatusCode(500, new { message = "Error getting pins list" });
        }
    }

    /// <summary>
    /// Отримання одного піна за ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetPin(int id)
    {
        try
        {
            int? currentUserId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                {
                    currentUserId = userId;
                }
            }

            if (id < 0)
            {
                var absoluteId = Math.Abs(id);
                var page = absoluteId / 1000;
                var index = absoluteId % 1000;
                
                List<PinterestImage> images;
                if (page == 1)
                {
                    images = await _pinterestService.GetTrendingImagesAsync(100);
                }
                else
                {
                    images = await _pinterestService.GetTrendingImagesAsync(100);
                }
                
                if (index >= 0 && index < images.Count)
                {
                    var img = images[index];
                    var apiPinDetail = new PinDetailDto
                    {
                        Id = id,
                        Title = img.Description ?? "Image",
                        Description = img.Description ?? "Beautiful image from Pexels",
                        ImageUrl = img.ImageUrl,
                        ImageWidth = img.Width,
                        ImageHeight = img.Height,
                        Link = img.Link,
                        OwnerId = 0,
                        OwnerUsername = img.AuthorName ?? "Pexels",
                        OwnerAvatarUrl = string.Empty,
                        OwnerBio = string.Empty,
                        Visibility = "Public",
                        CreatedAt = DateTime.UtcNow,
                        LikesCount = 0,
                        CommentsCount = 0,
                        IsLiked = false
                    };
                    return Ok(apiPinDetail);
                }
                
                return NotFound(new { message = "Pin not found" });
            }

            var pin = await _context.Pins
                .Include(p => p.Owner)
                .Include(p => p.Likes)
                .Include(p => p.Comments)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pin == null)
            {
                return NotFound(new { message = "Pin not found" });
            }

            // Перевіряємо доступ (публічний або власник)
            if (pin.Visibility != "Public" && (!currentUserId.HasValue || pin.OwnerId != currentUserId.Value))
            {
                return Forbid("No access to this pin");
            }

            // Перевіряємо чи не прихований/зарепортований
            if (pin.IsHidden || pin.IsReported)
            {
                return NotFound(new { message = "Pin not found" });
            }

            // Перевіряємо чи лайкнув поточний користувач
            bool isLiked = false;
            if (currentUserId.HasValue)
            {
                isLiked = pin.Likes.Any(l => l.UserId == currentUserId.Value);
            }

            var pinDetail = new PinDetailDto
            {
                Id = pin.Id,
                Title = pin.Title,
                Description = pin.Description,
                ImageUrl = pin.ImageUrl,
                ImageWidth = pin.ImageWidth,
                ImageHeight = pin.ImageHeight,
                Link = pin.Link,
                OwnerId = pin.OwnerId,
                OwnerUsername = pin.Owner.Username,
                OwnerAvatarUrl = pin.Owner.AvatarUrl,
                OwnerBio = pin.Owner.Bio,
                Visibility = pin.Visibility,
                CreatedAt = pin.CreatedAt,
                LikesCount = pin.Likes.Count,
                CommentsCount = pin.Comments.Count,
                IsLiked = isLiked
            };

            return Ok(pinDetail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Помилка при отриманні піна {PinId}", id);
            return StatusCode(500, new { message = "Error getting pin" });
        }
    }
}

