using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ClonePinterest.API.Models;

[Table("Pins")]
public class Pin
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(500)]
    public string ImageUrl { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Link { get; set; }

    [Required]
    public int OwnerId { get; set; }

    [Required]
    [MaxLength(20)]
    public string Visibility { get; set; } = "Public"; // Public, Private

    public bool IsHidden { get; set; } = false;

    public bool IsReported { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("OwnerId")]
    public virtual User Owner { get; set; } = null!;

    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public virtual ICollection<Like> Likes { get; set; } = new List<Like>();
    public virtual ICollection<BoardPin> BoardPins { get; set; } = new List<BoardPin>();
    public virtual ICollection<PinTag> PinTags { get; set; } = new List<PinTag>();
    public virtual ICollection<Report> Reports { get; set; } = new List<Report>();
}


