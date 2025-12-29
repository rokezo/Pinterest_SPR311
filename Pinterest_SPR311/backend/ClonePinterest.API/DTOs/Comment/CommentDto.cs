namespace ClonePinterest.API.DTOs.Comment;

public class CommentDto
{
    public int Id { get; set; }
    public int PinId { get; set; }
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? UserAvatarUrl { get; set; }
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsOwner { get; set; }
}

