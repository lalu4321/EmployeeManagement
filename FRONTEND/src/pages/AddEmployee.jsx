import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, UserPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import api from '../api/axios'

const departments = ['IT', 'HR', 'Finance', 'Sales', 'Operations']
const employmentTypes = ['FullTime', 'PartTime', 'Contract', 'Intern']
const employmentStatuses = ['Active', 'OnLeave', 'Inactive']

const inputClass =
  'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'

const labelClass = 'text-sm font-medium text-slate-700'

function getLocalDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getMinimumJoiningDate() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - 7)
  return getLocalDateString(date)
}

const employeeSchema = z
  .object({
    firstName: z.string().trim()
      .min(2, 'First name must contain at least 2 characters.')
      .max(50, 'First name cannot exceed 50 characters.')
      .regex(/^\p{L}+(?:[ '-]\p{L}+)*$/u, 'Enter a valid first name.'),

    lastName: z.string().trim()
      .min(2, 'Last name must contain at least 2 characters.')
      .max(50, 'Last name cannot exceed 50 characters.')
      .regex(/^\p{L}+(?:[ '-]\p{L}+)*$/u, 'Enter a valid last name.'),

    workEmail: z.string().trim()
      .email('Enter a valid work email.')
      .max(254, 'Email cannot exceed 254 characters.'),

    phoneNumber: z.string().trim()
      .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number.'),

    department: z.string()
      .refine(value => departments.includes(value), 'Select a valid department.'),

    jobTitle: z.string().trim()
      .min(1, 'Job title is required.')
      .max(100, 'Job title cannot exceed 100 characters.'),

    employmentType: z.string()
      .refine(value => employmentTypes.includes(value), 'Select a valid employment type.'),

    joiningDate: z.string()
      .min(1, 'Joining date is required.')
      .refine(value => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
        const date = new Date(`${value}T00:00:00`)
        return !Number.isNaN(date.getTime()) &&
          getLocalDateString(date) === value
      }, 'Enter a valid joining date.')
      .refine(value => value >= getMinimumJoiningDate(),
        'Joining date cannot be earlier than 7 days ago.'),

    employmentStatus: z.string()
      .refine(value => employmentStatuses.includes(value), 'Select a valid status.'),

    workLocation: z.string().trim()
      .min(1, 'Work location is required.')
      .max(100, 'Work location cannot exceed 100 characters.'),

    address: z.string()
      .max(300, 'Address cannot exceed 300 characters.'),

    password: z.string()
      .min(8, 'Password must contain at least 8 characters.')
      .max(72, 'Password cannot exceed 72 characters.')
      .regex(/[A-Z]/, 'Include an uppercase letter.')
      .regex(/[a-z]/, 'Include a lowercase letter.')
      .regex(/[0-9]/, 'Include a number.')
      .regex(/[^A-Za-z0-9]/, 'Include a special character.'),

    confirmPassword: z.string().min(1, 'Confirm the password.')
  })
  .refine(values => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword']
  })

export default function AddEmployee() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      workEmail: '',
      phoneNumber: '',
      department: '',
      jobTitle: '',
      employmentType: 'FullTime',
      joiningDate: getLocalDateString(new Date()),
      employmentStatus: 'Active',
      workLocation: '',
      address: '',
      password: '',
      confirmPassword: ''
    }
  })

  const address = watch('address') || ''

  async function onSubmit(values) {
    setServerError('')

    try {
      const {
        confirmPassword,
        password,
        ...employeeDetails
      } = values

      await api.post('/employees', {
        ...employeeDetails,
        workEmail: employeeDetails.workEmail.trim(),
        password,
        joiningDate: employeeDetails.joiningDate
      })

      window.alert('Employee and login account created successfully.')
      navigate('/employees')
    } catch (error) {
      const status = error.response?.status

      const message =
        error.response?.data?.message ||
        (status === 401
          ? 'Your session has expired. Please sign in again.'
          : status === 403
            ? 'Only an Admin can create employees.'
            : status === 409
              ? 'This work email is already registered.'
              : status === 400
                ? 'Invalid details. Please check the form.'
                : 'Could not create the employee. Please try again.')

      setServerError(message)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => navigate('/employees')}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600"
        >
          <ArrowLeft size={18} />
          Back to employees
        </button>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-8 flex items-center gap-4">
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
              <UserPlus size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Add employee</h1>
              <p className="mt-1 text-sm text-slate-500">
                Enter employee details and create a temporary login password.
              </p>
            </div>
          </div>

          {serverError && (
            <p role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {serverError}
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Personal and contact information
              </h2>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="firstName">First name *</label>
                  <input id="firstName" {...register('firstName')} maxLength={50} autoComplete="given-name" className={inputClass} />
                  {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
                </div>

                <div>
                  <label className={labelClass} htmlFor="lastName">Last name *</label>
                  <input id="lastName" {...register('lastName')} maxLength={50} autoComplete="family-name" className={inputClass} />
                  {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
                </div>

                <div>
                  <label className={labelClass} htmlFor="workEmail">Work email *</label>
                  <input id="workEmail" type="email" {...register('workEmail')} maxLength={254} autoComplete="email" className={inputClass} />
                  {errors.workEmail && <p className="mt-1 text-sm text-red-600">{errors.workEmail.message}</p>}
                </div>

                <div>
                  <label className={labelClass} htmlFor="phoneNumber">Phone number *</label>
                  <input id="phoneNumber" type="tel" {...register('phoneNumber')} inputMode="numeric" maxLength={10} autoComplete="tel" className={inputClass} />
                  {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="address">Address (optional)</label>
                  <textarea id="address" {...register('address')} rows={3} maxLength={300} className={inputClass} />
                  <p className="mt-1 text-right text-xs text-slate-500">{address.length}/300 characters</p>
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
                </div>
              </div>
            </section>

            <section className="border-t border-slate-200 pt-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Employment information</h2>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="department">Department *</label>
                  <select id="department" {...register('department')} className={inputClass}>
                    <option value="">Select department</option>
                    {departments.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                  {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>}
                </div>

                <div>
                  <label className={labelClass} htmlFor="jobTitle">Job title *</label>
                  <input id="jobTitle" {...register('jobTitle')} maxLength={100} className={inputClass} />
                  {errors.jobTitle && <p className="mt-1 text-sm text-red-600">{errors.jobTitle.message}</p>}
                </div>

                <div>
                  <label className={labelClass} htmlFor="workLocation">Work location *</label>
                  <input id="workLocation" {...register('workLocation')} maxLength={100} className={inputClass} />
                  {errors.workLocation && <p className="mt-1 text-sm text-red-600">{errors.workLocation.message}</p>}
                </div>

                <div>
                  <label className={labelClass} htmlFor="employmentType">Employment type *</label>
                  <select id="employmentType" {...register('employmentType')} className={inputClass}>
                    {employmentTypes.map(item => (
                      <option key={item} value={item}>
                        {item === 'FullTime' ? 'Full Time' : item === 'PartTime' ? 'Part Time' : item}
                      </option>
                    ))}
                  </select>
                  {errors.employmentType && <p className="mt-1 text-sm text-red-600">{errors.employmentType.message}</p>}
                </div>

                <div>
                  <label className={labelClass} htmlFor="joiningDate">Joining date *</label>
                  <input id="joiningDate" type="date" min={getMinimumJoiningDate()} {...register('joiningDate')} className={inputClass} />
                  {errors.joiningDate && <p className="mt-1 text-sm text-red-600">{errors.joiningDate.message}</p>}
                </div>

                <div>
                  <label className={labelClass} htmlFor="employmentStatus">Employment status *</label>
                  <select id="employmentStatus" {...register('employmentStatus')} className={inputClass}>
                    <option value="Active">Active</option>
                    <option value="OnLeave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  {errors.employmentStatus && <p className="mt-1 text-sm text-red-600">{errors.employmentStatus.message}</p>}
                </div>
              </div>
            </section>

            <section className="border-t border-slate-200 pt-6">
              <h2 className="mb-2 text-lg font-semibold text-slate-900">Employee login credentials</h2>
              <p className="mb-4 text-sm text-slate-500">
                Create a temporary password and share it securely with the employee.
              </p>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="password">Create password *</label>
                  <input id="password" type={showPassword ? 'text' : 'password'} {...register('password')} autoComplete="new-password" maxLength={72} className={inputClass} />
                  <p className="mt-1 text-xs text-slate-500">At least 8 characters, including uppercase, lowercase, a number and a special character.</p>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                </div>

                <div>
                  <label className={labelClass} htmlFor="confirmPassword">Confirm password *</label>
                  <input id="confirmPassword" type={showPassword ? 'text' : 'password'} {...register('confirmPassword')} autoComplete="new-password" maxLength={72} className={inputClass} />
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={event => setShowPassword(event.target.checked)}
                      className="h-4 w-4 accent-indigo-600"
                    />
                    Show passwords
                  </label>
                </div>
              </div>
            </section>

            <p className="text-xs text-slate-500">
              Profile pictures are optional and can be added later from Edit Employee.
            </p>

            <div className="flex justify-end border-t border-slate-200 pt-5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={18} />
                {isSubmitting ? 'Creating...' : 'Create employee'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
