using ClonePinterest.API.Data;
using ClonePinterest.API.DTOs.User;
using ClonePinterest.API.DTOs.Pin;
using ClonePinterest.API.DTOs.Board;
using ClonePinterest.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ClonePinterest.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<UsersController> _logger;

    public UsersController(ApplicationDbContext context, ILogger<UsersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetUserProfile(int id)
    {
        try
        {
            int? currentUserId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                {
                    currentUserId = userId;
                }
            }

            var user = await _context.Users
                .Include(u => u.Pins)
                .Include(u => u.Boards)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var followersCount = await _context.Follows.CountAsync(f => f.FollowingId == id);
            var followingCount = await _context.Follows.CountAsync(f => f.FollowerId == id);
            var isFollowing = currentUserId.HasValue && 
                await _context.Follows.AnyAsync(f => f.FollowerId == currentUserId.Value && f.FollowingId == id);

            var profile = new UserProfileDto
            {
                Id = user.Id,
                Username = user.Username,
                Bio = user.Bio,
                AvatarUrl = user.AvatarUrl,
                Visibility = user.Visibility,
                CreatedAt = user.CreatedAt,
                PinsCount = user.Pins.Count(p => !p.IsHidden && !p.IsReported),
                BoardsCount = user.Boards.Count(b => !b.IsArchived),
                FollowersCount = followersCount,
                FollowingCount = followingCount,
                IsFollowing = isFollowing,
                IsOwnProfile = currentUserId.HasValue && user.Id == currentUserId.Value
            };

            return Ok(profile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user profile {UserId}", id);
            return StatusCode(500, new { message = "Error getting user profile" });
        }
    }

    [HttpGet("{id}/pins")]
    [AllowAnonymous]
    public async Task<IActionResult> GetUserPins(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 20;

            int? currentUserId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                {
                    currentUserId = userId;
                }
            }

            var query = _context.Pins
                .Include(p => p.Owner)
                .Include(p => p.Likes)
                .Include(p => p.Comments)
                .Where(p => p.OwnerId == id && !p.IsHidden && !p.IsReported)
                .Where(p => p.Visibility == "Public" || (currentUserId.HasValue && p.OwnerId == currentUserId.Value))
                .OrderByDescending(p => p.CreatedAt);

            var totalCount = await query.CountAsync();
            var pins = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var pinDtos = pins.Select(p => new PinDto
            {
                Id = p.Id,
                Title = p.Title,
                Description = p.Description,
                ImageUrl = p.ImageUrl,
                ImageWidth = p.ImageWidth,
                ImageHeight = p.ImageHeight,
                Link = p.Link,
                OwnerId = p.OwnerId,
                OwnerUsername = p.Owner.Username,
                OwnerAvatarUrl = p.Owner.AvatarUrl,
                Visibility = p.Visibility,
                CreatedAt = p.CreatedAt,
                LikesCount = p.Likes.Count,
                CommentsCount = p.Comments.Count
            }).ToList();

            return Ok(new
            {
                pins = pinDtos,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user pins {UserId}", id);
            return StatusCode(500, new { message = "Error getting user pins" });
        }
    }

    [HttpGet("{id}/saved")]
    [Authorize]
    public async Task<IActionResult> GetUserSavedPins(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int currentUserId))
            {
                return Unauthorized(new { message = "User not authorized" });
            }

            if (id != currentUserId)
            {
                return Forbid("You can only view your own saved pins");
            }

            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 20;

            var query = _context.BoardPins
                .Include(bp => bp.Pin)
                    .ThenInclude(p => p.Owner)
                .Include(bp => bp.Pin)
                    .ThenInclude(p => p.Likes)
                .Include(bp => bp.Pin)
                    .ThenInclude(p => p.Comments)
                .Include(bp => bp.Board)
                .Where(bp => bp.Board.OwnerId == id && !bp.Pin.IsHidden && !bp.Pin.IsReported)
                .OrderByDescending(bp => bp.CreatedAt);

            var totalCount = await query.CountAsync();
            var boardPins = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var pinDtos = boardPins.Select(bp => new PinDto
            {
                Id = bp.Pin.Id,
                Title = bp.Pin.Title,
                Description = bp.Pin.Description,
                ImageUrl = bp.Pin.ImageUrl,
                ImageWidth = bp.Pin.ImageWidth,
                ImageHeight = bp.Pin.ImageHeight,
                Link = bp.Pin.Link,
                OwnerId = bp.Pin.OwnerId,
                OwnerUsername = bp.Pin.Owner.Username,
                OwnerAvatarUrl = bp.Pin.Owner.AvatarUrl,
                Visibility = bp.Pin.Visibility,
                CreatedAt = bp.Pin.CreatedAt,
                LikesCount = bp.Pin.Likes.Count,
                CommentsCount = bp.Pin.Comments.Count
            }).ToList();

            return Ok(new
            {
                pins = pinDtos,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting saved pins for user {UserId}", id);
            return StatusCode(500, new { message = "Error getting saved pins" });
        }
    }

    [HttpPost("{id}/follow")]
    [Authorize]
    public async Task<IActionResult> FollowUser(int id)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int followerId))
            {
                return Unauthorized(new { message = "User not authorized" });
            }

            if (followerId == id)
            {
                return BadRequest(new { message = "You cannot follow yourself" });
            }

            var userToFollow = await _context.Users.FindAsync(id);
            if (userToFollow == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var existingFollow = await _context.Follows
                .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowingId == id);

            if (existingFollow != null)
            {
                return BadRequest(new { message = "Already following this user" });
            }

            var follow = new Follow
            {
                FollowerId = followerId,
                FollowingId = id,
                CreatedAt = DateTime.UtcNow
            };

            _context.Follows.Add(follow);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User {FollowerId} followed user {FollowingId}", followerId, id);

            return Ok(new { message = "Successfully followed user" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error following user {UserId}", id);
            return StatusCode(500, new { message = "Error following user" });
        }
    }

    [HttpDelete("{id}/follow")]
    [Authorize]
    public async Task<IActionResult> UnfollowUser(int id)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int followerId))
            {
                return Unauthorized(new { message = "User not authorized" });
            }

            var follow = await _context.Follows
                .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowingId == id);

            if (follow == null)
            {
                return NotFound(new { message = "Not following this user" });
            }

            _context.Follows.Remove(follow);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User {FollowerId} unfollowed user {FollowingId}", followerId, id);

            return Ok(new { message = "Successfully unfollowed user" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unfollowing user {UserId}", id);
            return StatusCode(500, new { message = "Error unfollowing user" });
        }
    }
}

