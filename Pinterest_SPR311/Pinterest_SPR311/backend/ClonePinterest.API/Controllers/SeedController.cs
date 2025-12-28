using ClonePinterest.API.Data;
using ClonePinterest.API.Models;
using ClonePinterest.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClonePinterest.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SeedController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IPasswordService _passwordService;
    private readonly ILogger<SeedController> _logger;
    private readonly HttpClient _httpClient;

    public SeedController(
        ApplicationDbContext context,
        IPasswordService passwordService,
        ILogger<SeedController> logger,
        IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _passwordService = passwordService;
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient();
    }

    [HttpPost("seed")]
    public async Task<IActionResult> SeedDatabase([FromQuery] int usersCount = 50, [FromQuery] int pinsPerUser = 20)
    {
        try
        {
            _logger.LogInformation("Starting database seeding: {UsersCount} users, {PinsPerUser} pins per user", usersCount, pinsPerUser);

            var random = new Random();
            var usernames = new List<string>();
            var users = new List<User>();

            // Создаем пользователей
            for (int i = 1; i <= usersCount; i++)
            {
                var username = $"user{i}";
                var email = $"user{i}@example.com";

                // Проверяем, не существует ли уже такой пользователь
                if (await _context.Users.AnyAsync(u => u.Email == email || u.Username == username))
                {
                    _logger.LogWarning("User {Username} already exists, skipping", username);
                    continue;
                }

                var user = new User
                {
                    Email = email,
                    Username = username,
                    PasswordHash = _passwordService.HashPassword("password123"),
                    Role = "User",
                    Visibility = "Public",
                    Bio = GetRandomBio(),
                    AvatarUrl = $"https://picsum.photos/seed/{username}/200/200",
                    CreatedAt = DateTime.UtcNow.AddDays(-random.Next(0, 365))
                };

                _context.Users.Add(user);
                users.Add(user);
                usernames.Add(username);
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Created {Count} users", users.Count);

            var categoryImageMapping = new Dictionary<string, (string[] keywords, string[] titles)>
            {
                { "nature", (new[] { "landscape", "forest", "mountain", "ocean", "sunset", "trees", "river", "valley", "lake", "beach" }, new[] { "Красивий пейзаж", "Лісові тропи", "Гірські вершини", "Морський берег", "Захід сонця", "Дерева та природа", "Річка в лісі", "Гірська долина", "Озеро в горах", "Пляж" }) },
                { "food", (new[] { "food", "cuisine", "restaurant", "cooking", "meal", "dish", "dessert", "breakfast", "pasta", "pizza" }, new[] { "Смачна страва", "Кулінарний шедевр", "Ресторанна їжа", "Домашня кухня", "Смачний обід", "Гарна страва", "Десерт", "Сніданок", "Паста", "Піца" }) },
                { "travel", (new[] { "travel", "adventure", "explore", "journey", "destination", "vacation", "trip", "wanderlust", "backpacking", "beach" }, new[] { "Подорож до мрії", "Пригоди", "Нові горизонти", "Мандрівка", "Екзотичні місця", "Відпочинок", "Подорож", "Відкриття світу", "Туризм", "Пляжний відпочинок" }) },
                { "fashion", (new[] { "fashion", "style", "outfit", "clothing", "trend", "elegant", "model", "wardrobe", "dress", "suit" }, new[] { "Стильний образ", "Модний тренд", "Елегантність", "Сучасна мода", "Унікальний стиль", "Модний вигляд", "Стильна модель", "Гардероб", "Платье", "Костюм" }) },
                { "art", (new[] { "art", "painting", "creative", "abstract", "gallery", "artist", "canvas", "colorful", "sculpture", "drawing" }, new[] { "Творчий витвір", "Мистецька робота", "Абстрактне мистецтво", "Колірна палітра", "Художня виразність", "Картина", "Творчість", "Абстракція", "Галерея", "Малюнок" }) },
                { "architecture", (new[] { "architecture", "building", "city", "urban", "modern", "design", "structure", "skyscraper", "bridge", "cathedral" }, new[] { "Сучасна архітектура", "Історична будівля", "Міський пейзаж", "Унікальний дизайн", "Архітектурний шедевр", "Будівля", "Місто", "Урбаністика", "Структура", "Хмарочос" }) },
                { "animals", (new[] { "animals", "wildlife", "pet", "dog", "cat", "nature", "creature", "fauna", "bird", "lion" }, new[] { "Мій улюбленець", "Дика природа", "Домашній улюбленець", "Собака", "Кіт", "Тваринний світ", "Тварини", "Фауна", "Птах", "Лев" }) },
                { "sport", (new[] { "sport", "fitness", "athlete", "exercise", "training", "active", "workout", "gym", "running", "cycling" }, new[] { "Активний відпочинок", "Спортивний момент", "Здоров'я та фітнес", "Спортивні досягнення", "Активний спосіб життя", "Спорт", "Атлет", "Тренування", "Біг", "Велоспорт" }) },
                { "technology", (new[] { "technology", "tech", "digital", "innovation", "computer", "device", "modern", "future", "laptop", "smartphone" }, new[] { "Технології майбутнього", "Інновації", "Цифровий світ", "Технічні новинки", "Сучасні технології", "Технологія", "Цифрові технології", "Інновація", "Комп'ютер", "Смартфон" }) },
                { "design", (new[] { "design", "minimalist", "interior", "graphic", "creative", "modern", "aesthetic", "style", "furniture", "decor" }, new[] { "Креативний дизайн", "Мінімалізм", "Дизайн інтер'єру", "Графічний дизайн", "Сучасний дизайн", "Дизайн", "Мінімалістичний", "Інтер'єр", "Графіка", "Меблі" }) },
                { "beauty", (new[] { "beauty", "cosmetics", "makeup", "skincare", "elegant", "glamour", "fashion", "style", "perfume", "lipstick" }, new[] { "Краса та стиль", "Косметика", "Догляд за собою", "Елегантність", "Природна краса", "Краса", "Макіяж", "Догляд", "Гламур", "Парфум" }) },
                { "music", (new[] { "music", "concert", "instrument", "melody", "rhythm", "sound", "audio", "performance", "guitar", "piano" }, new[] { "Музичний момент", "Концерт", "Музичний інструмент", "Музична атмосфера", "Ритм життя", "Музика", "Концертна зала", "Інструмент", "Мелодія", "Гітара" }) }
            };

            var categories = categoryImageMapping.Keys.ToArray();
            var totalPins = 0;
            
            foreach (var user in users)
            {
                var userPinsCount = random.Next(pinsPerUser / 2, pinsPerUser + 1);
                for (int i = 0; i < userPinsCount; i++)
                {
                    var category = categories[random.Next(categories.Length)];
                    var (keywords, titles) = categoryImageMapping[category];
                    
                    var index = random.Next(Math.Min(keywords.Length, titles.Length));
                    var keyword = keywords[index];
                    var title = titles[index];
                    
                    var width = random.Next(400, 800);
                    var height = random.Next(500, 1200);
                    var imageId = random.Next(1, 10000);
                    var seed = $"{category}_{keyword}_{user.Id}_{i}_{imageId}";
                    
                    var imageUrl = $"https://picsum.photos/seed/{seed}/{width}/{height}";

                    var pin = new Pin
                    {
                        Title = title,
                        Description = GetRandomDescription(category),
                        ImageUrl = imageUrl,
                        ImageWidth = width,
                        ImageHeight = height,
                        Link = random.Next(0, 3) == 0 ? $"https://example.com/{category}/{imageId}" : null,
                        OwnerId = user.Id,
                        Visibility = "Public",
                        CreatedAt = DateTime.UtcNow.AddDays(-random.Next(0, 180))
                    };

                    _context.Pins.Add(pin);
                    totalPins++;
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Created {Count} pins", totalPins);

            return Ok(new
            {
                message = "Database seeded successfully",
                usersCreated = users.Count,
                pinsCreated = totalPins
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding database");
            return StatusCode(500, new { message = "Error seeding database", error = ex.Message });
        }
    }

    private string GetRandomBio()
    {
        var bios = new[]
        {
            "Люблю фотографію та подорожі",
            "Дизайнер та креативний мислитель",
            "Шукаю натхнення в красі навколишнього світу",
            "Поділяю свої улюблені моменти",
            "Творча особистість з любов'ю до мистецтва",
            "Ентузіаст краси та стилю",
            "Досліджую світ через об'єктив",
            "Колекціонер красивих моментів"
        };
        return bios[new Random().Next(bios.Length)];
    }

    private string GetRandomTitle(string category)
    {
        var titles = new Dictionary<string, string[]>
        {
            { "nature", new[] { "Красивий пейзаж", "Природа в своїй красі", "Лісові тропи", "Гірські вершини", "Морський берег" } },
            { "food", new[] { "Смачна страва", "Кулінарний шедевр", "Домашня кухня", "Ресторанна їжа", "Десерт" } },
            { "travel", new[] { "Подорож до мрії", "Нові горизонти", "Екзотичні місця", "Мандрівка", "Відкриття світу" } },
            { "fashion", new[] { "Стильний образ", "Модний тренд", "Елегантність", "Сучасна мода", "Унікальний стиль" } },
            { "art", new[] { "Творчий витвір", "Мистецька робота", "Абстрактне мистецтво", "Колірна палітра", "Художня виразність" } },
            { "architecture", new[] { "Сучасна архітектура", "Історична будівля", "Унікальний дизайн", "Міський пейзаж", "Архітектурний шедевр" } },
            { "animals", new[] { "Мій улюбленець", "Дика природа", "Милі тварини", "Тваринний світ", "Домашній улюбленець" } },
            { "sport", new[] { "Активний відпочинок", "Спортивний момент", "Здоров'я та фітнес", "Спортивні досягнення", "Активний спосіб життя" } },
            { "technology", new[] { "Технології майбутнього", "Інновації", "Цифровий світ", "Технічні новинки", "Сучасні технології" } },
            { "design", new[] { "Креативний дизайн", "Мінімалізм", "Сучасний дизайн", "Дизайн інтер'єру", "Графічний дизайн" } },
            { "beauty", new[] { "Краса та стиль", "Косметика", "Догляд за собою", "Елегантність", "Природна краса" } },
            { "music", new[] { "Музичний момент", "Концерт", "Музичний інструмент", "Музична атмосфера", "Ритм життя" } }
        };

        if (titles.ContainsKey(category))
        {
            return titles[category][new Random().Next(titles[category].Length)];
        }
        return "Красиве зображення";
    }

    private string? GetRandomDescription(string category)
    {
        var random = new Random();
        if (random.Next(0, 3) == 0) // 33% шанс иметь описание
        {
            var descriptions = new[]
            {
                "Це зображення надихнуло мене на нові ідеї",
                "Поділяюся своїм улюбленим моментом",
                "Краса в деталях",
                "Момент, який варто зберегти",
                "Натхнення для творчості"
            };
            return descriptions[random.Next(descriptions.Length)];
        }
        return null;
    }
}

