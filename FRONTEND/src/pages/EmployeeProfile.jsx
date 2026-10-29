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
import "../styles/employeeProfile.css";

export default function EmployeeProfile() {
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      const role = sessionStorage.getItem("role");

      // UI check only. The backend authenticates the cookie.
      if (role?.toLowerCase() !== "employee") {
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

        if (
          err.response?.status === 401 ||
          err.response?.status === 403
        ) {
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

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      sessionStorage.clear();
      navigate("/login", { replace: true });
    }
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
      ? /^https?:\/\//i.test(profilePicture)
        ? profilePicture
        : `https://localhost:7089${
            profilePicture.startsWith("/")
              ? profilePicture
              : `/${profilePicture}`
          }`
      : null;

  const firstName = getValue("firstName", "FirstName");
  const lastName = getValue("lastName", "LastName");

  const fullName =
    [
      firstName !== "Not provided" ? firstName : "",
      lastName !== "Not provided" ? lastName : "",
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
      <div className="profile-loading-page">
        <div className="profile-loading-content">
          <LoaderCircle className="profile-loading-icon" />
          <span>Loading your profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-error-page">
        <div className="profile-error-card">
          <AlertCircle className="profile-error-icon" />

          <h2 className="profile-error-title">
            Profile Loading Failed
          </h2>

          <p className="profile-error-message">{error}</p>

          <div className="profile-error-actions">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="profile-button profile-button-primary"
            >
              Try Again
            </button>

            <button
              type="button"
              onClick={logout}
              className="profile-button profile-button-secondary"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-profile-page">
      <header className="profile-header">
        <div className="profile-header-content">
          <div>
            <h1 className="profile-portal-title">
              Employee Portal
            </h1>

            <p className="profile-header-subtitle">
              My Profile
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="profile-logout-button"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </header>

      <main className="profile-main">
        <section className="profile-hero-card">
          <div className="profile-banner" />

          <div className="profile-hero-content">
            <div className="profile-identity">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={fullName}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                  className="profile-avatar-image"
                />
              ) : (
                <div className="profile-avatar-placeholder">
                  <UserRound size={42} />
                </div>
              )}

              <div className="profile-identity-details">
                <h2 className="profile-employee-name">
                  {fullName}
                </h2>

                <p className="profile-job-title">
                  {getValue("jobTitle", "JobTitle")}
                </p>
              </div>

              <div className="profile-status-wrapper">
                <span className="profile-status-badge">
                  {getValue(
                    "employmentStatus",
                    "EmploymentStatus"
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="profile-details-card">
          <div className="profile-details-heading">
            <h3 className="profile-details-title">
              Personal &amp; Employment Details
            </h3>

            <p className="profile-details-subtitle">
              Your employee information
            </p>
          </div>

          <div className="profile-fields-grid">
            {fields.map(({ label, value, icon: Icon }) => (
              <div className="profile-detail-item" key={label}>
                <div className="profile-detail-icon">
                  <Icon size={19} />
                </div>

                <div className="profile-detail-content">
                  <p className="profile-detail-label">{label}</p>

                  <p className="profile-detail-value">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="profile-footer">
          Employee Management System
        </p>
      </main>
    </div>
  );
}
