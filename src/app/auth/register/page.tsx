"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { registerUser } from "@/store/slices/authSlice";

type Form = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  industry: string;
  country: string;
  password: string;
  confirm: string;
  role: string;
};

const initial: Form = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  industry: "",
  country: "",
  password: "",
  confirm: "",
  role: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { error, loading } = useAppSelector((state) => state.auth);

  const [form, setForm] = useState<Form>(initial);
  const [errors, setErrors] = useState<Partial<Form>>({});
  const [ok, setOk] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function onChange(e: any) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    setErrors((prev) => ({ ...prev, [name]: "" }));
    setOk(false);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const newErrors: Partial<Form> = {};

    if (!form.firstName.trim()) newErrors.firstName = "First name is required";
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required";

    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Enter a valid email";

    if (form.phone.trim()) {
      if (!/^[0-9]{10}$/.test(form.phone))
        newErrors.phone = "Phone number must be 10 digits";
    }

    if (!form.password.trim()) newErrors.password = "Password is required";
    if (!form.confirm.trim())
      newErrors.confirm = "Confirm password is required";

    if (form.password !== form.confirm)
      newErrors.confirm = "Passwords do not match";

    if (!form.role.trim()) newErrors.role = "Role is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    const result = await dispatch(
      registerUser({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        companyName: form.company,
        industryType: form.industry,
        country: form.country,
        password: form.password,
        confirmPassword: form.confirm,
        role: form.role,
      })
    );

    if (registerUser.fulfilled.match(result)) {
      setOk(true);
      setTimeout(() => router.push("/auth/login"), 1000);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        noValidate
        className="w-full max-w-3xl bg-white p-10 rounded-xl shadow"
      >
        <h1 className="text-2xl font-semibold text-gray-900 text-center mb-6">
          Register
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="First Name">
            <input
              name="firstName"
              type="text"
              value={form.firstName}
              onChange={onChange}
              className={`ui-input ${errors.firstName ? "border-red-500" : ""}`}
              placeholder="Enter your first name"
            />
            {errors.firstName && (
              <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>
            )}
          </Field>

          <Field label="Last Name">
            <input
              name="lastName"
              type="text"
              value={form.lastName}
              onChange={onChange}
              className={`ui-input ${errors.lastName ? "border-red-500" : ""}`}
              placeholder="Enter your last name"
            />
            {errors.lastName && (
              <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>
            )}
          </Field>

          <Field label="Email">
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              className={`ui-input ${errors.email ? "border-red-500" : ""}`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-red-600 text-xs mt-1">{errors.email}</p>
            )}
          </Field>

          <Field label="Phone Number">
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={onChange}
              className={`ui-input ${errors.phone ? "border-red-500" : ""}`}
              placeholder="Enter your phone number"
            />
            {errors.phone && (
              <p className="text-red-600 text-xs mt-1">{errors.phone}</p>
            )}
          </Field>

          <Field label="Company Name">
            <input
              name="company"
              type="text"
              value={form.company}
              onChange={onChange}
              className="ui-input"
              placeholder="Enter your company name"
            />
          </Field>

          <Field label="Role">
            <select
              name="role"
              value={form.role}
              onChange={onChange}
              className={`ui-input ${errors.role ? "border-red-500" : ""}`}
            >
              <option value="" disabled>
                Choose
              </option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
            {errors.role && (
              <p className="text-red-600 text-xs mt-1">{errors.role}</p>
            )}
          </Field>

          <Field label="Industry Type">
            <select
              name="industry"
              value={form.industry}
              onChange={onChange}
              className="ui-input"
            >
              <option value="" disabled>
                Choose
              </option>
              <option value="Software">Software</option>
              <option value="Finance">Finance</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
            </select>
          </Field>

          <Field label="Country / Region">
            <input
              name="country"
              type="text"
              value={form.country}
              onChange={onChange}
              className="ui-input"
              placeholder="Enter your country or region"
            />
          </Field>

          <Field label="Password">
            <div className="relative">
              <input
                name="password"
                type={showPwd ? "text" : "password"}
                value={form.password}
                onChange={onChange}
                className={`ui-input pr-10 ${
                  errors.password ? "border-red-500" : ""
                }`}
                placeholder="Create a password"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPwd ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-600 text-xs mt-1">{errors.password}</p>
            )}
          </Field>

          <Field label="Confirm Password">
            <div className="relative">
              <input
                name="confirm"
                type={showConfirm ? "text" : "password"}
                value={form.confirm}
                onChange={onChange}
                className={`ui-input pr-10 ${
                  errors.confirm ? "border-red-500" : ""
                }`}
                placeholder="Re-enter your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showConfirm ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.confirm && (
              <p className="text-red-600 text-xs mt-1">{errors.confirm}</p>
            )}
          </Field>
        </div>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        {ok && (
          <p className="mt-3 text-sm text-emerald-700">
            Registration successful. Redirecting to login...
          </p>
        )}

        <div className="mt-5">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indigo-700 py-2.5 text-white hover:bg-indigo-600 disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </div>

        <p className="text-center text-sm text-gray-600 mt-3">
          Already have an account?{" "}
          <a href="/auth/login" className="text-violet-600 hover:underline">
            Log in
          </a>
        </p>
      </form>
    </main>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block text-gray-700">{label}</span>
      {children}
    </label>
  );
}
