using ClonePinterest.API.Data;
using ClonePinterest.API.DTOs.Comment;
using ClonePinterest.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ClonePinterest.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CommentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CommentsController> _logger;

    public CommentsController(ApplicationDbContext context, ILogger<CommentsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Отримання коментарів для піна
    /// </summary>
    [HttpGet("pin/{pinId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetComments(int pinId)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            int? currentUserId = null;
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                currentUserId = userId;
            }

            var comments = await _context.Comments
                .Include(c => c.User)
                .Where(c => c.PinId == pinId)
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();

            var commentDtos = comments.Select(c => new CommentDto
            {
                Id = c.Id,
                PinId = c.PinId,
                UserId = c.UserId,
                Username = c.User.Username,
                UserAvatarUrl = c.User.AvatarUrl,
                Text = c.Text,
                CreatedAt = c.CreatedAt,
                IsOwner = currentUserId.HasValue && c.UserId == currentUserId.Value
            }).ToList();

            return Ok(commentDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Помилка при отриманні коментарів для піна {PinId}", pinId);
            return StatusCode(500, new { message = "Error getting comments" });
        }
    }

    /// <summary>
    /// Створення коментаря
    /// </summary>
    [HttpPost("pin/{pinId}")]
    public async Task<IActionResult> CreateComment(int pinId, [FromBody] CreateCommentDto createCommentDto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "User not authorized" });
            }

            var pin = await _context.Pins.FindAsync(pinId);
            if (pin == null)
            {
                return NotFound(new { message = "Pin not found" });
            }

            if (pin.IsHidden || pin.IsReported)
            {
                return NotFound(new { message = "Pin not found" });
            }

            var comment = new Comment
            {
                PinId = pinId,
                UserId = userId,
                Text = createCommentDto.Text.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            await _context.Entry(comment).Reference(c => c.User).LoadAsync();

            var commentDto = new CommentDto
            {
                Id = comment.Id,
                PinId = comment.PinId,
                UserId = comment.UserId,
                Username = comment.User.Username,
                UserAvatarUrl = comment.User.AvatarUrl,
                Text = comment.Text,
                CreatedAt = comment.CreatedAt,
                IsOwner = true
            };

            _logger.LogInformation("Comment created: {CommentId} by user {UserId} on pin {PinId}", comment.Id, userId, pinId);

            return CreatedAtAction(nameof(GetComments), new { pinId }, commentDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Помилка при створенні коментаря");
            return StatusCode(500, new { message = "Error creating comment" });
        }
    }

    /// <summary>
    /// Видалення коментаря
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteComment(int id)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "User not authorized" });
            }

            var comment = await _context.Comments
                .Include(c => c.Pin)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (comment == null)
            {
                return NotFound(new { message = "Comment not found" });
            }

            if (comment.UserId != userId && comment.Pin.OwnerId != userId)
            {
                return Forbid("You can only delete your own comments or comments on your pins");
            }

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Comment deleted: {CommentId} by user {UserId}", id, userId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Помилка при видаленні коментаря {CommentId}", id);
            return StatusCode(500, new { message = "Error deleting comment" });
        }
    }
}

