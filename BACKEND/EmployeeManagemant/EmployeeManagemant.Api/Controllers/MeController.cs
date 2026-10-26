using System.Security.Claims;
using EmployeeManagement.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Api.Controllers
{
    [ApiController]
    [Route("api/me")]
    [Authorize(Roles = "Employee")]
    public class MeController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MeController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userIdValue = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (!int.TryParse(userIdValue, out var userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u =>
                    u.Id == userId && u.IsActive);

            if (user == null || user.EmployeeId == null)
            {
                return NotFound(new
                {
                    message = "Employee profile not found."
                });
            }

            var employee = await _context.Employees
                .AsNoTracking()
                .Where(e => e.Id == user.EmployeeId)
                .Select(e => new
                {
                    e.Id,
                    e.FirstName,
                    e.LastName,
                    e.WorkEmail,
                    e.PhoneNumber,
                    e.Department,
                    e.JobTitle,
                    e.EmploymentType,
                    e.JoiningDate,
                    e.EmploymentStatus,
                    e.WorkLocation,
                    e.Address,
                    e.ProfilePicture
                })
                .FirstOrDefaultAsync();

            if (employee == null)
            {
                return NotFound(new
                {
                    message = "Employee profile not found."
                });
            }

            return Ok(employee);
        }
    }
}
