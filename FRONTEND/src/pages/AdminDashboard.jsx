import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  Search,
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
} from "lucide-react";
import api from "../api/axios";

const styles = {
  card: "rounded-2xl border border-slate-200 bg-white shadow-sm",
  button:
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
};

function getFullName(employee) {
  return [employee.firstName, employee.lastName]
    .filter(Boolean)
    .join(" ");
}

function getInitials(employee) {
  const initials =
    `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`.toUpperCase();

  return initials || "E";
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

  return `https://localhost:7089${path.startsWith("/") ? "" : "/"}${path}`;
}

function StatusBadge({ status }) {
  const normalized = status.toLowerCase();

  const colors =
    normalized === "active"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
      : normalized === "on leave"
        ? "bg-amber-50 text-amber-700 ring-amber-600/20"
        : normalized === "terminated"
          ? "bg-red-50 text-red-700 ring-red-600/20"
          : "bg-slate-100 text-slate-600 ring-slate-500/20";

  const dot =
    normalized === "active"
      ? "bg-emerald-500"
      : normalized === "on leave"
        ? "bg-amber-500"
        : normalized === "terminated"
          ? "bg-red-500"
          : "bg-slate-400";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${colors}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
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
    <article
      className={`${styles.card} group p-5 transition duration-200 hover:-translate-y-1 hover:shadow-md sm:p-6`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {loading ? (
              <span className="inline-block h-9 w-14 animate-pulse rounded-lg bg-slate-100" />
            ) : (
              value
            )}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`rounded-2xl p-3 transition group-hover:scale-105 ${color}`}
        >
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
    localStorage.getItem("email") ||
    "Admin account";

  // Clear authentication and return to login.
  const signOut = useCallback(() => {
    [
      "token",
      "role",
      "email",
      "employeeId",
    ].forEach((key) => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    });

    navigate("/login", { replace: true });
  }, [navigate]);

  // Load employee records.
  const loadEmployees = useCallback(
    async (isRefresh = false) => {
      const token = sessionStorage.getItem("token");
      const role = sessionStorage.getItem("role");

      if (
        !token ||
        role?.toLowerCase() !== "admin"
      ) {
        signOut();
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
        if (
          err.response?.status === 401 ||
          err.response?.status === 403
        ) {
          signOut();
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
      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        signOut();
        return;
      }

      const message =
        err.response?.data?.message ||
        "Unable to delete this employee. Please try again.";

      setError(message);
      window.alert(message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col bg-slate-950 text-white lg:flex">
          <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-950/40">
              <Users size={24} />
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight">
                PeopleHub
              </p>
              <p className="text-xs text-slate-400">
                Employee Management
              </p>
            </div>
          </div>

          <div className="px-5 pb-3 pt-7">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Workspace
            </p>
          </div>

          <nav className="flex-1 space-y-2 px-4">
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="flex w-full items-center gap-3 rounded-xl border border-indigo-400/20 bg-indigo-500/15 px-4 py-3 text-left text-sm font-semibold text-indigo-300"
            >
              <LayoutDashboard size={19} />
              Dashboard
            </button>

            <button
              type="button"
              onClick={() => navigate("/employees")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <Users size={19} />
              Employee Directory
              <ChevronRight size={16} className="ml-auto" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/employees/new")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <UserPlus size={19} />
              Add Employee
              <ChevronRight size={16} className="ml-auto" />
            </button>
          </nav>

          <div className="m-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-300">
                A
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  Administrator
                </p>
                <p className="mt-1 break-all text-xs text-slate-400">
                  {adminEmail}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={signOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={17} />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex min-h-[76px] items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white lg:hidden">
                <Users size={21} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900 sm:text-base">
                  Admin Workspace
                </p>
                <p className="hidden text-xs text-slate-500 sm:block">
                  Manage your team and employee records
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadEmployees(true)}
                disabled={refreshing}
                className={`${styles.button} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                <span className="hidden sm:inline">
                  {refreshing ? "Refreshing..." : "Refresh"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/employees")}
                className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 lg:hidden"
                title="Employee directory"
                aria-label="Employee directory"
              >
                <Users size={19} />
              </button>

              <button
                type="button"
                onClick={signOut}
                className="rounded-xl p-2.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600 lg:hidden"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </header>

          <main className="mx-auto max-w-[1600px] p-4 sm:p-7 lg:p-10">
            {/* Welcome banner */}
            <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white shadow-lg shadow-indigo-900/10 sm:p-9">
              <div className="pointer-events-none absolute -right-10 -top-24 h-72 w-72 rounded-full border-[35px] border-white/5" />
              <div className="pointer-events-none absolute -bottom-32 right-40 h-64 w-64 rounded-full bg-white/5" />

              <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-50">
                    <span className="h-2 w-2 rounded-full bg-emerald-300" />
                    Administrator dashboard
                  </div>

                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Welcome back!
                  </h1>

                  <p className="mt-3 max-w-lg text-sm leading-6 text-indigo-100 sm:text-base">
                    Your team at a glance. Manage employee information,
                    monitor statuses, and keep everything organised.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/employees/new")}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                >
                  <UserPlus size={18} />
                  Add New Employee
                  <ArrowRight size={16} />
                </button>
              </div>
            </section>

            {/* Error notification */}
            {error && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <AlertCircle size={19} className="mt-0.5 shrink-0" />

                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    Something went wrong
                  </p>
                  <p className="mt-1">{error}</p>

                  <button
                    type="button"
                    onClick={() => loadEmployees(true)}
                    className="mt-2 font-semibold underline"
                  >
                    Try again
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setError("")}
                  aria-label="Dismiss error"
                  className="rounded-lg p-1 hover:bg-red-100"
                >
                  <X size={17} />
                </button>
              </div>
            )}

            {/* Statistics */}
            <section className="mb-9">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Team overview
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    A summary of your employee records
                  </p>
                </div>

                <span className="hidden items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200 sm:inline-flex">
                  <TrendingUp size={14} className="text-emerald-600" />
                  Live data
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Total Employees"
                  value={stats.total}
                  description="All employee records"
                  icon={Users}
                  color="bg-indigo-50 text-indigo-600"
                  loading={loading}
                />

                <StatCard
                  title="Active Employees"
                  value={stats.active}
                  description="Currently marked active"
                  icon={UserCheck}
                  color="bg-emerald-50 text-emerald-600"
                  loading={loading}
                />

                <StatCard
                  title="Other Statuses"
                  value={stats.inactive}
                  description={`${stats.onLeave} currently on leave`}
                  icon={UserX}
                  color="bg-amber-50 text-amber-600"
                  loading={loading}
                />

                <StatCard
                  title="Departments"
                  value={stats.departments}
                  description="Unique departments represented"
                  icon={Building2}
                  color="bg-sky-50 text-sky-600"
                  loading={loading}
                />
              </div>
            </section>

            {/* Quick actions */}
            <section className="mb-9">
              <h2 className="mb-4 text-lg font-bold text-slate-900">
                Quick actions
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => navigate("/employees")}
                  className={`${styles.card} group flex items-center gap-4 p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:p-6`}
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                    <Users size={25} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900">
                      Employee Directory
                    </p>
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      Search, view, edit and manage employee records.
                    </p>
                  </div>

                  <ArrowRight
                    size={20}
                    className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/employees/new")}
                  className={`${styles.card} group flex items-center gap-4 p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:p-6`}
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                    <UserPlus size={25} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900">
                      Create Employee Record
                    </p>
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      Add an employee and create their login credentials.
                    </p>
                  </div>

                  <ArrowRight
                    size={20}
                    className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-600"
                  />
                </button>
              </div>
            </section>

            {/* Employee table */}
            <section className={`${styles.card} overflow-hidden`}>
              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      Employee Overview
                    </h2>

                    {!loading && (
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                        {filteredEmployees.length}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    Review and manage your latest employee records.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative min-w-0 sm:w-64">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search employees..."
                      aria-label="Search employees"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/employees")}
                    className={`${styles.button} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
                  >
                    View Directory
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="space-y-4 p-6">
                  <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
                  <div className="h-14 animate-pulse rounded-xl bg-slate-50" />
                  <div className="h-14 animate-pulse rounded-xl bg-slate-50" />
                  <div className="h-14 animate-pulse rounded-xl bg-slate-50" />
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                    {search ? <Search size={26} /> : <Users size={26} />}
                  </div>

                  <h3 className="mt-4 font-bold text-slate-900">
                    {search
                      ? "No matching employees"
                      : "No employee records yet"}
                  </h3>

                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    {search
                      ? "Try another name, email, department or status."
                      : "Create your first employee record to get started."}
                  </p>

                  {!search && (
                    <button
                      type="button"
                      onClick={() => navigate("/employees/new")}
                      className={`${styles.button} mt-5 bg-indigo-600 text-white hover:bg-indigo-700`}
                    >
                      <UserPlus size={17} />
                      Add Employee
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left">
                    <thead className="bg-slate-50/80">
                      <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                        <th className="px-6 py-4">Employee</th>
                        <th className="px-6 py-4">Department</th>
                        <th className="px-6 py-4">Job Title</th>
                        <th className="px-6 py-4">Joining Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredEmployees.slice(0, 8).map((employee) => {
                        const status = getStatus(employee);
                        const pictureUrl = getProfilePictureUrl(
                          employee.profilePicture
                        );

                        return (
                          <tr
                            key={employee.id}
                            className="transition hover:bg-indigo-50/30"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {pictureUrl ? (
                                  <img
                                    src={pictureUrl}
                                    alt={getFullName(employee)}
                                    onError={(event) => {
                                      event.currentTarget.style.display = "none";
                                    }}
                                    className="h-11 w-11 shrink-0 rounded-full border border-slate-100 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-sm font-bold text-indigo-700 ring-1 ring-indigo-100">
                                    {getInitials(employee)}
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <p className="max-w-52 truncate text-sm font-bold text-slate-900">
                                    {getFullName(employee) ||
                                      "Unnamed employee"}
                                  </p>

                                  <p className="mt-1 max-w-52 truncate text-xs text-slate-500">
                                    {employee.workEmail ||
                                      "No email provided"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-sm text-slate-600">
                              <span className="inline-flex items-center gap-2">
                                <Building2
                                  size={15}
                                  className="text-slate-400"
                                />
                                {employee.department || "—"}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-sm text-slate-600">
                              <span className="inline-flex items-center gap-2">
                                <BriefcaseBusiness
                                  size={15}
                                  className="text-slate-400"
                                />
                                {employee.jobTitle || "—"}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-sm text-slate-600">
                              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                                <CalendarDays
                                  size={15}
                                  className="text-slate-400"
                                />
                                {formatDate(employee.joiningDate)}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <StatusBadge status={status} />
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(`/employees/${employee.id}`)
                                  }
                                  title="View employee"
                                  aria-label={`View ${getFullName(employee)}`}
                                  className="rounded-lg border border-slate-200 p-2.5 text-sky-700 transition hover:border-sky-200 hover:bg-sky-50"
                                >
                                  <Eye size={16} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/employees/${employee.id}/edit`
                                    )
                                  }
                                  title="Edit employee"
                                  aria-label={`Edit ${getFullName(employee)}`}
                                  className="rounded-lg border border-slate-200 p-2.5 text-indigo-700 transition hover:border-indigo-200 hover:bg-indigo-50"
                                >
                                  <Pencil size={16} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deleteEmployee(employee)}
                                  disabled={deletingId === employee.id}
                                  title="Delete employee"
                                  aria-label={`Delete ${getFullName(employee)}`}
                                  className="rounded-lg border border-slate-200 p-2.5 text-red-600 transition hover:border-red-200 hover:bg-red-50"
                                >
                                  {deletingId === employee.id ? (
                                    <RefreshCw
                                      size={16}
                                      className="animate-spin"
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
                <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p className="text-sm text-slate-500">
                    Showing 8 of {filteredEmployees.length} matching employees
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate("/employees")}
                    className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    View all employees
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </section>

            <footer className="py-8 text-center text-xs text-slate-400">
              PeopleHub · Employee Management System
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
