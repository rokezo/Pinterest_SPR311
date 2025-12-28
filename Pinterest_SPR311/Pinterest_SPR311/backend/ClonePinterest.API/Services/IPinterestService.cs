namespace ClonePinterest.API.Services;

public interface IPinterestService
{
    Task<List<PinterestImage>> SearchImagesAsync(string query, int page = 1, int perPage = 20);
    Task<List<PinterestImage>> GetTrendingImagesAsync(int count = 20);
}

public class PinterestImage
{
    public string Id { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string AuthorUrl { get; set; } = string.Empty;
    public int Width { get; set; }
    public int Height { get; set; }
    public string? Link { get; set; }
}

