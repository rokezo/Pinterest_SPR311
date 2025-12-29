using ClonePinterest.API.DTOs.Pin;

namespace ClonePinterest.API.DTOs.Board;

public class BoardDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int OwnerId { get; set; }
    public string OwnerUsername { get; set; } = string.Empty;
    public string? Group { get; set; }
    public int PinsCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<PinDto>? Pins { get; set; }
    public List<string>? CoverImages { get; set; }
}

