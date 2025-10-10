"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";

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
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<Form>(initial);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError(null);
    setOk(false);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError("First name, last name, and email are required");
      return;
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    if (!emailOk) {
      setError("Enter a valid email");
      return;
    }

    if (!form.password.trim() || !form.confirm.trim()) {
      setError("Password and confirm password are required");
      return;
    }

    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }

   
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    users.push({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      company: form.company,
      industry: form.industry,
      country: form.country,
      password: form.password,
    });
    localStorage.setItem("users", JSON.stringify(users));

    setOk(true);
    setTimeout(() => router.push("/auth/login"), 600);
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
              placeholder="Enter your first name"
              className="ui-input"
            />
          </Field>

          <Field label="Last Name">
            <input
              name="lastName"
              type="text"
              value={form.lastName}
              onChange={onChange}
              placeholder="Enter your last name"
              className="ui-input"
            />
          </Field>

          <Field label="Email">
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              placeholder="Enter your email"
              className="ui-input"
            />
          </Field>

          <Field label="Phone Number">
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={onChange}
              placeholder="Enter your phone number"
              className="ui-input"
            />
          </Field>

          <Field label="Company Name">
            <input
              name="company"
              type="text"
              value={form.company}
              onChange={onChange}
              placeholder="Enter your company name"
              className="ui-input"
            />
          </Field>

          <Field label="Industry Type">
            <select
              name="industry"
              value={form.industry}
              onChange={onChange}
              className="ui-input"
            >
              <option value="">Choose</option>
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
              placeholder="Enter your country or region"
              className="ui-input"
            />
          </Field>

          <Field label="Password">
            <div className="relative">
              <input
                name="password"
                type={showPwd ? "text" : "password"}
                value={form.password}
                onChange={onChange}
                placeholder="Create a password"
                className="ui-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPwd ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </Field>

          <Field label="Confirm Password">
            <div className="relative">
              <input
                name="confirm"
                type={showConfirm ? "text" : "password"}
                value={form.confirm}
                onChange={onChange}
                placeholder="Re-enter your password"
                className="ui-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showConfirm ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </Field>
        </div>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        {ok && (
          <p className="mt-3 text-sm text-emerald-700">
            Registration successful. Please Wait...
          </p>
        )}

        <div className="mt-5">
          <button
            type="submit"
            className="w-full rounded-md bg-indigo-700 py-2.5 text-white hover:bg-indigo-600"
          >
            Register
          </button>
        </div>
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
