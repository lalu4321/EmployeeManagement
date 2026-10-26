
import { z } from "zod";

// ========================================
// EMPLOYEE PROFILE VALIDATION
// ========================================

export const profileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must contain at least 2 characters.")
    .max(50, "First name cannot exceed 50 characters.")
    .regex(
      /^\p{L}+(?:[ '-]\p{L}+)*$/u,
      "Enter a valid first name."
    ),

  lastName: z
    .string()
    .trim()
    .min(2, "Last name must contain at least 2 characters.")
    .max(50, "Last name cannot exceed 50 characters.")
    .regex(
      /^\p{L}+(?:[ '-]\p{L}+)*$/u,
      "Enter a valid last name."
    ),

  workEmail: z
    .string()
    .trim()
    .min(1, "Work email is required.")
    .max(254, "Email cannot exceed 254 characters.")
    .email("Enter a valid work email address."),

  phoneNumber: z
    .string()
    .trim()
    .regex(
      /^[6-9]\d{9}$/,
      "Enter a valid 10-digit Indian mobile number."
    ),

  department: z
    .string()
    .trim()
    .min(1, "Department is required.")
    .max(100, "Department cannot exceed 100 characters."),

  jobTitle: z
    .string()
    .trim()
    .min(1, "Job title is required.")
    .max(100, "Job title cannot exceed 100 characters."),

  workLocation: z
    .string()
    .trim()
    .min(1, "Work location is required.")
    .max(100, "Work location cannot exceed 100 characters."),

  address: z
    .string()
    .max(300, "Address cannot exceed 300 characters."),
});
