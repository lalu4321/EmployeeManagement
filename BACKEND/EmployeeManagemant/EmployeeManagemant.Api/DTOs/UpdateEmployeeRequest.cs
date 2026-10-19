
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace EmployeeManagement.Api.DTOs
{
    public class UpdateEmployeeRequest
    {
        public int Id { get; set; }

        [Required]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string WorkEmail { get; set; } = string.Empty;

        public string? PhoneNumber { get; set; }
        public string? Department { get; set; }
        public string? JobTitle { get; set; }
        public string? EmploymentType { get; set; }
        public DateTime JoiningDate { get; set; }
        public string? EmploymentStatus { get; set; }
        public string? WorkLocation { get; set; }
        public string? Address { get; set; }

        public IFormFile? ProfilePicture { get; set; }
    }
}