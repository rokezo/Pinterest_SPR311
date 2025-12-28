using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ClonePinterest.API.Models;

[Table("BoardPins")]
public class BoardPin
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int BoardId { get; set; }

    [Required]
    public int PinId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("BoardId")]
    public virtual Board Board { get; set; } = null!;

    [ForeignKey("PinId")]
    public virtual Pin Pin { get; set; } = null!;
}


