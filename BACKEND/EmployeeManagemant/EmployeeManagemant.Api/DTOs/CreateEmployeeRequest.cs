using System;
using System.ComponentModel.DataAnnotations;

namespace EmployeeManagement.Api.DTOs
{
    public class CreateEmployeeRequest
    {
        [Required(ErrorMessage = "First name is required.")]
        [StringLength(50, MinimumLength = 2,
            ErrorMessage = "First name must be between 2 and 50 characters.")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required.")]
        [StringLength(50, MinimumLength = 2,
            ErrorMessage = "Last name must be between 2 and 50 characters.")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Work email is required.")]
        [EmailAddress(ErrorMessage = "Enter a valid email address.")]
        [StringLength(254,
            ErrorMessage = "Email cannot exceed 254 characters.")]
        public string WorkEmail { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required.")]
        [StringLength(72, MinimumLength = 8,
            ErrorMessage = "Password must be between 8 and 72 characters.")]
        [RegularExpression(
            @"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$",
            ErrorMessage = "Password must contain an uppercase letter, a lowercase letter, a number, and a special character.")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Please confirm the password.")]
        [Compare(nameof(Password),
            ErrorMessage = "Passwords do not match.")]
        public string ConfirmPassword { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Enter a valid phone number.")]
        [StringLength(20,
            ErrorMessage = "Phone number cannot exceed 20 characters.")]
        public string? PhoneNumber { get; set; }

        [StringLength(100)]
        public string? Department { get; set; }

        [StringLength(100)]
        public string? JobTitle { get; set; }

        [StringLength(50)]
        public string? EmploymentType { get; set; }

        [Required(ErrorMessage = "Joining date is required.")]
        public DateTime JoiningDate { get; set; }

        [StringLength(50)]
        public string? EmploymentStatus { get; set; }

        [StringLength(100)]
        public string? WorkLocation { get; set; }

        [StringLength(300,
            ErrorMessage = "Address cannot exceed 300 characters.")]
        public string? Address { get; set; }
    }
}
