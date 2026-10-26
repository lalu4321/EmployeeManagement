import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .max(254, "Email cannot exceed 254 characters.")
    .email("Enter a valid email address."),

  password: z
    .string()
    .min(1, "Password is required."),
});
