using ClonePinterest.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ClonePinterest.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Pin> Pins { get; set; }
    public DbSet<Board> Boards { get; set; }
    public DbSet<BoardPin> BoardPins { get; set; }
    public DbSet<Comment> Comments { get; set; }
    public DbSet<Like> Likes { get; set; }
    public DbSet<Tag> Tags { get; set; }
    public DbSet<PinTag> PinTags { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<Report> Reports { get; set; }
    public DbSet<Follow> Follows { get; set; }
    public DbSet<View> Views { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Унікальність Email
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Унікальність Username
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        // Унікальність Tag Name
        modelBuilder.Entity<Tag>()
            .HasIndex(t => t.Name)
            .IsUnique();

        // Унікальна пара Like (User + Pin)
        modelBuilder.Entity<Like>()
            .HasIndex(l => new { l.UserId, l.PinId })
            .IsUnique();

        // Унікальна пара BoardPin (Board + Pin)
        modelBuilder.Entity<BoardPin>()
            .HasIndex(bp => new { bp.BoardId, bp.PinId })
            .IsUnique();

        // Унікальна пара PinTag (Pin + Tag)
        modelBuilder.Entity<PinTag>()
            .HasIndex(pt => new { pt.PinId, pt.TagId })
            .IsUnique();

        // Унікальна пара Follow (Follower + Following)
        modelBuilder.Entity<Follow>()
            .HasIndex(f => new { f.FollowerId, f.FollowingId })
            .IsUnique();
    }
}


