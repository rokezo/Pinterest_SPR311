namespace ClonePinterest.API.DTOs.User;

public class UserListItemDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public bool IsFollowing { get; set; }
    public bool IsOwnProfile { get; set; }
}

