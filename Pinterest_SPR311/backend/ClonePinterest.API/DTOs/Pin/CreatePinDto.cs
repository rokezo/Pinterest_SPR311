using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace ClonePinterest.API.DTOs.Pin;

public class CreatePinDto
{
    [Required(ErrorMessage = "Назва обов'язкова")]
    [MaxLength(200, ErrorMessage = "Назва не може бути довша за 200 символів")]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Опис не може бути довший за 1000 символів")]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? Link { get; set; }

    [MaxLength(20)]
    public string Visibility { get; set; } = "Public"; // Public або Private

    // Поле для завантаження зображення (для Swagger UI)
    public IFormFile? Image { get; set; }
}

