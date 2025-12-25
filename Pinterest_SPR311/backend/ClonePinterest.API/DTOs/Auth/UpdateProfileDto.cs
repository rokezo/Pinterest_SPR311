using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace ClonePinterest.API.DTOs.Auth;

public class UpdateProfileDto
{
    [MaxLength(50)]
    public string? Username { get; set; }

    [MaxLength(500)]
    public string? Bio { get; set; }

    [MaxLength(500)]
    public string? AvatarUrl { get; set; }

    // Поле для завантаження аватара
    public IFormFile? Avatar { get; set; }
}

