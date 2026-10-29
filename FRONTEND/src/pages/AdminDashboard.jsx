import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  LogOut,
  RefreshCw,
  LayoutDashboard,
  Building2,
  UserCheck,
  UserX,
  Eye,
  Pencil,
  Trash2,
  ArrowRight,
  AlertCircle,
  BriefcaseBusiness,
  CalendarDays,
  X,
  TrendingUp,
  ChevronRight,
  Search,
} from "lucide-react";

import api from "../api/axios";
import "../styles/dashboard.css";

const API_BASE_URL = "https://localhost:7089";

function getFullName(employee) {
  return [employee.firstName, employee.lastName]
    .filter(Boolean)
    .join(" ");
}

function getInitials(employee) {
  return (
    `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`
      .toUpperCase() || "E"
  );
}

function getStatus(employee) {
  const status = String(employee.employmentStatus || "Inactive")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase();

  return status === "onleave"
    ? "On Leave"
    : status.replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getProfilePictureUrl(path) {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
}

function StatusBadge({ status }) {
  const normalized = status.toLowerCase();

  const statusClass =
    normalized === "active"
      ? "dashboard-status-active"
      : normalized === "on leave"
        ? "dashboard-status-on-leave"
        : normalized === "terminated"
          ? "dashboard-status-terminated"
          : "dashboard-status-default";

  return (
    <span className={`dashboard-status-badge ${statusClass}`}>
      <span className="dashboard-status-dot" />
      {status}
    </span>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
  loading,
}) {
  return (
    <article className="dashboard-stat-card">
      <div className="dashboard-stat-content">
        <div className="dashboard-stat-text">
          <p className="dashboard-stat-label">{title}</p>

          <p className="dashboard-stat-value">
            {loading ? (
              <span className="dashboard-stat-skeleton" />
            ) : (
              value
            )}
          </p>

          <p className="dashboard-stat-description">{description}</p>
        </div>

        <div className={`dashboard-stat-icon ${color}`}>
          <Icon size={23} />
        </div>
      </div>
    </article>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const adminEmail =
    sessionStorage.getItem("email") ||
    "Admin account";

  // Clear UI session information and delete the authentication cookie.
  const signOut = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      ["token", "role", "email", "employeeId"].forEach((key) => {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
      });

      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Load employee records using cookie authentication.
  const loadEmployees = useCallback(
    async (isRefresh = false) => {
      const role = sessionStorage.getItem("role");

      if (role?.toLowerCase() !== "admin") {
        await signOut();
        return;
      }

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
        if (err.response?.status === 401) {
          await signOut();
          return;
        }

        if (err.response?.status === 403) {
          setError("You do not have permission to view employee records.");
          return;
        }

        setError(
          err.message === "Unexpected employee data format."
            ? err.message
            : "Unable to load employee records. Check the backend and try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [signOut]
  );

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Employee statistics.
  const stats = useMemo(() => {
    const active = employees.filter(
      (employee) => getStatus(employee).toLowerCase() === "active"
    ).length;

    const onLeave = employees.filter(
      (employee) => getStatus(employee).toLowerCase() === "on leave"
    ).length;

    const departments = new Set(
      employees
        .map((employee) => employee.department?.trim())
        .filter(Boolean)
        .map((department) => department.toLowerCase())
    );

    return {
      total: employees.length,
      active,
      inactive: employees.length - active - onLeave,
      departments: departments.size,
      onLeave,
    };
  }, [employees]);

  // Search employees.
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

  // Delete an employee.
  async function deleteEmployee(employee) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${getFullName(employee)}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(employee.id);
    setError("");

    try {
      await api.delete(`/employees/${employee.id}`);

      setEmployees((previous) =>
        previous.filter((item) => item.id !== employee.id)
      );

      window.alert("Employee deleted successfully.");
    } catch (err) {
      if (err.response?.status === 401) {
        await signOut();
        return;
      }

      const message =
        err.response?.data?.message ||
        (err.response?.status === 403
          ? "You do not have permission to delete this employee."
          : "Unable to delete this employee. Please try again.");

      setError(message);
      window.alert(message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="dashboard-brand">
            <div className="dashboard-brand-icon">
              <Users size={24} />
            </div>

            <div className="dashboard-brand-text">
              <p className="dashboard-brand-name">PeopleHub</p>
              <p className="dashboard-brand-subtitle">
                Employee Management
              </p>
            </div>
          </div>

          <div className="dashboard-sidebar-section-label">
            <p>Workspace</p>
          </div>

          <nav className="dashboard-navigation">
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="dashboard-nav-button dashboard-nav-active"
            >
              <LayoutDashboard size={19} />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/employees")}
              className="dashboard-nav-button"
            >
              <Users size={19} />
              <span>Employee Directory</span>
              <ChevronRight size={16} className="dashboard-nav-arrow" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/employees/new")}
              className="dashboard-nav-button"
            >
              <UserPlus size={19} />
              <span>Add Employee</span>
              <ChevronRight size={16} className="dashboard-nav-arrow" />
            </button>
          </nav>

          <div className="dashboard-sidebar-account">
            <div className="dashboard-account-info">
              <div className="dashboard-account-avatar">A</div>

              <div className="dashboard-account-details">
                <p className="dashboard-account-name">Administrator</p>
                <p className="dashboard-account-email">{adminEmail}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={signOut}
              className="dashboard-signout-button"
            >
              <LogOut size={17} />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="dashboard-main">
          <header className="dashboard-topbar">
            <div className="dashboard-topbar-brand">
              <div className="dashboard-mobile-brand-icon">
                <Users size={21} />
              </div>

              <div className="dashboard-topbar-heading">
                <p className="dashboard-topbar-title">Admin Workspace</p>
                <p className="dashboard-topbar-subtitle">
                  Manage your team and employee records
                </p>
              </div>
            </div>

            <div className="dashboard-topbar-actions">
              <button
                type="button"
                onClick={() => loadEmployees(true)}
                disabled={refreshing}
                className="dashboard-button dashboard-refresh-button"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "dashboard-spin" : ""}
                />
                <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/employees")}
                className="dashboard-mobile-action"
                title="Employee directory"
                aria-label="Employee directory"
              >
                <Users size={19} />
              </button>

              <button
                type="button"
                onClick={signOut}
                className="dashboard-mobile-action dashboard-mobile-signout"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </header>

          <main className="dashboard-content">
            {/* Welcome banner */}
            <section className="dashboard-welcome">
              <div className="dashboard-welcome-decoration dashboard-decoration-one" />
              <div className="dashboard-welcome-decoration dashboard-decoration-two" />

              <div className="dashboard-welcome-content">
                <div className="dashboard-welcome-text">
                  <div className="dashboard-welcome-badge">
                    <span className="dashboard-welcome-dot" />
                    Administrator dashboard
                  </div>

                  <h1 className="dashboard-welcome-title">
                    Welcome back!
                  </h1>

                  <p className="dashboard-welcome-description">
                    Your team at a glance. Manage employee information,
                    monitor statuses, and keep everything organised.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/employees/new")}
                  className="dashboard-welcome-button"
                >
                  <UserPlus size={18} />
                  Add New Employee
                  <ArrowRight size={16} />
                </button>
              </div>
            </section>

            {/* Error notification */}
            {error && (
              <div className="dashboard-error-alert" role="alert">
                <AlertCircle
                  size={19}
                  className="dashboard-error-icon"
                />

                <div className="dashboard-error-content">
                  <p className="dashboard-error-title">
                    Something went wrong
                  </p>
                  <p className="dashboard-error-message">{error}</p>

                  <button
                    type="button"
                    onClick={() => loadEmployees(true)}
                    className="dashboard-error-retry"
                  >
                    Try again
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setError("")}
                  aria-label="Dismiss error"
                  className="dashboard-error-dismiss"
                >
                  <X size={17} />
                </button>
              </div>
            )}

            {/* Statistics */}
            <section className="dashboard-section">
              <div className="dashboard-section-heading">
                <div>
                  <h2 className="dashboard-section-title">Team overview</h2>
                  <p className="dashboard-section-description">
                    A summary of your employee records
                  </p>
                </div>

                <span className="dashboard-live-badge">
                  <TrendingUp size={14} />
                  Live data
                </span>
              </div>

              <div className="dashboard-stats-grid">
                <StatCard
                  title="Total Employees"
                  value={stats.total}
                  description="All employee records"
                  icon={Users}
                  color="dashboard-stat-indigo"
                  loading={loading}
                />

                <StatCard
                  title="Active Employees"
                  value={stats.active}
                  description="Currently marked active"
                  icon={UserCheck}
                  color="dashboard-stat-emerald"
                  loading={loading}
                />

                <StatCard
                  title="Other Statuses"
                  value={stats.inactive}
                  description={`${stats.onLeave} currently on leave`}
                  icon={UserX}
                  color="dashboard-stat-amber"
                  loading={loading}
                />

                <StatCard
                  title="Departments"
                  value={stats.departments}
                  description="Unique departments represented"
                  icon={Building2}
                  color="dashboard-stat-sky"
                  loading={loading}
                />
              </div>
            </section>

            {/* Quick actions */}
            <section className="dashboard-section">
              <h2 className="dashboard-section-title dashboard-quick-title">
                Quick actions
              </h2>

              <div className="dashboard-quick-grid">
                <button
                  type="button"
                  onClick={() => navigate("/employees")}
                  className="dashboard-quick-card dashboard-quick-directory"
                >
                  <div className="dashboard-quick-icon">
                    <Users size={25} />
                  </div>

                  <div className="dashboard-quick-content">
                    <p className="dashboard-quick-card-title">
                      Employee Directory
                    </p>
                    <p className="dashboard-quick-description">
                      Search, view, edit and manage employee records.
                    </p>
                  </div>

                  <ArrowRight size={20} className="dashboard-quick-arrow" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/employees/new")}
                  className="dashboard-quick-card dashboard-quick-create"
                >
                  <div className="dashboard-quick-icon">
                    <UserPlus size={25} />
                  </div>

                  <div className="dashboard-quick-content">
                    <p className="dashboard-quick-card-title">
                      Create Employee Record
                    </p>
                    <p className="dashboard-quick-description">
                      Add an employee and create their login credentials.
                    </p>
                  </div>

                  <ArrowRight size={20} className="dashboard-quick-arrow" />
                </button>
              </div>
            </section>

            {/* Employee table */}
            <section className="dashboard-employee-card">
              <div className="dashboard-employee-header">
                <div className="dashboard-employee-heading">
                  <div className="dashboard-employee-title-row">
                    <h2 className="dashboard-section-title">
                      Employee Overview
                    </h2>

                    {!loading && (
                      <span className="dashboard-result-count">
                        {filteredEmployees.length}
                      </span>
                    )}
                  </div>

                  <p className="dashboard-section-description">
                    Review and manage your latest employee records.
                  </p>
                </div>

                <div className="dashboard-employee-controls">
                  <div className="dashboard-search-wrapper">
                    <Search
                      size={18}
                      className="dashboard-search-icon"
                    />

                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search employees..."
                      aria-label="Search employees"
                      className="dashboard-search-input"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/employees")}
                    className="dashboard-button dashboard-directory-button"
                  >
                    View Directory
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="dashboard-table-loading">
                  <div className="dashboard-table-skeleton dashboard-skeleton-heading" />
                  <div className="dashboard-table-skeleton" />
                  <div className="dashboard-table-skeleton" />
                  <div className="dashboard-table-skeleton" />
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="dashboard-empty-state">
                  <div className="dashboard-empty-icon">
                    {search ? <Search size={26} /> : <Users size={26} />}
                  </div>

                  <h3 className="dashboard-empty-title">
                    {search
                      ? "No matching employees"
                      : "No employee records yet"}
                  </h3>

                  <p className="dashboard-empty-description">
                    {search
                      ? "Try another name, email, department or status."
                      : "Create your first employee record to get started."}
                  </p>

                  {!search && (
                    <button
                      type="button"
                      onClick={() => navigate("/employees/new")}
                      className="dashboard-button dashboard-empty-add-button"
                    >
                      <UserPlus size={17} />
                      Add Employee
                    </button>
                  )}
                </div>
              ) : (
                <div className="dashboard-table-wrapper">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Job Title</th>
                        <th>Joining Date</th>
                        <th>Status</th>
                        <th className="dashboard-actions-heading">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredEmployees.slice(0, 8).map((employee) => {
                        const status = getStatus(employee);
                        const pictureUrl = getProfilePictureUrl(
                          employee.profilePicture
                        );

                        return (
                          <tr key={employee.id}>
                            <td>
                              <div className="dashboard-person-cell">
                                {pictureUrl ? (
                                  <img
                                    src={pictureUrl}
                                    alt={getFullName(employee)}
                                    onError={(event) => {
                                      event.currentTarget.style.display = "none";
                                    }}
                                    className="dashboard-avatar-image"
                                  />
                                ) : (
                                  <div className="dashboard-avatar-placeholder">
                                    {getInitials(employee)}
                                  </div>
                                )}

                                <div className="dashboard-person-details">
                                  <p className="dashboard-person-name">
                                    {getFullName(employee) || "Unnamed employee"}
                                  </p>

                                  <p className="dashboard-person-email">
                                    {employee.workEmail || "No email provided"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td>
                              <span className="dashboard-table-detail">
                                <Building2
                                  size={15}
                                  className="dashboard-table-icon"
                                />
                                {employee.department || "—"}
                              </span>
                            </td>

                            <td>
                              <span className="dashboard-table-detail">
                                <BriefcaseBusiness
                                  size={15}
                                  className="dashboard-table-icon"
                                />
                                {employee.jobTitle || "—"}
                              </span>
                            </td>

                            <td>
                              <span className="dashboard-table-detail dashboard-date-detail">
                                <CalendarDays
                                  size={15}
                                  className="dashboard-table-icon"
                                />
                                {formatDate(employee.joiningDate)}
                              </span>
                            </td>

                            <td>
                              <StatusBadge status={status} />
                            </td>

                            <td>
                              <div className="dashboard-row-actions">
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(`/employees/${employee.id}`)
                                  }
                                  title="View employee"
                                  aria-label={`View ${getFullName(employee)}`}
                                  className="dashboard-action-button dashboard-view-button"
                                >
                                  <Eye size={16} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(`/employees/${employee.id}/edit`)
                                  }
                                  title="Edit employee"
                                  aria-label={`Edit ${getFullName(employee)}`}
                                  className="dashboard-action-button dashboard-edit-button"
                                >
                                  <Pencil size={16} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deleteEmployee(employee)}
                                  disabled={deletingId === employee.id}
                                  title="Delete employee"
                                  aria-label={`Delete ${getFullName(employee)}`}
                                  className="dashboard-action-button dashboard-delete-button"
                                >
                                  {deletingId === employee.id ? (
                                    <RefreshCw
                                      size={16}
                                      className="dashboard-spin"
                                    />
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && filteredEmployees.length > 8 && (
                <div className="dashboard-table-footer">
                  <p>
                    Showing 8 of {filteredEmployees.length} matching employees
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate("/employees")}
                    className="dashboard-view-all-button"
                  >
                    View all employees
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </section>

            <footer className="dashboard-footer">
              PeopleHub · Employee Management System
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
