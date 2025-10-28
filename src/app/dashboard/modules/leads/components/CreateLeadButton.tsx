"use client";

import React, { useState, useEffect } from "react";
import ModalWrapper from "@/components/modal/ModalWrapper";
import { Inputs } from "@/components/ui/Inputs";
import { notify } from "@/components/ui/toast/Notify";
import PhoneInputField from "../../../../../components/ui/PhoneInputField";

export interface Lead {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  fullPhone?: string;
  jobTitle: string;
  contactOwner: string[];
  status: "Open" | "New" | "In Progress" | "Qualified" | "Closed";
  createdDate: string;
}

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Omit<Lead, "id" | "createdDate">) => boolean;
  editData?: Lead | null;
}

export default function LeadModal({
  isOpen,
  onClose,
  onSave,
  editData,
}: LeadModalProps) {
  const [formData, setFormData] = useState<Omit<Lead, "id" | "createdDate">>({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    jobTitle: "",
    contactOwner: [],
    status: "New",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [typedEmail, setTypedEmail] = useState(false);
  const [typedPhone, setTypedPhone] = useState(false);

  useEffect(() => {
    if (editData) {
      const { id, createdDate, ...rest } = editData;
      setFormData({
        ...rest,
        contactOwner: Array.isArray(rest.contactOwner)
          ? rest.contactOwner
          : [rest.contactOwner].filter(Boolean),
        phone: editData.fullPhone || editData.phone || "",
      });
      setErrors({});
      setTypedEmail(false);
      setTypedPhone(false);
    } else {
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        jobTitle: "",
        contactOwner: [],
        status: "" as any,
      });
      setErrors({});
      setTypedEmail(false);
      setTypedPhone(false);
    }
  }, [editData, isOpen]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "email" && value.trim().length > 0) setTypedEmail(true);
  };

  const handlePhoneChange = (val: string) => {
    setFormData((prev) => ({ ...prev, phone: val }));
    if (val.trim().length > 0) setTypedPhone(true);
  };

  const handleEmailBlur = () => {
    if (!typedEmail) return;
    if (formData.email.trim() && !emailRegex.test(formData.email.trim())) {
      setErrors((prev) => ({
        ...prev,
        email: "Please enter a valid email address",
      }));
    } else {
      setErrors((prev) => {
        const { email, ...rest } = prev;
        return rest;
      });
    }
  };

  const handlePhoneBlur = () => {
    if (!typedPhone) return;
    const cleaned = formData.phone.replace(/[\s()-]/g, "");
    if (cleaned.trim() && (!/^\+?\d+$/.test(cleaned) || cleaned.length < 7)) {
      setErrors((prev) => ({
        ...prev,
        phone: "Please enter a valid phone number",
      }));
    } else {
      setErrors((prev) => {
        const { phone, ...rest } = prev;
        return rest;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim())
      newErrors.email = "Please enter an Email Address";
    else if (!emailRegex.test(formData.email.trim()))
      newErrors.email = "Please enter a valid email address";

    if (!formData.firstName.trim())
      newErrors.firstName = "First Name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last Name is required";

    const cleanedPhone = formData.phone.replace(/[\s()-]/g, "");
    if (!cleanedPhone.trim()) newErrors.phone = "Please enter a phone number";
    else if (!/^\+?\d+$/.test(cleanedPhone) || cleanedPhone.length < 7)
      newErrors.phone = "Please enter a valid phone number";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return false;

    if (
      !formData.jobTitle ||
      !formData.contactOwner.length ||
      !formData.status
    ) {
      notify(
        "⚠️ Please fill Job Title, Contact Owner, and Lead Status",
        "info"
      );
      return false;
    }

    const success = onSave({
      ...formData,
      phone: cleanedPhone,
      fullPhone: formData.phone,
    });
    if (success) setTimeout(() => onClose(), 150);
    else notify(" Failed to save lead", "error");
    return success;
  };

  const inputHeight = "h-[36px]";

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={() => {
        setErrors({});
        onClose();
      }}
      onSave={validate}
      title={editData ? "Edit Lead" : "Create Lead"}
    >
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <div
            className={`flex items-center border rounded-md bg-white transition-all ${
              errors.email
                ? "border-red-500 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
                : "border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
            }`}
          >
            <div className="flex items-center justify-center pl-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="w-px h-4 bg-gray-300 mx-3" />
            <input
              type="email"
              name="email"
              placeholder="Enter"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleEmailBlur}
              className="flex-1 text-sm text-gray-700 placeholder-gray-400 focus:outline-none h-[36px] bg-transparent"
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <Inputs
            variant="input"
            name="firstName"
            placeholder="Enter"
            value={formData.firstName}
            onChange={handleChange}
            className={`${inputHeight} ${
              errors.firstName
                ? "border-red-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            }`}
          />
          {errors.firstName && (
            <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <Inputs
            variant="input"
            name="lastName"
            placeholder="Enter"
            value={formData.lastName}
            onChange={handleChange}
            className={`${inputHeight} ${
              errors.lastName
                ? "border-red-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            }`}
          />
          {errors.lastName && (
            <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
          )}
        </div>

        <PhoneInputField
          value={editData?.fullPhone || editData?.phone || formData.phone || ""}
          onChange={handlePhoneChange}
          onBlur={handlePhoneBlur}
          error={errors.phone}
          label="Phone Number"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Title
          </label>
          <Inputs
            variant="input"
            name="jobTitle"
            placeholder="Enter"
            value={formData.jobTitle}
            onChange={handleChange}
            className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 h-[36px]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Owner
          </label>
          <Inputs
            variant="multiselect"
            name="contactOwner"
            placeholder="Choose"
            value={formData.contactOwner}
            onChange={(selectedValues) =>
              setFormData((prev) => ({ ...prev, contactOwner: selectedValues }))
            }
            className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 h-[36px]"
            options={[
              { label: "Maria Johnson", value: "Maria Johnson" },
              { label: "Mizba", value: "Mizba" },
              { label: "Shaimah", value: "Shaimah" },
              { label: "Sabira", value: "Sabira" },
              { label: "Greeshma", value: "Greeshma" },
              { label: "Shifa", value: "Shifa" },
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lead Status
          </label>
          <Inputs
            variant="select"
            name="status"
            placeholder="Choose"
            value={formData.status}
            onChange={handleChange}
            className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 h-[36px]"
            options={[
              { label: "Open", value: "Open" },
              { label: "New", value: "New" },
              { label: "In Progress", value: "In Progress" },
              { label: "Qualified", value: "Qualified" },
              { label: "Closed", value: "Closed" },
            ]}
          />
        </div>
      </div>
    </ModalWrapper>
  );
}
