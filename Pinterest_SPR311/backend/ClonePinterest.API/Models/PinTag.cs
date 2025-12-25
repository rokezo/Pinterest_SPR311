using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ClonePinterest.API.Models;

[Table("PinTags")]
public class PinTag
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int PinId { get; set; }

    [Required]
    public int TagId { get; set; }

    // Navigation properties
    [ForeignKey("PinId")]
    public virtual Pin Pin { get; set; } = null!;

    [ForeignKey("TagId")]
    public virtual Tag Tag { get; set; } = null!;
}


