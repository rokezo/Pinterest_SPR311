using System.ComponentModel.DataAnnotations;

namespace ClonePinterest.API.DTOs.Comment;

public class CreateCommentDto
{
    [Required(ErrorMessage = "Текст коментаря є обов'язковим")]
    [MaxLength(1000, ErrorMessage = "Коментар не може перевищувати 1000 символів")]
    public string Text { get; set; } = string.Empty;
}

