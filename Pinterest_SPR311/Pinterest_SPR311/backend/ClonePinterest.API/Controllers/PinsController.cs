using ClonePinterest.API.Data;
using ClonePinterest.API.DTOs.Pin;
using ClonePinterest.API.DTOs.Comment;
using ClonePinterest.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.PixelFormats;
using System.Security.Claims;
using System.Linq.Expressions;
using System;

namespace ClonePinterest.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PinsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<PinsController> _logger;

    // Дозволені формати зображень
    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB

    public PinsController(
        ApplicationDbContext context,
        IWebHostEnvironment environment,
        ILogger<PinsController> logger)
    {
        _context = context;
        _environment = environment;
        _logger = logger;
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

            // Створюємо сповіщення для підписників
            try
            {
                var followers = await _context.Follows
                    .Where(f => f.FollowingId == userId)
                    .Select(f => f.FollowerId)
                    .ToListAsync();

                foreach (var followerId in followers)
                {
                    var notification = new Notification
                    {
                        UserId = followerId,
                        Type = "NewPin",
                        Payload = System.Text.Json.JsonSerializer.Serialize(new
                        {
                            pinId = pin.Id,
                            userId = userId,
                            username = user.Username,
                            avatarUrl = user.AvatarUrl
                        }),
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Notifications.Add(notification);
                }
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Не вдалося створити сповіщення для підписників");
            }

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
    /// Пошук пінів в базі даних
    /// </summary>
    [HttpGet("search")]
    public async Task<IActionResult> SearchPins([FromQuery] string query = "", [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 50) pageSize = 20;

            int? currentUserId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                {
                    currentUserId = userId;
                }
            }

            var dbQuery = _context.Pins
                .Include(p => p.Owner)
                .Include(p => p.Likes)
                .Include(p => p.Comments)
                .Where(p => !p.IsHidden && !p.IsReported)
                .Where(p => p.Visibility == "Public" || (currentUserId.HasValue && p.OwnerId == currentUserId.Value));

            if (!string.IsNullOrWhiteSpace(query))
            {
                var searchTerm = query.Trim();
                var searchTermLower = searchTerm.ToLowerInvariant();
                
                var searchWords = searchTerm.Split(new[] { ' ', '\t', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries)
                    .Select(w => w.Trim())
                    .Where(w => w.Length > 0)
                    .ToList();
                
                var categoryMapping = new Dictionary<string, string[]>
                {
                    { "nature", new[] { "пейзаж", "природа", "ліс", "гір", "морськ", "берег" } },
                    { "food", new[] { "страва", "кулінар", "кухня", "їжа", "десерт", "смачн" } },
                    { "travel", new[] { "подорож", "горизонт", "екзотичн", "мандрівк", "відкритт" } },
                    { "fashion", new[] { "стильн", "модн", "тренд", "елегантн", "мода" } },
                    { "art", new[] { "творч", "мистец", "абстрактн", "колірн", "художн" } },
                    { "architecture", new[] { "архітектур", "будівля", "дизайн", "пейзаж", "шедевр" } },
                    { "animals", new[] { "улюбленець", "природа", "тварин", "домашн" } },
                    { "sport", new[] { "активн", "спортивн", "фітнес", "досягненн", "життя" } },
                    { "technology", new[] { "технолог", "інновац", "цифров", "технічн", "сучасн" } },
                    { "design", new[] { "дизайн", "креативн", "мінімалізм", "інтер'єр", "графічн" } },
                    { "beauty", new[] { "краса", "косметик", "догляд", "елегантн", "природн" } },
                    { "music", new[] { "музичн", "концерт", "інструмент", "атмосфер", "ритм" } }
                };

                if (categoryMapping.ContainsKey(searchTermLower))
                {
                    var searchTerms = categoryMapping[searchTermLower];
                    var firstTerm = searchTerms[0];
                    dbQuery = dbQuery.Where(p => 
                        (p.Title != null && p.Title.Contains(firstTerm)) ||
                        (p.Description != null && p.Description.Contains(firstTerm))
                    );
                }
                else
                {
                    var allPins = await dbQuery.ToListAsync();
                    var filteredPins = allPins.Where(p => 
                        searchWords.Any(word => 
                            (p.Title != null && p.Title.IndexOf(word, StringComparison.OrdinalIgnoreCase) >= 0) || 
                            (p.Description != null && p.Description.IndexOf(word, StringComparison.OrdinalIgnoreCase) >= 0)
                        )
                    ).Select(p => p.Id).ToList();
                    
                    if (filteredPins.Count > 0)
                    {
                        dbQuery = _context.Pins
                            .Include(p => p.Owner)
                            .Include(p => p.Likes)
                            .Include(p => p.Comments)
                            .Where(p => !p.IsHidden && !p.IsReported)
                            .Where(p => p.Visibility == "Public" || (currentUserId.HasValue && p.OwnerId == currentUserId.Value))
                            .Where(p => filteredPins.Contains(p.Id));
                    }
                    else
                    {
                        dbQuery = dbQuery.Where(p => false);
                    }
                }
            }

            var totalCount = await dbQuery.CountAsync();
            var pins = await dbQuery
                .OrderByDescending(p => p.CreatedAt)
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
            _logger.LogError(ex, "Помилка при пошуку пінів");
            return Ok(new
            {
                pins = new List<PinDto>(),
                totalCount = 0,
                page,
                pageSize,
                totalPages = 0
            });
        }
    }

    /// <summary>
    /// Отримання списку пінів з пагінацією
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPins([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] bool useApi = false)
    {
        try
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 20;

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
            // Возвращаем пустой список вместо ошибки 500
            return Ok(new
            {
                pins = new List<PinDto>(),
                totalCount = 0,
                page,
                pageSize,
                totalPages = 0
            });
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

            var pin = await _context.Pins
                .Include(p => p.Owner)
                .Include(p => p.Likes)
                .Include(p => p.Comments)
                    .ThenInclude(c => c.User)
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

                // Записуємо перегляд
                var existingView = await _context.Views
                    .FirstOrDefaultAsync(v => v.UserId == currentUserId.Value && v.PinId == id);

                if (existingView == null)
                {
                    var view = new View
                    {
                        UserId = currentUserId.Value,
                        PinId = id,
                        ViewedAt = DateTime.UtcNow
                    };
                    _context.Views.Add(view);
                    await _context.SaveChangesAsync();
                }
            }

            var comments = pin.Comments
                .OrderBy(c => c.CreatedAt)
                .Select(c => new CommentDto
                {
                    Id = c.Id,
                    PinId = c.PinId,
                    UserId = c.UserId,
                    Username = c.User.Username,
                    UserAvatarUrl = c.User.AvatarUrl,
                    Text = c.Text,
                    CreatedAt = c.CreatedAt,
                    IsOwner = currentUserId.HasValue && c.UserId == currentUserId.Value
                })
                .ToList();

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
                IsLiked = isLiked,
                Comments = comments
            };

            return Ok(pinDetail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Помилка при отриманні піна {PinId}", id);
            return StatusCode(500, new { message = "Error getting pin" });
        }
    }

    /// <summary>
    /// Створення колажу з кількох зображень
    /// </summary>
    [HttpPost("collage")]
    [Authorize]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> CreateCollage([FromForm] string title, [FromForm] string? description, [FromForm] string? link, [FromForm] string layout, [FromForm] List<IFormFile> images)
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

            if (images == null || images.Count < 2 || images.Count > 4)
            {
                return BadRequest(new { message = "Please provide 2-4 images for collage" });
            }

            if (string.IsNullOrWhiteSpace(title))
            {
                return BadRequest(new { message = "Title is required" });
            }

            var validImages = new List<IFormFile>();
            foreach (var image in images)
            {
                if (image != null && image.Length > 0)
                {
                    var extension = Path.GetExtension(image.FileName).ToLowerInvariant();
                    if (!string.IsNullOrEmpty(extension) && AllowedExtensions.Contains(extension) && image.Length <= MaxFileSize)
                    {
                        validImages.Add(image);
                    }
                }
            }

            if (validImages.Count < 2)
            {
                return BadRequest(new { message = "Please provide at least 2 valid images" });
            }

            const int collageSize = 1000;
            var collageImage = new Image<Rgba32>(collageSize, collageSize, Color.White);

            try
            {
                var loadedImages = new List<Image<Rgba32>>();
                foreach (var imageFile in validImages)
                {
                    using var memoryStream = new MemoryStream();
                    await imageFile.CopyToAsync(memoryStream);
                    memoryStream.Position = 0;
                    var img = await Image.LoadAsync<Rgba32>(memoryStream);
                    loadedImages.Add(img);
                }

                var gap = 4;
                var cols = GetColsForLayout(layout);
                var rows = GetRowsForLayout(layout);
                var cellWidth = (collageSize - gap * (cols - 1)) / cols;
                var cellHeight = (collageSize - gap * (rows - 1)) / rows;

                int imageIndex = 0;
                for (int row = 0; row < rows && imageIndex < loadedImages.Count; row++)
                {
                    for (int col = 0; col < cols && imageIndex < loadedImages.Count; col++)
                    {
                        var x = col * (cellWidth + gap);
                        var y = row * (cellHeight + gap);
                        var width = cellWidth;
                        var height = cellHeight;

                        if (layout == "1+2" && row == 0 && col == 0)
                        {
                            height = collageSize - gap;
                        }
                        else if (layout == "2+1" && row == 0 && col == 1)
                        {
                            height = collageSize - gap;
                        }

                        var img = loadedImages[imageIndex];
                        var resizedImg = img.Clone();
                        resizedImg.Mutate(x => x.Resize(new ResizeOptions
                        {
                            Size = new Size(width, height),
                            Mode = ResizeMode.Crop
                        }));

                        collageImage.Mutate(ctx => ctx.DrawImage(resizedImg, new Point(x, y), 1f));
                        resizedImg.Dispose();
                        imageIndex++;
                    }
                }

                foreach (var img in loadedImages)
                {
                    img.Dispose();
                }
            }
            catch (Exception ex)
            {
                collageImage.Dispose();
                _logger.LogError(ex, "Error creating collage");
                return StatusCode(500, new { message = "Error processing images" });
            }

            var fileName = $"{Guid.NewGuid()}.jpg";
            var uploadsPath = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads");

            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }

            var filePath = Path.Combine(uploadsPath, fileName);

            await collageImage.SaveAsJpegAsync(filePath);
            collageImage.Dispose();

            var imageUrl = $"/uploads/{fileName}";

            var pin = new Pin
            {
                Title = title,
                Description = description,
                ImageUrl = imageUrl,
                ImageWidth = collageSize,
                ImageHeight = collageSize,
                Link = link,
                OwnerId = userId,
                Visibility = "Public",
                CreatedAt = DateTime.UtcNow
            };

            _context.Pins.Add(pin);
            await _context.SaveChangesAsync();

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

            _logger.LogInformation("Collage pin created: {PinId} by user {UserId}", pin.Id, userId);

            return CreatedAtAction(nameof(GetPin), new { id = pin.Id }, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating collage");
            return StatusCode(500, new { message = "Error creating collage" });
        }
    }

    private int GetColsForLayout(string layout)
    {
        return layout switch
        {
            "2x2" => 2,
            "1+2" => 2,
            "2+1" => 2,
            "3x1" => 3,
            "1x3" => 1,
            _ => 2
        };
    }

    private int GetRowsForLayout(string layout)
    {
        return layout switch
        {
            "2x2" => 2,
            "1+2" => 2,
            "2+1" => 2,
            "3x1" => 1,
            "1x3" => 3,
            _ => 2
        };
    }

    /// <summary>
    /// Отримання пінів поточного користувача
    /// </summary>
    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMyPins([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "User not authorized" });
            }

            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 20;

            var query = _context.Pins
                .Include(p => p.Owner)
                .Include(p => p.Likes)
                .Include(p => p.Comments)
                .Where(p => p.OwnerId == userId && !p.IsHidden && !p.IsReported)
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
            _logger.LogError(ex, "Помилка при отриманні пінів користувача");
            return StatusCode(500, new { message = "Error getting user pins" });
        }
    }

    /// <summary>
    /// Отримання колажів поточного користувача (колажі мають розмір 1000x1000)
    /// </summary>
    [HttpGet("my/collages")]
    [Authorize]
    public async Task<IActionResult> GetMyCollages([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "User not authorized" });
            }

            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 20;

            var query = _context.Pins
                .Include(p => p.Owner)
                .Include(p => p.Likes)
                .Include(p => p.Comments)
                .Where(p => p.OwnerId == userId && !p.IsHidden && !p.IsReported)
                .Where(p => p.ImageWidth == 1000 && p.ImageHeight == 1000)
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
            _logger.LogError(ex, "Помилка при отриманні колажів користувача");
            return StatusCode(500, new { message = "Error getting user collages" });
        }
    }
}

