namespace ClonePinterest.API.DTOs.Pin;

public class PinDetailDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public int? ImageWidth { get; set; } // для masonry grid
    public int? ImageHeight { get; set; } // для masonry grid
    public string? Link { get; set; }
    public int OwnerId { get; set; }
    public string OwnerUsername { get; set; } = string.Empty;
    public string? OwnerAvatarUrl { get; set; }
    public string? OwnerBio { get; set; }
    public string Visibility { get; set; } = "Public";
    public DateTime CreatedAt { get; set; }
    public int LikesCount { get; set; }
    public int CommentsCount { get; set; }
    public bool IsLiked { get; set; } // чи лайкнув поточний користувач
}

