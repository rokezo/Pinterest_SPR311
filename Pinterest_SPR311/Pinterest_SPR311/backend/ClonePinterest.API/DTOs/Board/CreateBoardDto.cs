using System.ComponentModel.DataAnnotations;

namespace ClonePinterest.API.DTOs.Board;

public class CreateBoardDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string? Group { get; set; }
}

