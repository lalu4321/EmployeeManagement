using EmployeeManagement.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Api.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    [Authorize(Roles = "Admin")]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var totalEmployees = await _context.Employees.CountAsync();

            var activeEmployees = await _context.Employees
                .CountAsync(e => e.EmploymentStatus == "Active");

            var inactiveEmployees = totalEmployees - activeEmployees;

            return Ok(new
            {
                totalEmployees,
                activeEmployees,
                inactiveEmployees
            });
        }
    }
}
