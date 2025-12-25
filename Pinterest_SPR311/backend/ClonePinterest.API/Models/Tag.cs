using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ClonePinterest.API.Models;

[Table("Tags")]
public class Tag
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    // Navigation properties
    public virtual ICollection<PinTag> PinTags { get; set; } = new List<PinTag>();
}


