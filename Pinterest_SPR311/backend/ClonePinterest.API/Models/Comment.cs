using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ClonePinterest.API.Models;

[Table("Comments")]
public class Comment
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int PinId { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Text { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("PinId")]
    public virtual Pin Pin { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}


