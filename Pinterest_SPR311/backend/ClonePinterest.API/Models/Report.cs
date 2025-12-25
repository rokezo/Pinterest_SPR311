using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ClonePinterest.API.Models;

[Table("Reports")]
public class Report
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int PinId { get; set; }

    [Required]
    public int ReporterId { get; set; }

    [Required]
    [MaxLength(500)]
    public string Reason { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("PinId")]
    public virtual Pin Pin { get; set; } = null!;

    [ForeignKey("ReporterId")]
    public virtual User Reporter { get; set; } = null!;
}


