import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
} from 'lucide-react'
import api from '../api/axios'

const API_BASE_URL = 'https://localhost:7089'

function getProfilePictureUrl(path) {
  if (!path) return null

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  return `${API_BASE_URL}/${path.replace(/^\/+/, '')}`
}

function formatDate(value) {
  if (!value) return ''

  // Preserve the date returned by the API without timezone shifting.
  return String(value).slice(0, 10)
}

export default function ViewEmployee() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pictureError, setPictureError] = useState(false)

  useEffect(() => {
    let active = true

    async function loadEmployee() {
      setLoading(true)
      setError('')
      setEmployee(null)
      setPictureError(false)

      try {
        const response = await api.get(`/employees/${id}`)

        if (active) {
          setEmployee(response.data)
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              (err.response?.status === 404
                ? 'Employee not found.'
                : err.response?.status === 401
                  ? 'Your session has expired. Please sign in again.'
                  : err.response?.status === 403
                    ? 'You do not have permission to view this employee.'
                    : 'Unable to load employee details. Please try again.')
          )

          if (err.response?.status === 401) {
            sessionStorage.clear()
            localStorage.clear()
            navigate('/login', { replace: true })
          }
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    if (id && /^\d+$/.test(id)) {
      loadEmployee()
    } else {
      setError('Invalid employee ID.')
      setLoading(false)
    }

    return () => {
      active = false
    }
  }, [id, navigate])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
        <p className="text-slate-600">Loading employee details...</p>
      </main>
    )
  }

  if (error || !employee) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 sm:p-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-red-600">
            {error || 'Employee not found.'}
          </p>

          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Back to Employees
          </button>
        </div>
      </main>
    )
  }

  const fullName = [employee.firstName, employee.lastName]
    .filter(Boolean)
    .join(' ')

  const pictureUrl = getProfilePictureUrl(employee.profilePicture)

  const details = [
    { label: 'Employee ID', value: employee.id },
    { label: 'First Name', value: employee.firstName },
    { label: 'Last Name', value: employee.lastName },
    { label: 'Work Email', value: employee.workEmail, icon: Mail },
    { label: 'Phone Number', value: employee.phoneNumber, icon: Phone },
    { label: 'Department', value: employee.department, icon: Building2 },
    { label: 'Job Title', value: employee.jobTitle, icon: Briefcase },
    { label: 'Employment Type', value: employee.employmentType },
    {
      label: 'Employment Status',
      value: employee.employmentStatus,
      icon: ShieldCheck,
    },
    {
      label: 'Joining Date',
      value: formatDate(employee.joiningDate),
      icon: CalendarDays,
    },
    {
      label: 'Work Location',
      value: employee.workLocation,
      icon: MapPin,
    },
    { label: 'Address', value: employee.address },
    {
      label: 'Created At',
      value: formatDate(employee.createdAt),
    },
    {
      label: 'Last Updated',
      value: formatDate(employee.updatedAt),
    },
  ]

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate('/employees')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600"
        >
          <ArrowLeft size={18} />
          Back to Employees
        </button>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Employee header */}
          <div className="flex flex-col gap-4 bg-indigo-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-center gap-4">
              {pictureUrl && !pictureError ? (
                <img
                  src={pictureUrl}
                  alt={fullName || 'Employee'}
                  onError={() => setPictureError(true)}
                  className="h-20 w-20 shrink-0 rounded-full border-2 border-white object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <UserRound size={38} />
                </div>
              )}

              <div className="min-w-0">
                <h1 className="break-words text-2xl font-bold">
                  {fullName || 'Employee'}
                </h1>

                <p className="mt-1 text-indigo-100">
                  {employee.jobTitle || 'Job title not provided'}
                </p>

                <p className="mt-1 text-sm text-indigo-100">
                  Employee ID: {employee.id}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/employees/${id}/edit`)}
              className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              Edit Employee
            </button>
          </div>

          {/* Employee information */}
          <div className="p-6 sm:p-8">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">
              Complete Employee Details
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {details.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-center gap-2 text-slate-500">
                    {Icon && <Icon size={16} />}
                    <p className="text-xs font-medium">{label}</p>
                  </div>

                  <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                    {value !== null && value !== undefined && value !== ''
                      ? String(value)
                      : 'Not provided'}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => navigate('/employees')}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back to Employee Directory
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
