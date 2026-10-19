import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
} from 'lucide-react'
import api from '../api/axios'

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50'

function getFullName(employee) {
  return [employee.firstName, employee.lastName].filter(Boolean).join(' ')
}

function getStatus(employee) {
  const value = String(employee.employmentStatus || 'Unknown')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()

  return value === 'onleave'
    ? 'On Leave'
    : value.replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getStatusStyle(status) {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
    case 'on leave':
      return 'bg-amber-50 text-amber-700 ring-amber-600/20'
    case 'terminated':
      return 'bg-red-50 text-red-700 ring-red-600/20'
    default:
      return 'bg-slate-100 text-slate-600 ring-slate-500/20'
  }
}

function getProfilePictureUrl(path) {
  if (!path) return ''

  if (/^https?:\/\//i.test(path)) return path

  return `https://localhost:7089${path.startsWith('/') ? '' : '/'}${path}`
}

function getInitials(employee) {
  return (
    `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`
      .toUpperCase() || 'E'
  )
}

export default function Employees() {
  const navigate = useNavigate()

  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const loadEmployees = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    try {
      const response = await api.get('/employees')
      const data = response.data

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.$values)
            ? data.$values
            : null

      if (!list) {
        throw new Error('Unexpected employee data format.')
      }

      setEmployees(list)
    } catch (err) {
      const message =
        err.response?.status === 401
          ? 'Your session has expired. Please sign in again.'
          : err.response?.status === 403
            ? 'Admin access is required to view employee records.'
            : err.message === 'Unexpected employee data format.'
              ? err.message
              : 'Could not load employees. Check the backend connection.'

      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadEmployees()
  }, [loadEmployees])

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return employees

    return employees.filter((employee) =>
      [
        getFullName(employee),
        employee.workEmail,
        employee.department,
        employee.jobTitle,
        employee.workLocation,
        getStatus(employee),
      ].some((value) =>
        String(value || '').toLowerCase().includes(query)
      )
    )
  }, [employees, search])

  function viewEmployee(employee) {
    navigate(`/employees/${employee.id}`)
  }

  function editEmployee(employee) {
    navigate(`/employees/${employee.id}/edit`)
  }

  async function deleteEmployee(employee) {
    const name = getFullName(employee) || 'this employee'

    const confirmed = window.confirm(
      `Are you sure you want to delete ${name}? This action cannot be undone.`
    )

    if (!confirmed) return

    setDeletingId(employee.id)
    setError('')

    try {
      await api.delete(`/employees/${employee.id}`)

      setEmployees((current) =>
        current.filter((item) => item.id !== employee.id)
      )

      window.alert('Employee deleted successfully.')
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.response?.status === 401
          ? 'Your session has expired. Please sign in again.'
          : err.response?.status === 403
            ? 'Admin access is required.'
            : 'Could not delete employee. Check the backend endpoint.')

      setError(message)
      window.alert(message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-7 text-slate-900 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-[1500px]">
        {/* Page heading */}
        <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              Management / Directory
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Employees
            </h1>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              View, search and manage employee records from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => loadEmployees(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={refreshing ? 'animate-spin' : ''}
              />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/employees/new')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <UserPlus size={18} />
              Add employee
            </button>
          </div>
        </section>

        {/* Employee count */}
        <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-indigo-50 p-3.5 text-indigo-600">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total employees
                </p>
                <p className="mt-1 text-3xl font-bold tracking-tight">
                  {loading ? '—' : employees.length}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Employee records in the system
                </p>
              </div>
            </div>
          </article>
        </section>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="font-semibold">Unable to complete the request</p>
              <p className="mt-1">{error}</p>

              {error.includes('session has expired') && (
                <button
                  type="button"
                  onClick={() => navigate('/login', { replace: true })}
                  className="mt-2 font-semibold underline"
                >
                  Sign in again
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setError('')}
              aria-label="Dismiss error"
              className="rounded-lg p-1 hover:bg-red-100"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Employee directory */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Employee directory
                </h2>

                {!loading && (
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                    {filteredEmployees.length}
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Select View to open an employee's details.
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
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
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 p-6">
              <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-14 animate-pulse rounded-lg bg-slate-50" />
              <div className="h-14 animate-pulse rounded-lg bg-slate-50" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-slate-50">
                  <tr className="border-y border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">Employee</th>
                    <th className="px-5 py-4">Department</th>
                    <th className="px-5 py-4">Job title</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((employee) => {
                    const name = getFullName(employee) || 'Unnamed employee'
                    const pictureUrl = getProfilePictureUrl(
                      employee.profilePicture
                    )
                    const status = getStatus(employee)

                    return (
                      <tr
                        key={employee.id}
                        className="transition hover:bg-indigo-50/30"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {pictureUrl ? (
                              <img
                                src={pictureUrl}
                                alt=""
                                className="h-11 w-11 shrink-0 rounded-full border border-slate-200 object-cover"
                              />
                            ) : (
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700">
                                {getInitials(employee)}
                              </div>
                            )}

                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => viewEmployee(employee)}
                                className="max-w-64 truncate text-left font-semibold text-slate-900 hover:text-indigo-600 hover:underline"
                                title="View employee details"
                              >
                                {name}
                              </button>
                              <p className="mt-1 max-w-64 truncate text-xs text-slate-500">
                                {employee.workEmail || 'No email provided'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          <span className="inline-flex items-center gap-2">
                            <Building2
                              size={15}
                              className="shrink-0 text-slate-400"
                            />
                            {employee.department || '—'}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          <span className="inline-flex items-center gap-2">
                            <BriefcaseBusiness
                              size={15}
                              className="shrink-0 text-slate-400"
                            />
                            {employee.jobTitle || '—'}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(status)}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {/* VIEW */}
                            <button
                              type="button"
                              onClick={() => viewEmployee(employee)}
                              title="View employee"
                              aria-label={`View ${name}`}
                              className="rounded-lg border border-slate-200 p-2.5 text-sky-700 transition hover:border-sky-200 hover:bg-sky-50"
                            >
                              <Eye size={17} />
                            </button>

                            {/* EDIT */}
                            <button
                              type="button"
                              onClick={() => editEmployee(employee)}
                              title="Edit employee"
                              aria-label={`Edit ${name}`}
                              className="rounded-lg border border-slate-200 p-2.5 text-indigo-700 transition hover:border-indigo-200 hover:bg-indigo-50"
                            >
                              <Pencil size={17} />
                            </button>

                            {/* DELETE */}
                            <button
                              type="button"
                              onClick={() => deleteEmployee(employee)}
                              disabled={deletingId === employee.id}
                              title="Delete employee"
                              aria-label={`Delete ${name}`}
                              className="rounded-lg border border-slate-200 p-2.5 text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                            >
                              {deletingId === employee.id ? (
                                <RefreshCw
                                  size={17}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2 size={17} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}

                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-14 text-center"
                      >
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                          {search ? <Search size={24} /> : <Users size={24} />}
                        </div>

                        <p className="mt-4 font-semibold text-slate-800">
                          {search
                            ? 'No matching employees found'
                            : 'No employees found'}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {search
                            ? 'Try searching with another name, email or department.'
                            : 'Add an employee to get started.'}
                        </p>

                        {!search && (
                          <button
                            type="button"
                            onClick={() => navigate('/employees/new')}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
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

          <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span>
              {loading
                ? 'Loading employee records...'
                : `Showing ${filteredEmployees.length} of ${employees.length} employees`}
            </span>
            <span>Employee Management System</span>
          </div>
        </section>
      </div>
    </main>
  )
}
