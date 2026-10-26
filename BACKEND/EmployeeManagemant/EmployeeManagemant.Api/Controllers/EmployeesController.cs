using EmployeeManagement.Api.Data;
using EmployeeManagement.Api.DTOs;
using EmployeeManagement.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class EmployeesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public EmployeesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/employees
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Employee>>> GetEmployees()
        {
            var employees = await _context.Employees.ToListAsync();
            return Ok(employees);
        }

        // GET: api/employees/1
        [HttpGet("{id:int}")]
        public async Task<ActionResult<Employee>> GetEmployee(int id)
        {
            var employee = await _context.Employees.FindAsync(id);

            if (employee == null)
            {
                return NotFound(new
                {
                    message = "Employee not found."
                });
            }

            return Ok(employee);
        }

        // POST: api/employees
        // Creates employee details and the employee's login account.
        [HttpPost]
        public async Task<IActionResult> CreateEmployee(
            [FromBody] CreateEmployeeRequest request)
        {
            var email = request.WorkEmail.Trim();

            // Check for duplicate emails in both tables.
            var userExists = await _context.Users
                .AnyAsync(u => u.Email.ToLower() == email.ToLower());

            var employeeExists = await _context.Employees
                .AnyAsync(e => e.WorkEmail.ToLower() == email.ToLower());

            if (userExists || employeeExists)
            {
                return Conflict(new
                {
                    message = "This work email is already registered."
                });
            }

            // Find the Employee role.
            var employeeRole = await _context.Roles
                .FirstOrDefaultAsync(r => r.RoleName == "Employee");

            if (employeeRole == null)
            {
                return BadRequest(new
                {
                    message = "Employee role is not configured in the database."
                });
            }

            var employee = new Employee
            {
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                WorkEmail = email,
                PhoneNumber = request.PhoneNumber,
                Department = request.Department,
                JobTitle = request.JobTitle,
                EmploymentType = request.EmploymentType,
                JoiningDate = request.JoiningDate,
                EmploymentStatus = request.EmploymentStatus,
                WorkLocation = request.WorkLocation,
                Address = request.Address,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Save both records atomically.
            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                _context.Employees.Add(employee);
                await _context.SaveChangesAsync();

                var user = new User
                {
                    Username = email,
                    Email = email,
                    PasswordHash =
                        BCrypt.Net.BCrypt.HashPassword(request.Password),
                    RoleId = employeeRole.Id,
                    EmployeeId = employee.Id,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return CreatedAtAction(
                    nameof(GetEmployee),
                    new { id = employee.Id },
                    new
                    {
                        employee.Id,
                        employee.FirstName,
                        employee.LastName,
                        employee.WorkEmail,
                        message = "Employee and login account created successfully."
                    });
            }
            catch (DbUpdateException)
            {
                await transaction.RollbackAsync();

                return Conflict(new
                {
                    message = "Could not create the employee account. Check for duplicate email or username."
                });
            }
        }

        // PUT: api/employees/1
        [HttpPut("{id:int}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateEmployee(
            int id,
            [FromForm] UpdateEmployeeRequest request)
        {
            if (id != request.Id)
            {
                return BadRequest(new
                {
                    message = "Employee ID mismatch."
                });
            }

            var existingEmployee =
                await _context.Employees.FindAsync(id);

            if (existingEmployee == null)
            {
                return NotFound(new
                {
                    message = "Employee not found."
                });
            }

            string? newPhotoPath = null;

            if (request.ProfilePicture != null)
            {
                var photo = request.ProfilePicture;

                var allowedExtensions =
                    new[] { ".jpg", ".jpeg", ".png", ".webp" };

                var extension =
                    Path.GetExtension(photo.FileName).ToLowerInvariant();

                if (!allowedExtensions.Contains(extension))
                {
                    return BadRequest(new
                    {
                        message = "Only JPG, JPEG, PNG, and WEBP images are allowed."
                    });
                }

                if (photo.Length == 0 ||
                    photo.Length > 5 * 1024 * 1024)
                {
                    return BadRequest(new
                    {
                        message = "Photo must be between 1 byte and 5 MB."
                    });
                }

                var uploadsFolder = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot",
                    "uploads");

                Directory.CreateDirectory(uploadsFolder);

                var fileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadsFolder, fileName);

                await using (var stream = new FileStream(
                    filePath, FileMode.CreateNew))
                {
                    await photo.CopyToAsync(stream);
                }

                newPhotoPath = $"/uploads/{fileName}";
            }

            existingEmployee.FirstName = request.FirstName;
            existingEmployee.LastName = request.LastName;
            existingEmployee.WorkEmail = request.WorkEmail;
            existingEmployee.PhoneNumber = request.PhoneNumber;
            existingEmployee.Department = request.Department;
            existingEmployee.JobTitle = request.JobTitle;
            existingEmployee.EmploymentType = request.EmploymentType;
            existingEmployee.JoiningDate = request.JoiningDate;
            existingEmployee.EmploymentStatus = request.EmploymentStatus;
            existingEmployee.WorkLocation = request.WorkLocation;
            existingEmployee.Address = request.Address;

            // Keep the existing photo if no new photo was uploaded.
            if (newPhotoPath != null)
            {
                existingEmployee.ProfilePicture = newPhotoPath;
            }

            existingEmployee.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/employees/1
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            var employee = await _context.Employees
                .FindAsync(id);

            if (employee == null)
            {
                return NotFound(new
                {
                    message = "Employee not found."
                });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.EmployeeId == id);

            if (user != null)
            {
                _context.Users.Remove(user);
            }

            _context.Employees.Remove(employee);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
