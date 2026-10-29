using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EmployeeManagement.Api.Data;
using EmployeeManagement.Api.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace EmployeeManagement.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(
            ApplicationDbContext context,
            IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(
    [FromBody] LoginRequest request)
        {
            try
            {
                var email = request.Email.Trim();

                var user = await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u =>
                        u.Email == email && u.IsActive);

                if (user == null ||
                    !BCrypt.Net.BCrypt.Verify(
                        request.Password, user.PasswordHash))
                {
                    return Unauthorized(new
                    {
                        message = "Invalid email or password."
                    });
                }

                if (user.Role == null)
                {
                    return Unauthorized(new
                    {
                        message = "User role is not configured."
                    });
                }

                var key = _configuration["Jwt:Key"]!;
                var issuer = _configuration["Jwt:Issuer"]!;
                var audience = _configuration["Jwt:Audience"]!;

                var claims = new[]
                {
            new Claim(
                ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.RoleName)
        };

                var signingKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(key));

                var credentials = new SigningCredentials(
                    signingKey, SecurityAlgorithms.HmacSha256);

                var token = new JwtSecurityToken(
                    issuer: issuer,
                    audience: audience,
                    claims: claims,
                    expires: DateTime.UtcNow.AddHours(2),
                    signingCredentials: credentials);

                var tokenString =
                    new JwtSecurityTokenHandler().WriteToken(token);

                Response.Cookies.Append(
                    "accessToken",
                    tokenString,
                    new CookieOptions
                    {
                        HttpOnly = true,
                        Secure = true,
                        SameSite = SameSiteMode.None,
                        Expires = new DateTimeOffset(token.ValidTo),
                        Path = "/"
                    });

                // Never return the JWT in the response body.
                return Ok(new
                {
                    Email = user.Email,
                    Role = user.Role.RoleName,
                    EmployeeId = user.EmployeeId
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    message =
                        "An unexpected error occurred during login."
                });
            }
        }
    }
}
