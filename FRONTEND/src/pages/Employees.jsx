import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  Users,
  AlertCircle,
  Eye,
  Pencil,
  Trash2,
  UserPlus,
  Building2,
  BriefcaseBusiness,
  X,
} from "lucide-react";
import api from "../api/axios";
import "../styles/employees.css";

function getFullName(employee) {
  return [employee.firstName, employee.lastName]
    .filter(Boolean)
    .join(" ");
}

function getStatus(employee) {
  const value = String(employee.employmentStatus || "Unknown")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase();

  return value === "onleave"
    ? "On Leave"
    : value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusStyle(status) {
  switch (status.toLowerCase()) {
    case "active":
      return "employee-status-active";
    case "on leave":
      return "employee-status-on-leave";
    case "terminated":
      return "employee-status-terminated";
    default:
      return "employee-status-default";
  }
}

function getProfilePictureUrl(path) {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `https://localhost:7089${
    path.startsWith("/") ? "" : "/"
  }${path}`;
}

function getInitials(employee) {
  return (
    `${employee.firstName?.[0] || ""}${
      employee.lastName?.[0] || ""
    }`.toUpperCase() || "E"
  );
}

export default function Employees() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const loadEmployees = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get("/employees");
      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.$values)
            ? data.$values
            : null;

      if (!list) {
        throw new Error("Unexpected employee data format.");
      }

      setEmployees(list);
    } catch (err) {
      const message =
        err.response?.status === 401
          ? "Your session has expired. Please sign in again."
          : err.response?.status === 403
            ? "Admin access is required to view employee records."
            : err.message === "Unexpected employee data format."
              ? err.message
              : "Could not load employees. Check the backend connection.";

      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return employees;

    return employees.filter((employee) =>
      [
        getFullName(employee),
        employee.workEmail,
        employee.department,
        employee.jobTitle,
        employee.workLocation,
        getStatus(employee),
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [employees, search]);

  function viewEmployee(employee) {
    navigate(`/employees/${employee.id}`);
  }

  function editEmployee(employee) {
    navigate(`/employees/${employee.id}/edit`);
  }

  async function deleteEmployee(employee) {
    const name = getFullName(employee) || "this employee";

    const confirmed = window.confirm(
      `Are you sure you want to delete ${name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(employee.id);
    setError("");

    try {
      await api.delete(`/employees/${employee.id}`);

      setEmployees((current) =>
        current.filter((item) => item.id !== employee.id)
      );

      window.alert("Employee deleted successfully.");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.response?.status === 401
          ? "Your session has expired. Please sign in again."
          : err.response?.status === 403
            ? "Admin access is required."
            : "Could not delete employee. Check the backend endpoint.");

      setError(message);
      window.alert(message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="employees-page">
      <div className="employees-container">
        {/* Page heading */}
        <section className="employees-page-heading">
          <div>
            <p className="employees-breadcrumb">
              Management / Directory
            </p>

            <h1 className="employees-page-title">Employees</h1>

            <p className="employees-page-description">
              View, search and manage employee records from one place.
            </p>
          </div>

          <div className="employees-header-actions">
            <button
              type="button"
              onClick={() => loadEmployees(true)}
              disabled={refreshing || loading}
              className="employees-button employees-refresh-button"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "employees-spin" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/employees/new")}
              className="employees-button employees-add-button"
            >
              <UserPlus size={18} />
              Add employee
            </button>
          </div>
        </section>

        {/* Employee count */}
        <section className="employees-summary-grid">
          <article className="employees-summary-card">
            <div className="employees-summary-content">
              <div className="employees-summary-icon">
                <Users size={24} />
              </div>

              <div>
                <p className="employees-summary-label">
                  Total employees
                </p>

                <p className="employees-summary-count">
                  {loading ? "—" : employees.length}
                </p>

                <p className="employees-summary-caption">
                  Employee records in the system
                </p>
              </div>
            </div>
          </article>
        </section>

        {/* Error message */}
        {error && (
          <div className="employees-error-alert" role="alert">
            <AlertCircle
              size={19}
              className="employees-error-icon"
            />

            <div className="employees-error-content">
              <p className="employees-error-heading">
                Unable to complete the request
              </p>

              <p className="employees-error-message">{error}</p>

              {error.includes("session has expired") && (
                <button
                  type="button"
                  onClick={() =>
                    navigate("/login", { replace: true })
                  }
                  className="employees-sign-in-link"
                >
                  Sign in again
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="employees-dismiss-error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Employee directory */}
        <section className="employees-directory-card">
          <div className="employees-directory-header">
            <div>
              <div className="employees-directory-title-row">
                <h2 className="employees-directory-title">
                  Employee directory
                </h2>

                {!loading && (
                  <span className="employees-result-count">
                    {filteredEmployees.length}
                  </span>
                )}
              </div>

              <p className="employees-directory-description">
                Select View to open an employee&apos;s details.
              </p>
            </div>

            <div className="employees-search-wrapper">
              <Search
                size={18}
                className="employees-search-icon"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employees..."
                aria-label="Search employees"
                className="employees-search-input"
              />
            </div>
          </div>

          {loading ? (
            <div className="employees-loading-skeleton">
              <div className="employees-skeleton-heading" />
              <div className="employees-skeleton-row" />
              <div className="employees-skeleton-row" />
            </div>
          ) : (
            <div className="employees-table-wrapper">
              <table className="employees-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Job title</th>
                    <th>Status</th>
                    <th className="employees-actions-heading">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEmployees.map((employee) => {
                    const name =
                      getFullName(employee) || "Unnamed employee";

                    const pictureUrl = getProfilePictureUrl(
                      employee.profilePicture
                    );

                    const status = getStatus(employee);

                    return (
                      <tr key={employee.id}>
                        <td>
                          <div className="employees-person-cell">
                            {pictureUrl ? (
                              <img
                                src={pictureUrl}
                                alt=""
                                className="employees-avatar-image"
                                onError={(event) => {
                                  event.currentTarget.style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              <div className="employees-avatar-placeholder">
                                {getInitials(employee)}
                              </div>
                            )}

                            <div className="employees-person-details">
                              <button
                                type="button"
                                onClick={() => viewEmployee(employee)}
                                className="employees-person-name"
                                title="View employee details"
                              >
                                {name}
                              </button>

                              <p className="employees-person-email">
                                {employee.workEmail ||
                                  "No email provided"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="employees-table-detail">
                            <Building2
                              size={15}
                              className="employees-table-icon"
                            />
                            {employee.department || "—"}
                          </span>
                        </td>

                        <td>
                          <span className="employees-table-detail">
                            <BriefcaseBusiness
                              size={15}
                              className="employees-table-icon"
                            />
                            {employee.jobTitle || "—"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`employees-status-badge ${getStatusStyle(
                              status
                            )}`}
                          >
                            <span className="employees-status-dot" />
                            {status}
                          </span>
                        </td>

                        <td>
                          <div className="employees-row-actions">
                            {/* View */}
                            <button
                              type="button"
                              onClick={() => viewEmployee(employee)}
                              title="View employee"
                              aria-label={`View ${name}`}
                              className="employees-action-button employees-view-button"
                            >
                              <Eye size={17} />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => editEmployee(employee)}
                              title="Edit employee"
                              aria-label={`Edit ${name}`}
                              className="employees-action-button employees-edit-button"
                            >
                              <Pencil size={17} />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => deleteEmployee(employee)}
                              disabled={deletingId === employee.id}
                              title="Delete employee"
                              aria-label={`Delete ${name}`}
                              className="employees-action-button employees-delete-button"
                            >
                              {deletingId === employee.id ? (
                                <RefreshCw
                                  size={17}
                                  className="employees-spin"
                                />
                              ) : (
                                <Trash2 size={17} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="employees-empty-cell"
                      >
                        <div className="employees-empty-icon">
                          {search ? (
                            <Search size={24} />
                          ) : (
                            <Users size={24} />
                          )}
                        </div>

                        <p className="employees-empty-title">
                          {search
                            ? "No matching employees found"
                            : "No employees found"}
                        </p>

                        <p className="employees-empty-description">
                          {search
                            ? "Try searching with another name, email or department."
                            : "Add an employee to get started."}
                        </p>

                        {!search && (
                          <button
                            type="button"
                            onClick={() =>
                              navigate("/employees/new")
                            }
                            className="employees-empty-add-button"
                          >
                            <UserPlus size={17} />
                            Add employee
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="employees-directory-footer">
            <span>
              {loading
                ? "Loading employee records..."
                : `Showing ${filteredEmployees.length} of ${employees.length} employees`}
            </span>

            <span>Employee Management System</span>
          </div>
        </section>
      </div>
    </main>
  );
}
