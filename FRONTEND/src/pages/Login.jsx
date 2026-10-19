import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
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

      if (!data?.token || !data?.role) {
        setServerError("The server did not return a token or role.");
        return;
      }

      const role = String(data.role).trim().toLowerCase();

      if (!["admin", "employee"].includes(role)) {
        setServerError("Unsupported account role.");
        return;
      }

      // Clear the previous tab session.
      sessionStorage.clear();

      // Save the new login session.
      sessionStorage.setItem("token", data.token);
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

      // Redirect according to the user's role.
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
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white">
          <Users size={28} />
        </div>

        <h1 className="text-center text-3xl font-bold text-slate-900">
          Employee Management
        </h1>

        <p className="mt-2 text-center text-sm text-slate-500">
          Sign in to access your account
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-8 space-y-5"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium"
            >
              Email address
            </label>

            <div className="flex items-center gap-3 rounded-lg border border-slate-300 px-3">
              <Mail size={18} className="text-slate-400" />

              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="you@company.com"
                {...register("email")}
                className="w-full py-3 outline-none"
              />
            </div>

            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Password
            </label>

            <div className="flex items-center gap-3 rounded-lg border border-slate-300 px-3">
              <LockKeyhole size={18} className="text-slate-400" />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                {...register("password")}
                className="w-full py-3 outline-none"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                className="text-slate-500"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Authorized users only
        </p>
      </section>
    </main>
  );
}
