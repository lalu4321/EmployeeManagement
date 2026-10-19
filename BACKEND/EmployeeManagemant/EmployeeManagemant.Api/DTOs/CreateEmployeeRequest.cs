using System;
using System.ComponentModel.DataAnnotations;

namespace EmployeeManagement.Api.DTOs
{
    public class CreateEmployeeRequest
    {
        [Required]
        [StringLength(50, MinimumLength = 2)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(50, MinimumLength = 2)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(254)]
        public string WorkEmail { get; set; } = string.Empty;

        [Required]
        [StringLength(72, MinimumLength = 8)]
        [RegularExpression(
            @"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$",
            ErrorMessage = "Password must contain uppercase, lowercase, a number, and a special character.")]
        public string Password { get; set; } = string.Empty;

        public string? PhoneNumber { get; set; }

        public string? Department { get; set; }

        public string? JobTitle { get; set; }

        public string? EmploymentType { get; set; }

        [Required]
        public DateTime JoiningDate { get; set; }

        public string? EmploymentStatus { get; set; }

        public string? WorkLocation { get; set; }

        [StringLength(300)]
        public string? Address { get; set; }
    }
}
