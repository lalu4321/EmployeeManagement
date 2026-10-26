using EmployeeManagement.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Api.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAdminAsync(
            ApplicationDbContext context,
            IConfiguration configuration)
        {
            var adminEmail = configuration["SeedAdmin:Email"]?.Trim();
            var adminPassword = configuration["SeedAdmin:Password"];

            if (string.IsNullOrWhiteSpace(adminEmail) ||
                string.IsNullOrWhiteSpace(adminPassword))
            {
                throw new InvalidOperationException(
                    "SeedAdmin email or password is missing.");
            }

            var adminRole = await context.Roles
                .FirstOrDefaultAsync(r => r.RoleName == "Admin");

            if (adminRole == null)
            {
                throw new InvalidOperationException(
                    "Admin role not found in the Roles table.");
            }

            var existingUser = await context.Users
                .FirstOrDefaultAsync(u => u.Email == adminEmail);

            if (existingUser != null)
            {
                existingUser.PasswordHash =
                    BCrypt.Net.BCrypt.HashPassword(adminPassword);

                existingUser.RoleId = adminRole.Id;
                existingUser.IsActive = true;

                await context.SaveChangesAsync();
                return;
            }

            var admin = new User
            {
                Username = "admin",
                Email = adminEmail,
                PasswordHash =
                    BCrypt.Net.BCrypt.HashPassword(adminPassword),
                RoleId = adminRole.Id,
                EmployeeId = null,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            context.Users.Add(admin);
            await context.SaveChangesAsync();
        }

        // Employee account 
        public static async Task SeedEmployeeAsync(
            ApplicationDbContext context,
            IConfiguration configuration)
        {
            var employeeEmail =
                configuration["SeedEmployee:Email"]?.Trim();

            var employeePassword =
                configuration["SeedEmployee:Password"];

            if (string.IsNullOrWhiteSpace(employeeEmail) ||
                string.IsNullOrWhiteSpace(employeePassword))
            {
                throw new InvalidOperationException(
                    "SeedEmployee email or password is missing.");
            }

            const int employeeId = 2;

            var employee = await context.Employees
                .FirstOrDefaultAsync(e => e.Id == employeeId);

            if (employee == null)
            {
                throw new InvalidOperationException(
                    $"Employee ID {employeeId} was not found.");
            }

            var employeeRole = await context.Roles
                .FirstOrDefaultAsync(r => r.RoleName == "Employee");

            if (employeeRole == null)
            {
                throw new InvalidOperationException(
                    "Employee role not found in the Roles table.");
            }

            var user = await context.Users
                .FirstOrDefaultAsync(u => u.Email == employeeEmail);

            if (user == null)
            {
                user = new User
                {
                    Username = "employee2",
                    Email = employeeEmail,
                    EmployeeId = employee.Id,
                    RoleId = employeeRole.Id,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                context.Users.Add(user);
            }

            user.EmployeeId = employee.Id;
            user.RoleId = employeeRole.Id;
            user.IsActive = true;
            user.PasswordHash =
                BCrypt.Net.BCrypt.HashPassword(employeePassword);

            await context.SaveChangesAsync();
        }
    }
}
