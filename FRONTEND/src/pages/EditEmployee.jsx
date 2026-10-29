import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import "../styles/editEmployee.css";

import {
  editEmployeeSchema,
  validateProfilePicture,
  employmentTypes,
  employmentStatuses,
} from "../validators/validation";

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

export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [profilePicture, setProfilePicture] = useState(null);
  const [currentPicture, setCurrentPicture] = useState("");
  const [picturePreview, setPicturePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Generate a preview URL for a newly selected picture.
  useEffect(() => {
    if (!profilePicture) {
      setPicturePreview("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(profilePicture);
    setPicturePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [profilePicture]);

  // Load existing employee details.
  useEffect(() => {
    let cancelled = false;

    async function loadEmployee() {
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
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEmployee();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Handle changes to employee fields.
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  // Validate a selected profile picture.
  function handlePictureChange(event) {
    const file = event.target.files?.[0];

    setError("");
    setSuccess("");

    if (!file) {
      setProfilePicture(null);
      return;
    }

    const pictureError = validateProfilePicture(file);

    if (pictureError) {
      setProfilePicture(null);
      event.target.value = "";
      setError(pictureError);
      return;
    }

    setProfilePicture(file);
  }

  // Validate and submit employee updates.
  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const result = editEmployeeSchema.safeParse(form);

    if (!result.success) {
      setError(
        result.error.issues[0]?.message ||
          "Please check the form."
      );
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("id", String(id));

      Object.entries(result.data).forEach(([key, value]) => {
        formData.append(
          key,
          key === "workEmail" ? value.trim() : value ?? ""
        );
      });

      // Include a picture only when a new one was selected.
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
  }

  const pictureUrl = currentPicture
    ? currentPicture.startsWith("http")
      ? currentPicture
      : `https://localhost:7089${currentPicture}`
    : "";

  // Loading state.
  if (loading) {
    return (
      <div className="edit-loading">
        <p>Loading employee details...</p>
      </div>
    );
  }

  // Failed to load employee.
  if (error && !form.firstName && !form.workEmail) {
    return (
      <div className="edit-error-page">
        <div className="edit-alert edit-alert-error" role="alert">
          {error}
        </div>

        <button
          type="button"
          onClick={() => navigate("/employees")}
          className="edit-button edit-button-primary"
        >
          Back to Employees
        </button>
      </div>
    );
  }

  return (
    <main className="edit-employee-page">
      <div className="edit-employee-container">
        <header className="edit-page-header">
          <div>
            <h1>Edit Employee</h1>
            <p>
              Update employee information and profile picture.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/employees/${id}`)}
            className="edit-button edit-button-secondary"
            disabled={saving}
          >
            Cancel
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="edit-alert edit-alert-error"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="edit-alert edit-alert-success"
          >
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="edit-employee-form"
        >
          {/* Profile picture */}
          <section className="edit-form-section">
            <h2>Profile Picture</h2>

            <div className="edit-picture-row">
              {picturePreview || pictureUrl ? (
                <img
                  src={picturePreview || pictureUrl}
                  alt="Employee profile"
                  className="edit-profile-picture"
                />
              ) : (
                <div className="edit-picture-placeholder">
                  {form.firstName.charAt(0).toUpperCase() || "?"}
                </div>
              )}

              <div className="edit-picture-input">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handlePictureChange}
                />

                <p>
                  JPG, PNG, or WEBP. Maximum size: 5 MB.
                </p>
              </div>
            </div>
          </section>

          {/* Personal information */}
          <section className="edit-form-section">
            <h2>Personal Information</h2>

            <div className="edit-form-grid">
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

          {/* Employment information */}
          <section className="edit-form-section">
            <h2>Employment Information</h2>

            <div className="edit-form-grid">
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

          {/* Form actions */}
          <div className="edit-form-actions">
            <button
              type="button"
              onClick={() => navigate(`/employees/${id}`)}
              disabled={saving}
              className="edit-button edit-button-secondary"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="edit-button edit-button-primary"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
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
    <div className="edit-form-field">
      <label htmlFor={name}>
        {label}
        {required && <span className="edit-required"> *</span>}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        maxLength={name === "address" ? 300 : undefined}
        aria-invalid={false}
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
    <div className="edit-form-field">
      <label htmlFor={name}>
        {label}
        {required && <span className="edit-required"> *</span>}
      </label>

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
      >
        <option value="">Select {label}</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option === "FullTime"
              ? "Full Time"
              : option === "PartTime"
                ? "Part Time"
                : option === "OnLeave"
                  ? "On Leave"
                  : option}
          </option>
        ))}
      </select>
    </div>
  );
}
