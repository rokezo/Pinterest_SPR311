using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ClonePinterest.API.Models;

[Table("Notifications")]
public class Notification
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; } // отримувач сповіщення

    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty; // Like, Comment, Follow, PinSaved

    [MaxLength(1000)]
    public string? Payload { get; set; } // JSON з додатковою інформацією

    public bool IsRead { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}


