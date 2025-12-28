using ClonePinterest.API.Data;
using ClonePinterest.API.DTOs.Notification;
using ClonePinterest.API.DTOs.Pin;
using ClonePinterest.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace ClonePinterest.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(ApplicationDbContext context, ILogger<NotificationsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
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

            var query = _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt);

            var totalCount = await query.CountAsync();
            var notifications = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var notificationDtos = notifications.Select(n =>
            {
                var dto = new NotificationDto
                {
                    Id = n.Id,
                    Type = n.Type,
                    Payload = n.Payload,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt
                };

                if (!string.IsNullOrEmpty(n.Payload))
                {
                    try
                    {
                        var payload = JsonSerializer.Deserialize<JsonElement>(n.Payload);
                        if (payload.TryGetProperty("pinId", out var pinId))
                            dto.PinId = pinId.GetInt32();
                        if (payload.TryGetProperty("userId", out var userIdProp))
                            dto.UserId = userIdProp.GetInt32();
                        if (payload.TryGetProperty("username", out var username))
                            dto.Username = username.GetString();
                        if (payload.TryGetProperty("avatarUrl", out var avatarUrl))
                            dto.AvatarUrl = avatarUrl.GetString();
                    }
                    catch { }
                }

                dto.Message = GetNotificationMessage(n.Type, dto.Username);

                return dto;
            }).ToList();

            var recommendedPins = await GetRecommendedPins(userId, 5);

            return Ok(new
            {
                notifications = notificationDtos,
                recommendedPins = recommendedPins,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notifications");
            return StatusCode(500, new { message = "Error getting notifications" });
        }
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "User not authorized" });
            }

            var count = await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);

            return Ok(new { count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unread count");
            return StatusCode(500, new { message = "Error getting unread count" });
        }
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "User not authorized" });
            }

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (notification == null)
            {
                return NotFound(new { message = "Notification not found" });
            }

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Notification marked as read" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notification as read");
            return StatusCode(500, new { message = "Error marking notification as read" });
        }
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "User not authorized" });
            }

            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "All notifications marked as read" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking all notifications as read");
            return StatusCode(500, new { message = "Error marking all notifications as read" });
        }
    }

    private string GetNotificationMessage(string type, string? username)
    {
        return type switch
        {
            "NewPin" => $"{username ?? "Користувач"} створив новий пін",
            "Like" => $"{username ?? "Користувач"} вподобав ваш пін",
            "Comment" => $"{username ?? "Користувач"} прокоментував ваш пін",
            "Follow" => $"{username ?? "Користувач"} підписався на вас",
            "PinSaved" => $"{username ?? "Користувач"} зберег ваш пін",
            _ => "Нове сповіщення"
        };
    }

    private async Task<List<PinDto>> GetRecommendedPins(int userId, int count)
    {
        try
        {
            var viewedPinIds = await _context.Views
                .Where(v => v.UserId == userId)
                .Select(v => v.PinId)
                .ToListAsync();

            if (viewedPinIds.Count == 0)
            {
                return new List<PinDto>();
            }

            var viewedPins = await _context.Pins
                .Include(p => p.Owner)
                .Where(p => viewedPinIds.Contains(p.Id))
                .ToListAsync();

            var userCategories = DetermineUserCategories(viewedPins);

            if (userCategories.Count == 0)
            {
                return new List<PinDto>();
            }

            var recommendedPins = await _context.Pins
                .Include(p => p.Owner)
                .Include(p => p.Likes)
                .Include(p => p.Comments)
                .Where(p => !p.IsHidden && !p.IsReported && p.Visibility == "Public")
                .Where(p => !viewedPinIds.Contains(p.Id))
                .Where(p => p.OwnerId != userId)
                .ToListAsync();

            var scoredPins = recommendedPins.Select(pin =>
            {
                var score = CalculatePinScore(pin, userCategories);
                return new { Pin = pin, Score = score };
            })
            .Where(x => x.Score > 0)
            .OrderByDescending(x => x.Score)
            .Take(count)
            .Select(x => new PinDto
            {
                Id = x.Pin.Id,
                Title = x.Pin.Title,
                Description = x.Pin.Description,
                ImageUrl = x.Pin.ImageUrl,
                ImageWidth = x.Pin.ImageWidth,
                ImageHeight = x.Pin.ImageHeight,
                Link = x.Pin.Link,
                OwnerId = x.Pin.OwnerId,
                OwnerUsername = x.Pin.Owner.Username,
                OwnerAvatarUrl = x.Pin.Owner.AvatarUrl,
                Visibility = x.Pin.Visibility,
                CreatedAt = x.Pin.CreatedAt,
                LikesCount = x.Pin.Likes.Count,
                CommentsCount = x.Pin.Comments.Count
            })
            .ToList();

            return scoredPins;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recommended pins");
            return new List<PinDto>();
        }
    }

    private Dictionary<string, int> DetermineUserCategories(List<Pin> viewedPins)
    {
        var categoryKeywords = new Dictionary<string, string[]>
        {
            { "nature", new[] { "пейзаж", "природа", "ліс", "гір", "морськ", "берег", "дерев", "озер", "річк" } },
            { "food", new[] { "страва", "кулінар", "кухня", "їжа", "десерт", "смачн", "рецепт", "обід", "сніданок" } },
            { "travel", new[] { "подорож", "горизонт", "екзотичн", "мандрівк", "відкритт", "пляж", "готель", "туризм" } },
            { "fashion", new[] { "стильн", "модн", "тренд", "елегантн", "мода", "образ", "одяг", "аксесуар" } },
            { "art", new[] { "творч", "мистец", "абстрактн", "колірн", "художн", "картина", "галерея", "малюнок" } },
            { "architecture", new[] { "архітектур", "будівля", "дизайн", "пейзаж", "шедевр", "місто", "хмарочос", "мост" } },
            { "animals", new[] { "улюбленець", "природа", "тварин", "домашн", "собака", "кіт", "птах", "лев" } },
            { "sport", new[] { "активн", "спортивн", "фітнес", "досягненн", "життя", "біг", "тренування", "атлет" } },
            { "technology", new[] { "технолог", "інновац", "цифров", "технічн", "сучасн", "комп'ютер", "смартфон", "гаджет" } },
            { "design", new[] { "дизайн", "креативн", "мінімалізм", "інтер'єр", "графічн", "меблі", "декор", "стиль" } },
            { "beauty", new[] { "краса", "косметик", "догляд", "елегантн", "природн", "макіяж", "парфум", "гламур" } },
            { "music", new[] { "музичн", "концерт", "інструмент", "атмосфер", "ритм", "гітара", "піаніно", "мелодія" } }
        };

        var categoryScores = new Dictionary<string, int>();

        foreach (var pin in viewedPins)
        {
            var text = $"{pin.Title} {pin.Description}".ToLower();
            foreach (var category in categoryKeywords)
            {
                var matches = category.Value.Count(keyword => text.Contains(keyword));
                if (matches > 0)
                {
                    if (!categoryScores.ContainsKey(category.Key))
                        categoryScores[category.Key] = 0;
                    categoryScores[category.Key] += matches;
                }
            }
        }

        return categoryScores;
    }

    private int CalculatePinScore(Pin pin, Dictionary<string, int> userCategories)
    {
        if (userCategories.Count == 0) return 0;

        var categoryKeywords = new Dictionary<string, string[]>
        {
            { "nature", new[] { "пейзаж", "природа", "ліс", "гір", "морськ", "берег", "дерев", "озер", "річк" } },
            { "food", new[] { "страва", "кулінар", "кухня", "їжа", "десерт", "смачн", "рецепт", "обід", "сніданок" } },
            { "travel", new[] { "подорож", "горизонт", "екзотичн", "мандрівк", "відкритт", "пляж", "готель", "туризм" } },
            { "fashion", new[] { "стильн", "модн", "тренд", "елегантн", "мода", "образ", "одяг", "аксесуар" } },
            { "art", new[] { "творч", "мистец", "абстрактн", "колірн", "художн", "картина", "галерея", "малюнок" } },
            { "architecture", new[] { "архітектур", "будівля", "дизайн", "пейзаж", "шедевр", "місто", "хмарочос", "мост" } },
            { "animals", new[] { "улюбленець", "природа", "тварин", "домашн", "собака", "кіт", "птах", "лев" } },
            { "sport", new[] { "активн", "спортивн", "фітнес", "досягненн", "життя", "біг", "тренування", "атлет" } },
            { "technology", new[] { "технолог", "інновац", "цифров", "технічн", "сучасн", "комп'ютер", "смартфон", "гаджет" } },
            { "design", new[] { "дизайн", "креативн", "мінімалізм", "інтер'єр", "графічн", "меблі", "декор", "стиль" } },
            { "beauty", new[] { "краса", "косметик", "догляд", "елегантн", "природн", "макіяж", "парфум", "гламур" } },
            { "music", new[] { "музичн", "концерт", "інструмент", "атмосфер", "ритм", "гітара", "піаніно", "мелодія" } }
        };

        var text = $"{pin.Title} {pin.Description}".ToLower();
        var score = 0;

        foreach (var category in userCategories.OrderByDescending(c => c.Value).Take(3))
        {
            if (categoryKeywords.ContainsKey(category.Key))
            {
                var matches = categoryKeywords[category.Key].Count(keyword => text.Contains(keyword));
                if (matches > 0)
                {
                    score += category.Value * matches;
                }
            }
        }

        return score;
    }
}

