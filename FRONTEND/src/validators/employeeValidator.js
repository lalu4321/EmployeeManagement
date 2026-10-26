
import { z } from "zod";

// ========================================
// DROPDOWN OPTIONS
// ========================================

export const departments = [
  "IT",
  "HR",
  "Finance",
  "Sales",
  "Operations",
];

export const employmentTypes = [
  "FullTime",
  "PartTime",
  "Contract",
  "Intern",
];

export const employmentStatuses = [
  "Active",
  "OnLeave",
  "Inactive",
];

// ========================================
// DATE HELPERS
// ========================================

export function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getMinimumJoiningDate() {
  const date = new Date();

  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - 7);

  return getLocalDateString(date);
}

function isValidDateString(value) {
  if (typeof value !== "string") return false;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

// ========================================
// SHARED VALIDATION
// ========================================

const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must contain at least 2 characters.")
  .max(50, "Name cannot exceed 50 characters.")
  .regex(
    /^\p{L}+(?:[ '-]\p{L}+)*$/u,
    "Enter a valid name using letters, spaces, apostrophes, or hyphens."
  );

const workEmailSchema = z
  .string()
  .trim()
  .min(1, "Work email is required.")
  .max(254, "Email cannot exceed 254 characters.")
  .email("Enter a valid work email address.");

const phoneNumberSchema = z
  .string()
  .trim()
  .regex(
    /^[6-9]\d{9}$/,
    "Enter a valid 10-digit Indian mobile number."
  );

const departmentSchema = z
  .string()
  .refine(
    (value) => departments.includes(value),
    "Select a valid department."
  );

const employmentTypeSchema = z
  .string()
  .refine(
    (value) => employmentTypes.includes(value),
    "Select a valid employment type."
  );

const employmentStatusSchema = z
  .string()
  .refine(
    (value) => employmentStatuses.includes(value),
    "Select a valid employment status."
  );

const joiningDateSchema = z
  .string()
  .min(1, "Joining date is required.")
  .refine(isValidDateString, "Enter a valid joining date.");

const jobTitleSchema = z
  .string()
  .trim()
  .min(1, "Job title is required.")
  .max(100, "Job title cannot exceed 100 characters.");

const workLocationSchema = z
  .string()
  .trim()
  .min(1, "Work location is required.")
  .max(100, "Work location cannot exceed 100 characters.");

const addressSchema = z
  .string()
  .max(300, "Address cannot exceed 300 characters.");

// ========================================
// PASSWORD VALIDATION
// ========================================

const passwordSchema = z
  .string()
  .min(8, "Password must contain at least 8 characters.")
  .max(72, "Password cannot exceed 72 characters.")
  .regex(/[A-Z]/, "Include at least one uppercase letter.")
  .regex(/[a-z]/, "Include at least one lowercase letter.")
  .regex(/[0-9]/, "Include at least one number.")
  .regex(
    /[^A-Za-z0-9]/,
    "Include at least one special character."
  );

// ========================================
// ADD EMPLOYEE VALIDATION
// ========================================

export const employeeSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    workEmail: workEmailSchema,
    phoneNumber: phoneNumberSchema,
    department: departmentSchema,
    jobTitle: jobTitleSchema,
    employmentType: employmentTypeSchema,

    joiningDate: joiningDateSchema.refine(
      (value) => value >= getMinimumJoiningDate(),
      "Joining date cannot be earlier than 7 days ago."
    ),

    employmentStatus: employmentStatusSchema,
    workLocation: workLocationSchema,
    address: addressSchema,
    password: passwordSchema,

    confirmPassword: z
      .string()
      .min(1, "Please confirm the password."),
  })
  .superRefine((values, context) => {
    if (
      values.confirmPassword.length > 0 &&
      values.password !== values.confirmPassword
    ) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

// ========================================
// EDIT EMPLOYEE VALIDATION
// ========================================

export const editEmployeeSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  workEmail: workEmailSchema,
  phoneNumber: phoneNumberSchema,
  department: departmentSchema,
  jobTitle: jobTitleSchema,
  employmentType: employmentTypeSchema,
  joiningDate: joiningDateSchema,
  employmentStatus: employmentStatusSchema,
  workLocation: workLocationSchema,
  address: addressSchema,
});

// ========================================
// PROFILE PICTURE VALIDATION
// ========================================

export function validateProfilePicture(file) {
  if (!file) return "";

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    return "Choose a JPG, JPEG, PNG, or WEBP image.";
  }

  const maxSize = 5 * 1024 * 1024;

  if (file.size === 0 || file.size > maxSize) {
    return "Image size must be greater than 0 bytes and no more than 5 MB.";
  }

  return "";
}
