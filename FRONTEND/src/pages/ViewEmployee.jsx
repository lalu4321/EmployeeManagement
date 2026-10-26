import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  UserRound,
  Mail,
  Phone,
  Building2,
  Briefcase,
  MapPin,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import api from "../api/axios";
import "../styles/viewEmployee.css";

const API_BASE_URL = "https://localhost:7089";

function getProfilePictureUrl(path) {
  if (!path) return null;

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
}

function formatDate(value) {
  if (!value) return "";

  // Preserve the date returned by the API without timezone shifting.
  return String(value).slice(0, 10);
}

export default function ViewEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pictureError, setPictureError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadEmployee() {
      setLoading(true);
      setError("");
      setEmployee(null);
      setPictureError(false);

      try {
        const response = await api.get(`/employees/${id}`);

        if (active) {
          setEmployee(response.data);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              (err.response?.status === 404
                ? "Employee not found."
                : err.response?.status === 401
                  ? "Your session has expired. Please sign in again."
                  : err.response?.status === 403
                    ? "You do not have permission to view this employee."
                    : "Unable to load employee details. Please try again.")
          );

          if (err.response?.status === 401) {
            sessionStorage.clear();
            localStorage.clear();
            navigate("/login", { replace: true });
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (id && /^\d+$/.test(id)) {
      loadEmployee();
    } else {
      setError("Invalid employee ID.");
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [id, navigate]);

  if (loading) {
    return (
      <main className="view-employee-loading">
        <p>Loading employee details...</p>
      </main>
    );
  }

  if (error || !employee) {
    return (
      <main className="view-employee-error-page">
        <div className="view-employee-error-card">
          <p className="view-employee-error-message">
            {error || "Employee not found."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/employees")}
            className="view-employee-button view-employee-button-primary"
          >
            Back to Employees
          </button>
        </div>
      </main>
    );
  }

  const fullName = [employee.firstName, employee.lastName]
    .filter(Boolean)
    .join(" ");

  const pictureUrl = getProfilePictureUrl(employee.profilePicture);

  const details = [
    { label: "Employee ID", value: employee.id },
    { label: "First Name", value: employee.firstName },
    { label: "Last Name", value: employee.lastName },
    { label: "Work Email", value: employee.workEmail, icon: Mail },
    { label: "Phone Number", value: employee.phoneNumber, icon: Phone },
    { label: "Department", value: employee.department, icon: Building2 },
    { label: "Job Title", value: employee.jobTitle, icon: Briefcase },
    { label: "Employment Type", value: employee.employmentType },
    {
      label: "Employment Status",
      value: employee.employmentStatus,
      icon: ShieldCheck,
    },
    {
      label: "Joining Date",
      value: formatDate(employee.joiningDate),
      icon: CalendarDays,
    },
    {
      label: "Work Location",
      value: employee.workLocation,
      icon: MapPin,
    },
    { label: "Address", value: employee.address },
    {
      label: "Created At",
      value: formatDate(employee.createdAt),
    },
    {
      label: "Last Updated",
      value: formatDate(employee.updatedAt),
    },
  ];

  return (
    <main className="view-employee-page">
      <div className="view-employee-container">
        <button
          type="button"
          onClick={() => navigate("/employees")}
          className="view-employee-back-link"
        >
          <ArrowLeft size={18} />
          Back to Employees
        </button>

        <section className="view-employee-card">
          {/* Employee header */}
          <div className="view-employee-header">
            <div className="view-employee-identity">
              {pictureUrl && !pictureError ? (
                <img
                  src={pictureUrl}
                  alt={fullName || "Employee"}
                  onError={() => setPictureError(true)}
                  className="view-employee-avatar"
                />
              ) : (
                <div className="view-employee-avatar-placeholder">
                  <UserRound size={38} />
                </div>
              )}

              <div className="view-employee-identity-details">
                <h1 className="view-employee-name">
                  {fullName || "Employee"}
                </h1>

                <p className="view-employee-job-title">
                  {employee.jobTitle || "Job title not provided"}
                </p>

                <p className="view-employee-id">
                  Employee ID: {employee.id}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/employees/${id}/edit`)}
              className="view-employee-button view-employee-edit-button"
            >
              Edit Employee
            </button>
          </div>

          {/* Employee information */}
          <div className="view-employee-details-section">
            <h2 className="view-employee-details-heading">
              Complete Employee Details
            </h2>

            <div className="view-employee-details-grid">
              {details.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="view-employee-detail-item"
                >
                  <div className="view-employee-detail-label">
                    {Icon && <Icon size={16} />}
                    <p>{label}</p>
                  </div>

                  <p className="view-employee-detail-value">
                    {value !== null &&
                    value !== undefined &&
                    value !== ""
                      ? String(value)
                      : "Not provided"}
                  </p>
                </div>
              ))}
            </div>

            <div className="view-employee-bottom-actions">
              <button
                type="button"
                onClick={() => navigate("/employees")}
                className="view-employee-button view-employee-button-secondary"
              >
                Back to Employee Directory
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
