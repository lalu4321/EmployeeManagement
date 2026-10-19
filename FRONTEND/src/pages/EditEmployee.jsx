import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

const initialForm = {
  firstName: "",
  lastName: "",
  workEmail: "",
  phoneNumber: "",
  department: "",
  jobTitle: "",
  employmentType: "",
  joiningDate: "",
  employmentStatus: "Active",
  workLocation: "",
  address: "",
};

const employmentTypes = [
  "FullTime",
  "PartTime",
  "Contract",
  "Intern",
];

const employmentStatuses = [
  "Active",
  "OnLeave",
  "Inactive",
];

export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [profilePicture, setProfilePicture] = useState(null);
  const [currentPicture, setCurrentPicture] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadEmployee = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/employees/${id}`);
        const employee = response.data;

        if (cancelled) return;

        setForm({
          firstName: employee.firstName ?? "",
          lastName: employee.lastName ?? "",
          workEmail: employee.workEmail ?? "",
          phoneNumber: employee.phoneNumber ?? "",
          department: employee.department ?? "",
          jobTitle: employee.jobTitle ?? "",
          employmentType: employee.employmentType ?? "",
          joiningDate: employee.joiningDate
            ? String(employee.joiningDate).slice(0, 10)
            : "",
          employmentStatus: employee.employmentStatus ?? "Active",
          workLocation: employee.workLocation ?? "",
          address: employee.address ?? "",
        });

        setCurrentPicture(employee.profilePicture ?? "");
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load employee details."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadEmployee();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePictureChange = (event) => {
    const file = event.target.files?.[0];

    setError("");
    setProfilePicture(null);

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Choose a JPG, JPEG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setError("Image size must be between 1 byte and 5 MB.");
      event.target.value = "";
      return;
    }

    setProfilePicture(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const requiredFields = [
      ["firstName", "First name"],
      ["lastName", "Last name"],
      ["workEmail", "Work email"],
      ["phoneNumber", "Phone number"],
      ["department", "Department"],
      ["jobTitle", "Job title"],
      ["employmentType", "Employment type"],
      ["joiningDate", "Joining date"],
      ["employmentStatus", "Employment status"],
      ["workLocation", "Work location"],
    ];

    for (const [field, label] of requiredFields) {
      if (!String(form[field] ?? "").trim()) {
        setError(`${label} is required.`);
        return;
      }
    }

    const email = form.workEmail.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid work email address.");
      return;
    }

    if (
      form.phoneNumber.trim().length < 7 ||
      form.phoneNumber.trim().length > 20
    ) {
      setError("Enter a valid phone number.");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("id", String(id));

      Object.entries(form).forEach(([key, value]) => {
        formData.append(
          key,
          key === "workEmail" ? value.trim() : value ?? ""
        );
      });

      if (profilePicture) {
        formData.append("profilePicture", profilePicture);
      }

      await api.put(`/employees/${id}`, formData);

      setSuccess("Employee updated successfully.");

      setTimeout(() => {
        navigate(`/employees/${id}`);
      }, 800);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update employee. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p className="text-gray-600">Loading employee details...</p>
      </div>
    );
  }

  if (error && !form.firstName && !form.workEmail) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>

        <button
          type="button"
          onClick={() => navigate("/employees")}
          className="mt-4 rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
        >
          Back to Employees
        </button>
      </div>
    );
  }

  const pictureUrl = currentPicture
    ? currentPicture.startsWith("http")
      ? currentPicture
      : `https://localhost:7089${currentPicture}`
    : "";

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Employee
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Update employee information and profile picture.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(`/employees/${id}`)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
        >
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
      >
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Profile Picture
          </h2>

          <div className="flex flex-wrap items-center gap-5">
            {profilePicture ? (
              <img
                src={URL.createObjectURL(profilePicture)}
                alt="New profile preview"
                className="h-20 w-20 rounded-full border object-cover"
              />
            ) : pictureUrl ? (
              <img
                src={pictureUrl}
                alt="Current employee"
                className="h-20 w-20 rounded-full border object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-2xl font-semibold text-gray-500">
                {form.firstName.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handlePictureChange}
                className="block w-full max-w-xs text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-medium file:text-blue-700 hover:file:bg-blue-100"
              />

              <p className="mt-1 text-xs text-gray-500">
                JPG, PNG, or WEBP. Maximum size: 5 MB.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Personal Information
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="First Name"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
            />

            <FormField
              label="Last Name"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
            />

            <FormField
              label="Work Email"
              name="workEmail"
              type="email"
              value={form.workEmail}
              onChange={handleChange}
              required
            />

            <FormField
              label="Phone Number"
              name="phoneNumber"
              type="tel"
              value={form.phoneNumber}
              onChange={handleChange}
              required
            />

            <FormField
              label="Address"
              name="address"
              value={form.address}
              onChange={handleChange}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Employment Information
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Department"
              name="department"
              value={form.department}
              onChange={handleChange}
              required
            />

            <FormField
              label="Job Title"
              name="jobTitle"
              value={form.jobTitle}
              onChange={handleChange}
              required
            />

            <FormField
              label="Joining Date"
              name="joiningDate"
              type="date"
              value={form.joiningDate}
              onChange={handleChange}
              required
            />

            <FormSelect
              label="Employment Type"
              name="employmentType"
              value={form.employmentType}
              onChange={handleChange}
              options={employmentTypes}
              required
            />

            <FormSelect
              label="Employment Status"
              name="employmentStatus"
              value={form.employmentStatus}
              onChange={handleChange}
              options={employmentStatuses}
              required
            />

            <FormField
              label="Work Location"
              name="workLocation"
              value={form.workLocation}
              onChange={handleChange}
              required
            />
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-5">
          <button
            type="button"
            onClick={() => navigate(`/employees/${id}`)}
            disabled={saving}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = false,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">Select {label}</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
