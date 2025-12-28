using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ClonePinterest.API.Models;

[Table("Follows")]
public class Follow
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int FollowerId { get; set; }

    [Required]
    public int FollowingId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("FollowerId")]
    public virtual User Follower { get; set; } = null!;

    [ForeignKey("FollowingId")]
    public virtual User Following { get; set; } = null!;
}

