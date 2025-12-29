using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace ClonePinterest.API.Services;

public class PinterestService : IPinterestService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<PinterestService> _logger;
    private readonly ITranslationService _translationService;
    private readonly string _pexelsApiKey;
    private const string PexelsBaseUrl = "https://api.pexels.com/v1";

    public PinterestService(HttpClient httpClient, ILogger<PinterestService> logger, IConfiguration configuration, ITranslationService translationService)
    {
        _httpClient = httpClient;
        _logger = logger;
        _translationService = translationService;
        _pexelsApiKey = configuration["Pexels:ApiKey"] ?? string.Empty;
        
        if (!string.IsNullOrEmpty(_pexelsApiKey))
        {
            _httpClient.DefaultRequestHeaders.Add("Authorization", _pexelsApiKey);
        }
    }

    public async Task<List<PinterestImage>> SearchImagesAsync(string query, int page = 1, int perPage = 20)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return await GetTrendingImagesAsync(perPage);
            }

            var translatedQuery = await _translationService.TranslateToEnglishAsync(query);
            _logger.LogInformation("Searching for '{OriginalQuery}' translated to '{TranslatedQuery}'", query, translatedQuery);
            
            if (string.IsNullOrWhiteSpace(translatedQuery))
            {
                _logger.LogWarning("Empty translated query for '{Query}'", query);
                return new List<PinterestImage>();
            }

            var isUkrainian = _translationService.IsUkrainianText(query);
            if (isUkrainian && translatedQuery.ToLower() == query.ToLower().Trim())
            {
                _logger.LogWarning("Translation failed for Ukrainian query '{Query}', returning empty", query);
                return new List<PinterestImage>();
            }
            
            var url = $"{PexelsBaseUrl}/search?query={Uri.EscapeDataString(translatedQuery)}&page={page}&per_page={perPage}";
            
            var response = await _httpClient.GetAsync(url);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Pexels API returned {StatusCode} for query '{Query}'", response.StatusCode, translatedQuery);
                return new List<PinterestImage>();
            }

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<PexelsSearchResponse>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (result == null)
            {
                _logger.LogWarning("Failed to deserialize Pexels response for query '{Query}'", translatedQuery);
                return new List<PinterestImage>();
            }

            _logger.LogInformation("Pexels response: TotalResults={TotalResults}, Photos.Count={Count}", result.TotalResults, result.Photos?.Count ?? 0);

            if (result.Photos == null || result.Photos.Count == 0)
            {
                _logger.LogWarning("No results found for query '{Query}' (TotalResults: {TotalResults})", translatedQuery, result.TotalResults);
                return new List<PinterestImage>();
            }

            return result.Photos.Select(p => new PinterestImage
            {
                Id = p.Id.ToString(),
                ImageUrl = p.Src?.Large ?? p.Src?.Medium ?? p.Src?.Original ?? string.Empty,
                ThumbnailUrl = p.Src?.Medium ?? p.Src?.Small ?? string.Empty,
                Description = p.Alt ?? query,
                AuthorName = p.Photographer ?? "Unknown",
                AuthorUrl = p.PhotographerUrl ?? string.Empty,
                Width = p.Width,
                Height = p.Height,
                Link = p.Url
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching images from Pexels for query '{Query}'", query);
            return new List<PinterestImage>();
        }
    }

    public async Task<List<PinterestImage>> GetTrendingImagesAsync(int count = 20)
    {
        try
        {
            var url = $"{PexelsBaseUrl}/curated?per_page={count}&page=1";
            
            var response = await _httpClient.GetAsync(url);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Pexels API returned {StatusCode} for curated images", response.StatusCode);
                return new List<PinterestImage>();
            }

            var json = await response.Content.ReadAsStringAsync();
            
            if (string.IsNullOrWhiteSpace(json))
            {
                _logger.LogWarning("Empty response from Pexels API for curated images");
                return new List<PinterestImage>();
            }

            PexelsSearchResponse? result = null;
            try
            {
                result = JsonSerializer.Deserialize<PexelsSearchResponse>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch (JsonException jsonEx)
            {
                _logger.LogError(jsonEx, "Failed to deserialize Pexels response. JSON length: {Length}, First 500 chars: {Preview}", 
                    json.Length, json.Length > 500 ? json.Substring(0, 500) : json);
                return new List<PinterestImage>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error deserializing Pexels response");
                return new List<PinterestImage>();
            }

            if (result == null)
            {
                _logger.LogWarning("Deserialized result is null for curated images");
                return new List<PinterestImage>();
            }

            if (result.Photos == null || result.Photos.Count == 0)
            {
                _logger.LogWarning("No photos in Pexels response for curated images");
                return new List<PinterestImage>();
            }

            return result.Photos.Select(p => new PinterestImage
            {
                Id = p.Id.ToString(),
                ImageUrl = p.Src?.Large ?? p.Src?.Medium ?? p.Src?.Original ?? string.Empty,
                ThumbnailUrl = p.Src?.Medium ?? p.Src?.Small ?? string.Empty,
                Description = p.Alt ?? "Trending image",
                AuthorName = p.Photographer ?? "Unknown",
                AuthorUrl = p.PhotographerUrl ?? string.Empty,
                Width = p.Width,
                Height = p.Height,
                Link = p.Url
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching trending images from Pexels");
            return new List<PinterestImage>();
        }
    }

    private List<PinterestImage> GetFallbackImages(string query, int count)
    {
        var images = new List<PinterestImage>();
        var random = new Random();
        
        var popularQueries = new Dictionary<string, string[]>
        {
            { "nature", new[] { "landscape", "forest", "mountain", "ocean", "sunset", "trees", "waterfall", "wildlife" } },
            { "food", new[] { "pizza", "burger", "pasta", "sushi", "dessert", "coffee", "breakfast", "salad" } },
            { "travel", new[] { "beach", "city", "architecture", "hotel", "airplane", "tourism", "vacation", "adventure" } },
            { "fashion", new[] { "clothing", "style", "outfit", "accessories", "shoes", "jewelry", "makeup", "beauty" } },
            { "art", new[] { "painting", "drawing", "sculpture", "design", "creative", "abstract", "colorful", "artistic" } },
            { "animals", new[] { "dog", "cat", "bird", "wildlife", "pets", "nature", "cute", "wild" } },
            { "people", new[] { "portrait", "person", "model", "face", "smile", "lifestyle", "human", "portrait" } }
        };

        var category = popularQueries.Keys.FirstOrDefault(k => query.ToLower().Contains(k.ToLower())) ?? "nature";
        var keywords = popularQueries.ContainsKey(category) ? popularQueries[category] : popularQueries["nature"];

        var imageIds = new[] { 
            "1506905925346-21bda4d32df4", "1514565131-fce0801e5785", "1505142468610-359e7d316be0",
            "1441974231531-c6227db76b6e", "1509316785289-025f5b846b35", "1507525428034-b723cf961d3e",
            "1487958449943-2429e8be8625", "1517487881594-2787fef5ebf7", "1490750967868-88aa4486c946",
            "1446776653964-20c1d3a81b06", "1492144534655-ae79c964c9d7", "1541961017774-22349e4a1262",
            "1504674900247-0877df9cc836", "1522771739844-6a9f6d5f14af", "1517077304055-5e89e867f0d3",
            "1499083773823-27d37740a7cf", "1506905925346-21bda4d32df4", "1514565131-fce0801e5785"
        };
        
        var widths = new[] { 400, 450, 500, 550, 600, 650, 700 };
        var heights = new[] { 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300 };
        
        for (int i = 0; i < count; i++)
        {
            var imageId = imageIds[random.Next(imageIds.Length)];
            var width = widths[random.Next(widths.Length)];
            var height = heights[random.Next(heights.Length)];
            var keyword = keywords[random.Next(keywords.Length)];
            
            images.Add(new PinterestImage
            {
                Id = $"{query}-{i}-{Guid.NewGuid()}",
                ImageUrl = $"https://images.unsplash.com/photo-{imageId}?w={width * 2}&q=80",
                ThumbnailUrl = $"https://images.unsplash.com/photo-{imageId}?w={width}&q=80",
                Description = $"{keyword} - {query}",
                AuthorName = "Pexels",
                Width = width,
                Height = height
            });
        }
        
        return images;
    }
}

public class PexelsSearchResponse
{
    public int TotalResults { get; set; }
    public int Page { get; set; }
    public int PerPage { get; set; }
    public List<PexelsPhoto> Photos { get; set; } = new();
}

public class PexelsPhoto
{
    public int Id { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public string? Url { get; set; }
    public string? Alt { get; set; }
    public string? Photographer { get; set; }
    public string? PhotographerUrl { get; set; }
    public PexelsPhotoSrc? Src { get; set; }
}

public class PexelsPhotoSrc
{
    public string? Original { get; set; }
    public string? Large { get; set; }
    public string? Large2X { get; set; }
    public string? Medium { get; set; }
    public string? Small { get; set; }
    public string? Portrait { get; set; }
    public string? Landscape { get; set; }
    public string? Tiny { get; set; }
}

