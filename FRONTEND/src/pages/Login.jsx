import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";
import { loginSchema } from "../validators/validation";
import "../styles/login.css";

export default function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values) => {
    setServerError("");

    try {
      const { data } = await api.post("/auth/login", {
        email: values.email.trim(),
        password: values.password,
      });

      // The JWT is stored in the HttpOnly cookie by the backend.
      // Never store the JWT in sessionStorage or localStorage.
      if (!data?.role) {
        setServerError("The server did not return a user role.");
        return;
      }

      const role = String(data.role).trim().toLowerCase();

      // Allow only supported application roles.
      if (!["admin", "employee"].includes(role)) {
        setServerError("Unsupported account role.");
        return;
      }

      // Store only non-sensitive UI information.
      sessionStorage.clear();
      sessionStorage.setItem("role", role);
      sessionStorage.setItem(
        "email",
        data.email ?? values.email.trim()
      );

      if (data.employeeId != null) {
        sessionStorage.setItem(
          "employeeId",
          String(data.employeeId)
        );
      }

      // Navigate according to the user's role.
      navigate(role === "admin" ? "/admin" : "/profile", {
        replace: true,
      });
    } catch (error) {
      if (error.response?.status === 401) {
        setServerError(
          error.response?.data?.message ||
            "Invalid email or password."
        );
      } else if (error.response?.status === 403) {
        setServerError(
          error.response?.data?.message ||
            "This account is not allowed to sign in."
        );
      } else if (error.code === "ERR_NETWORK") {
        setServerError(
          "Cannot connect to the backend. Make sure the API is running."
        );
      } else {
        setServerError(
          error.response?.data?.message ||
            "Login failed. Please try again."
        );
      }
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-logo">
          <Users size={28} />
        </div>

        <h1 className="login-title">
          Employee Management
        </h1>

        <p className="login-subtitle">
          Sign in to access your account
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="login-form"
          noValidate
        >
          {/* Email */}
          <div className="login-field">
            <label htmlFor="email" className="login-label">
              Email address
            </label>

            <div
              className={`login-input-wrapper ${
                errors.email ? "login-input-invalid" : ""
              }`}
            >
              <Mail
                size={18}
                className="login-input-icon"
              />

              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="you@company.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={
                  errors.email ? "email-error" : undefined
                }
                {...register("email")}
                className="login-input"
              />
            </div>

            {errors.email && (
              <p
                id="email-error"
                className="login-field-error"
              >
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="login-field">
            <label htmlFor="password" className="login-label">
              Password
            </label>

            <div
              className={`login-input-wrapper ${
                errors.password ? "login-input-invalid" : ""
              }`}
            >
              <LockKeyhole
                size={18}
                className="login-input-icon"
              />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                {...register("password")}
                className="login-input"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                aria-pressed={showPassword}
                className="login-password-toggle"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {errors.password && (
              <p
                id="password-error"
                className="login-field-error"
              >
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Server error */}
          {serverError && (
            <p
              role="alert"
              className="login-server-error"
            >
              {serverError}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="login-submit-button"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="login-footer">
          Authorized users only
        </p>
      </section>
    </main>
  );
}
