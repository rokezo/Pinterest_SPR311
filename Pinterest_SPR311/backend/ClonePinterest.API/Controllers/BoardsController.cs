using ClonePinterest.API.Data;
using ClonePinterest.API.DTOs.Board;
using ClonePinterest.API.DTOs.Pin;
using ClonePinterest.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ClonePinterest.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BoardsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<BoardsController> _logger;

    public BoardsController(ApplicationDbContext context, ILogger<BoardsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateBoard([FromBody] CreateBoardDto createBoardDto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "User not authorized" });
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var board = new Board
            {
                Name = createBoardDto.Name.Trim(),
                Description = createBoardDto.Description?.Trim(),
                Group = createBoardDto.Group?.Trim(),
                OwnerId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Boards.Add(board);
            await _context.SaveChangesAsync();

            await _context.Entry(board).Reference(b => b.Owner).LoadAsync();

            var boardDto = new BoardDto
            {
                Id = board.Id,
                Name = board.Name,
                Description = board.Description,
                OwnerId = board.OwnerId,
                OwnerUsername = board.Owner.Username,
                Group = board.Group,
                PinsCount = 0,
                CreatedAt = board.CreatedAt
            };

            return CreatedAtAction(nameof(GetBoard), new { id = board.Id }, boardDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Помилка при створенні дошки");
            return StatusCode(500, new { message = "Error creating board" });
        }
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetUserBoards()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "User not authorized" });
            }

            var boards = await _context.Boards
                .Include(b => b.Owner)
                .Include(b => b.BoardPins)
                    .ThenInclude(bp => bp.Pin)
                        .ThenInclude(p => p.Owner)
                .Include(b => b.BoardPins)
                    .ThenInclude(bp => bp.Pin)
                        .ThenInclude(p => p.Likes)
                .Include(b => b.BoardPins)
                    .ThenInclude(bp => bp.Pin)
                        .ThenInclude(p => p.Comments)
                .Where(b => b.OwnerId == userId && !b.IsArchived)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();

            var boardDtos = boards.Select(b =>
            {
                var coverImages = b.BoardPins
                    .OrderByDescending(bp => bp.CreatedAt)
                    .Take(4)
                    .Select(bp => bp.Pin.ImageUrl)
                    .ToList();

                return new BoardDto
                {
                    Id = b.Id,
                    Name = b.Name,
                    Description = b.Description,
                    OwnerId = b.OwnerId,
                    OwnerUsername = b.Owner.Username,
                    Group = b.Group,
                    PinsCount = b.BoardPins.Count,
                    CreatedAt = b.CreatedAt,
                    CoverImages = coverImages
                };
            }).ToList();

            return Ok(boardDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Помилка при отриманні дошок");
            return StatusCode(500, new { message = "Error getting boards" });
        }
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetBoard(int id)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "User not authorized" });
            }

            var board = await _context.Boards
                .Include(b => b.Owner)
                .Include(b => b.BoardPins)
                    .ThenInclude(bp => bp.Pin)
                        .ThenInclude(p => p.Owner)
                .Include(b => b.BoardPins)
                    .ThenInclude(bp => bp.Pin)
                        .ThenInclude(p => p.Likes)
                .Include(b => b.BoardPins)
                    .ThenInclude(bp => bp.Pin)
                        .ThenInclude(p => p.Comments)
                .FirstOrDefaultAsync(b => b.Id == id && b.OwnerId == userId && !b.IsArchived);

            if (board == null)
            {
                return NotFound(new { message = "Board not found" });
            }

            var pinDtos = board.BoardPins
                .OrderByDescending(bp => bp.CreatedAt)
                .Select(bp => new PinDto
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
                })
                .ToList();

            var coverImages = pinDtos
                .Take(4)
                .Select(p => p.ImageUrl)
                .ToList();

            var boardDto = new BoardDto
            {
                Id = board.Id,
                Name = board.Name,
                Description = board.Description,
                OwnerId = board.OwnerId,
                OwnerUsername = board.Owner.Username,
                Group = board.Group,
                PinsCount = board.BoardPins.Count,
                CreatedAt = board.CreatedAt,
                Pins = pinDtos,
                CoverImages = coverImages
            };

            return Ok(boardDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Помилка при отриманні дошки");
            return StatusCode(500, new { message = "Error getting board" });
        }
    }

    [HttpPost("{boardId}/pins/{pinId}")]
    [Authorize]
    public async Task<IActionResult> AddPinToBoard(int boardId, int pinId)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "User not authorized" });
            }

            var board = await _context.Boards
                .FirstOrDefaultAsync(b => b.Id == boardId && b.OwnerId == userId);

            if (board == null)
            {
                return NotFound(new { message = "Board not found" });
            }

            var pin = await _context.Pins.FindAsync(pinId);
            if (pin == null)
            {
                return NotFound(new { message = "Pin not found" });
            }

            if (await _context.BoardPins.AnyAsync(bp => bp.BoardId == boardId && bp.PinId == pinId))
            {
                return BadRequest(new { message = "Pin already in board" });
            }

            var boardPin = new BoardPin
            {
                BoardId = boardId,
                PinId = pinId,
                CreatedAt = DateTime.UtcNow
            };

            _context.BoardPins.Add(boardPin);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Pin added to board successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Помилка при додаванні піна до дошки");
            return StatusCode(500, new { message = "Error adding pin to board" });
        }
    }
}

