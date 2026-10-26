using EmployeeManagement.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagemant.Api.Controllers
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
            try
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
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    message = "An unexpected error occurred while retrieving the dashboard summary."
                });
            }
        }
    }
}
