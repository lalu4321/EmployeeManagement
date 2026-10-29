import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import api from "../api/axios";
import "../styles/addEmployee.css";

import {
  employeeSchema,
  departments,
  employmentTypes,
  employmentStatuses,
  getLocalDateString,
  getMinimumJoiningDate,
} from "../validators/validation";

export default function AddEmployee() {
  const navigate = useNavigate();

  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      workEmail: "",
      phoneNumber: "",
      department: "",
      jobTitle: "",
      employmentType: "FullTime",
      joiningDate: getLocalDateString(new Date()),
      employmentStatus: "Active",
      workLocation: "",
      address: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const address = watch("address") || "";

  function onInvalid(validationErrors) {
    console.error("Employee validation errors:", validationErrors);

    const messages = Object.values(validationErrors)
      .map((error) => error?.message)
      .filter(Boolean);

    setServerError(
      messages.length
        ? [...new Set(messages)].join(" ")
        : "Please correct the highlighted fields."
    );
  }

  async function onSubmit(values) {
    setServerError("");

    try {
      // Check matching passwords before making the API request.
      if (values.password !== values.confirmPassword) {
        setServerError("Passwords do not match.");
        return;
      }

      // Include confirmPassword because the C# DTO requires it.
      const payload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        workEmail: values.workEmail.trim(),
        password: values.password,
        confirmPassword: values.confirmPassword,
        phoneNumber: values.phoneNumber.trim(),
        department: values.department,
        jobTitle: values.jobTitle.trim(),
        employmentType: values.employmentType,
        joiningDate: values.joiningDate,
        employmentStatus: values.employmentStatus,
        workLocation: values.workLocation.trim(),
        address: values.address.trim(),
      };

      await api.post("/employees", payload);

      window.alert("Employee created successfully.");

      navigate("/employees", { replace: true });
    } catch (error) {
      console.error("Create employee request failed:", {
        status: error.response?.status,
        data: error.response?.data,
      });

      const status = error.response?.status;
      const responseData = error.response?.data;

      const validationMessages = responseData?.errors
        ? Object.values(responseData.errors)
            .flat()
            .filter((message) => typeof message === "string")
            .join(" ")
        : "";

      const message =
        validationMessages ||
        responseData?.message ||
        responseData?.title ||
        (status === 400
          ? "The server rejected the employee details. Check the validation errors."
          : status === 401
            ? "Your session has expired. Please sign in again."
            : status === 403
              ? "You are not authorized to create employees."
              : status === 409
                ? "This work email may already be registered."
                : error.code === "ERR_NETWORK"
                  ? "Cannot connect to the backend. Make sure the API is running."
                  : "Could not create the employee. Please try again.");

      setServerError(message);
    }
  }

  return (
    <main className="add-employee-page">
      <div className="add-employee-container">
        <button
          type="button"
          onClick={() => navigate("/employees")}
          className="back-link"
          disabled={isSubmitting}
        >
          <ArrowLeft size={18} />
          <span>Back to employees</span>
        </button>

        <section className="employee-card">
          <header className="employee-card-header">
            <div className="employee-icon">
              <UserPlus size={26} />
            </div>

            <div>
              <h1 className="employee-page-title">
                Add employee
              </h1>

              <p className="employee-subtitle">
                Enter employee details and create a temporary
                login password.
              </p>
            </div>
          </header>

          {serverError && (
            <p role="alert" className="server-error">
              {serverError}
            </p>
          )}

          <form
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            className="employee-form"
            noValidate
          >
            {/* Personal and contact information */}
            <section className="form-section">
              <h2 className="form-section-title">
                Personal and contact information
              </h2>

              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label" htmlFor="firstName">
                    First name *
                  </label>
                  <input
                    id="firstName"
                    {...register("firstName")}
                    maxLength={50}
                    autoComplete="given-name"
                    className="form-control"
                    aria-invalid={Boolean(errors.firstName)}
                  />
                  {errors.firstName && (
                    <p className="field-error">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="lastName">
                    Last name *
                  </label>
                  <input
                    id="lastName"
                    {...register("lastName")}
                    maxLength={50}
                    autoComplete="family-name"
                    className="form-control"
                    aria-invalid={Boolean(errors.lastName)}
                  />
                  {errors.lastName && (
                    <p className="field-error">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="workEmail">
                    Work email *
                  </label>
                  <input
                    id="workEmail"
                    type="email"
                    {...register("workEmail")}
                    maxLength={254}
                    autoComplete="email"
                    className="form-control"
                    aria-invalid={Boolean(errors.workEmail)}
                  />
                  {errors.workEmail && (
                    <p className="field-error">
                      {errors.workEmail.message}
                    </p>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="phoneNumber">
                    Phone number *
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    {...register("phoneNumber")}
                    inputMode="numeric"
                    maxLength={10}
                    autoComplete="tel"
                    className="form-control"
                    aria-invalid={Boolean(errors.phoneNumber)}
                  />
                  {errors.phoneNumber && (
                    <p className="field-error">
                      {errors.phoneNumber.message}
                    </p>
                  )}
                </div>

                <div className="form-field form-field-wide">
                  <label className="form-label" htmlFor="address">
                    Address (optional)
                  </label>
                  <textarea
                    id="address"
                    {...register("address")}
                    rows={3}
                    maxLength={300}
                    className="form-control"
                    aria-invalid={Boolean(errors.address)}
                  />
                  <p className="character-count">
                    {address.length}/300 characters
                  </p>
                  {errors.address && (
                    <p className="field-error">
                      {errors.address.message}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Employment information */}
            <section className="form-section form-section-divided">
              <h2 className="form-section-title">
                Employment information
              </h2>

              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label" htmlFor="department">
                    Department *
                  </label>
                  <select
                    id="department"
                    {...register("department")}
                    className="form-control"
                    aria-invalid={Boolean(errors.department)}
                  >
                    <option value="">Select department</option>
                    {departments.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  {errors.department && (
                    <p className="field-error">
                      {errors.department.message}
                    </p>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="jobTitle">
                    Job title *
                  </label>
                  <input
                    id="jobTitle"
                    {...register("jobTitle")}
                    maxLength={100}
                    className="form-control"
                    aria-invalid={Boolean(errors.jobTitle)}
                  />
                  {errors.jobTitle && (
                    <p className="field-error">
                      {errors.jobTitle.message}
                    </p>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="workLocation">
                    Work location *
                  </label>
                  <input
                    id="workLocation"
                    {...register("workLocation")}
                    maxLength={100}
                    className="form-control"
                    aria-invalid={Boolean(errors.workLocation)}
                  />
                  {errors.workLocation && (
                    <p className="field-error">
                      {errors.workLocation.message}
                    </p>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="employmentType">
                    Employment type *
                  </label>
                  <select
                    id="employmentType"
                    {...register("employmentType")}
                    className="form-control"
                    aria-invalid={Boolean(errors.employmentType)}
                  >
                    <option value="">Select employment type</option>
                    {employmentTypes.map((item) => (
                      <option key={item} value={item}>
                        {item === "FullTime"
                          ? "Full Time"
                          : item === "PartTime"
                            ? "Part Time"
                            : item}
                      </option>
                    ))}
                  </select>
                  {errors.employmentType && (
                    <p className="field-error">
                      {errors.employmentType.message}
                    </p>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="joiningDate">
                    Joining date *
                  </label>
                  <input
                    id="joiningDate"
                    type="date"
                    min={getMinimumJoiningDate()}
                    {...register("joiningDate")}
                    className="form-control"
                    aria-invalid={Boolean(errors.joiningDate)}
                  />
                  {errors.joiningDate && (
                    <p className="field-error">
                      {errors.joiningDate.message}
                    </p>
                  )}
                </div>

                <div className="form-field">
                  <label
                    className="form-label"
                    htmlFor="employmentStatus"
                  >
                    Employment status *
                  </label>
                  <select
                    id="employmentStatus"
                    {...register("employmentStatus")}
                    className="form-control"
                    aria-invalid={Boolean(errors.employmentStatus)}
                  >
                    <option value="">Select employment status</option>
                    {employmentStatuses.map((item) => (
                      <option key={item} value={item}>
                        {item === "OnLeave" ? "On Leave" : item}
                      </option>
                    ))}
                  </select>
                  {errors.employmentStatus && (
                    <p className="field-error">
                      {errors.employmentStatus.message}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Employee login credentials */}
            <section className="form-section form-section-divided">
              <h2 className="form-section-title">
                Employee login credentials
              </h2>

              <p className="employee-subtitle credentials-description">
                Create a temporary password and share it securely
                with the employee.
              </p>

              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label" htmlFor="password">
                    Create password *
                  </label>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    autoComplete="new-password"
                    maxLength={72}
                    className="form-control"
                    aria-invalid={Boolean(errors.password)}
                  />
                  <p className="field-help">
                    At least 8 characters, including uppercase,
                    lowercase, a number and a special character.
                  </p>
                  {errors.password && (
                    <p className="field-error">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="form-field">
                  <label
                    className="form-label"
                    htmlFor="confirmPassword"
                  >
                    Confirm password *
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    {...register("confirmPassword")}
                    autoComplete="new-password"
                    maxLength={72}
                    className="form-control"
                    aria-invalid={Boolean(errors.confirmPassword)}
                  />
                  {errors.confirmPassword && (
                    <p className="field-error">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="form-field form-field-wide">
                  <label className="show-password-label">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(event) =>
                        setShowPassword(event.target.checked)
                      }
                      className="show-password-checkbox"
                    />
                    <span>Show passwords</span>
                  </label>
                </div>
              </div>
            </section>

            <p className="field-help profile-picture-note">
              Profile pictures are optional and can be added later
              from Edit Employee.
            </p>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate("/employees")}
                className="secondary-button"
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="primary-button"
              >
                <Save size={18} />
                <span>
                  {isSubmitting ? "Creating..." : "Create employee"}
                </span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
