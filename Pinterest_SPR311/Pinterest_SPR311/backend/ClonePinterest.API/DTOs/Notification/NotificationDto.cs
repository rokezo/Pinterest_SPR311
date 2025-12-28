namespace ClonePinterest.API.DTOs.Notification;

public class NotificationDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Payload { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? Message { get; set; }
    public int? PinId { get; set; }
    public int? UserId { get; set; }
    public string? Username { get; set; }
    public string? AvatarUrl { get; set; }
}

