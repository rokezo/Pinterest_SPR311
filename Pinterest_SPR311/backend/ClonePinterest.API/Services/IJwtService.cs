using ClonePinterest.API.Models;

namespace ClonePinterest.API.Services;

public interface IJwtService
{
    string GenerateToken(User user);
}


