import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserRound,
  Mail,
  Phone,
  Building2,
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  LogOut,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";
import api from "../api/axios";

export default function EmployeeProfile() {
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      const token = sessionStorage.getItem("token");
      const role = sessionStorage.getItem("role");

      if (!token || role?.toLowerCase() !== "employee") {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await api.get("/me/profile");

        if (!cancelled) {
          setEmployee(response.data);
        }
      } catch (err) {
        if (cancelled) return;

        if (err.response?.status === 401 ||
            err.response?.status === 403) {
          sessionStorage.clear();
          navigate("/login", { replace: true });
          return;
        }

        setError(
          err.response?.data?.message ||
          "Unable to load employee details. Please try again."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const logout = () => {
    sessionStorage.clear();
    navigate("/login", { replace: true });
  };

  const getValue = (...keys) => {
    for (const key of keys) {
      const value = employee?.[key];
      if (value !== null && value !== undefined && value !== "") {
        return value;
      }
    }
    return "Not provided";
  };

  const formatDate = (value) => {
    if (!value || value === "Not provided") {
      return "Not provided";
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  };

  const profilePicture = getValue(
    "profilePicture",
    "ProfilePicture"
  );

  const imageUrl =
    profilePicture !== "Not provided"
      ? profilePicture.startsWith("http")
        ? profilePicture
        : `https://localhost:7089${
            profilePicture.startsWith("/")
              ? profilePicture
              : `/${profilePicture}`
          }`
      : null;

  const fullName = [
    getValue("firstName", "FirstName") !== "Not provided"
      ? getValue("firstName", "FirstName")
      : "",
    getValue("lastName", "LastName") !== "Not provided"
      ? getValue("lastName", "LastName")
      : "",
  ]
    .filter(Boolean)
    .join(" ") || "Employee";

  const fields = [
    {
      label: "Work Email",
      value: getValue("workEmail", "WorkEmail"),
      icon: Mail,
    },
    {
      label: "Phone Number",
      value: getValue("phoneNumber", "PhoneNumber"),
      icon: Phone,
    },
    {
      label: "Department",
      value: getValue("department", "Department"),
      icon: Building2,
    },
    {
      label: "Job Title",
      value: getValue("jobTitle", "JobTitle"),
      icon: BriefcaseBusiness,
    },
    {
      label: "Employment Type",
      value: getValue("employmentType", "EmploymentType"),
      icon: UserRound,
    },
    {
      label: "Joining Date",
      value: formatDate(
        getValue("joiningDate", "JoiningDate")
      ),
      icon: CalendarDays,
    },
    {
      label: "Employment Status",
      value: getValue("employmentStatus", "EmploymentStatus"),
      icon: UserRound,
    },
    {
      label: "Work Location",
      value: getValue("workLocation", "WorkLocation"),
      icon: MapPin,
    },
    {
      label: "Address",
      value: getValue("address", "Address"),
      icon: MapPin,
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-600">
          <LoaderCircle className="h-6 w-6 animate-spin" />
          <span>Loading your profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-800">
            Profile Loading Failed
          </h2>
          <p className="mt-2 text-sm text-gray-600">{error}</p>

          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Try Again
            </button>

            <button
              onClick={logout}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Employee Portal
            </h1>
            <p className="text-sm text-gray-500">
              My Profile
            </p>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="h-32 bg-gradient-to-r from-blue-700 to-indigo-500" />

          <div className="px-6 pb-6 sm:px-8">
            <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={fullName}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                  className="h-24 w-24 rounded-2xl border-4 border-white bg-white object-cover shadow"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-blue-100 text-blue-700 shadow">
                  <UserRound size={42} />
                </div>
              )}

              <div className="pb-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {fullName}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {getValue("jobTitle", "JobTitle")}
                </p>
              </div>

              <div className="sm:ml-auto sm:pb-2">
                <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                  {getValue(
                    "employmentStatus",
                    "EmploymentStatus"
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Personal & Employment Details
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Your employee information
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex min-w-0 gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <Icon size={19} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="mt-1 break-words text-sm font-medium text-gray-900">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-5 text-center text-xs text-gray-400">
          Employee Management System
        </p>
      </main>
    </div>
  );
}
