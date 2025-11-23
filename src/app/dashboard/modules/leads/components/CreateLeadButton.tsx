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
  city: string;
  status:
    | ""
    | "Open"
    | "New"
    | "In Progress"
    | "Contact"
    | "Qualified"
    | "Closed"
    | "Converted";
  createdDate: string;
}

interface UserOption {
  label: string;
  value: string;
}

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: Omit<Lead, "id" | "createdDate">
  ) => boolean | Promise<boolean>;
  editData?: Lead | null;
  users: UserOption[];
  isAdmin: boolean;
  currentUserId?: string;
  currentUserName: string;
}

export default function LeadModal({
  isOpen,
  onClose,
  onSave,
  editData,
  users,
  isAdmin,
  currentUserId,
  currentUserName,
}: LeadModalProps) {
  const [formData, setFormData] = useState<Omit<Lead, "id" | "createdDate">>({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    jobTitle: "",
    contactOwner: [],
    city: "",
    status: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [typedEmail, setTypedEmail] = useState(false);
  const [typedPhone, setTypedPhone] = useState(false);

  useEffect(() => {
    if (editData) {
      const { id, createdDate, ...rest } = editData;
      setFormData({
        ...rest,
        phone: editData.fullPhone || editData.phone || "",
        contactOwner: Array.isArray(rest.contactOwner)
          ? rest.contactOwner.map((id) => String(id))
          : [String(rest.contactOwner)],
      });
    } else {
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        jobTitle: "",
        contactOwner: isAdmin ? [] : [currentUserId || ""],
        city: "",
        status: "",
      });
    }

    setErrors({});
    setTypedEmail(false);
    setTypedPhone(false);
  }, [editData, isOpen, isAdmin, currentUserId]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const lettersOnlyRegex = /^[A-Za-z\s]+$/;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (
      (name === "firstName" || name === "lastName" || name === "jobTitle") &&
      value &&
      !lettersOnlyRegex.test(value)
    ) {
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "email" && value.trim()) setTypedEmail(true);
  };

  const handlePhoneChange = (val: string) => {
    setFormData((prev) => ({ ...prev, phone: val }));
    if (val.trim()) setTypedPhone(true);
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

  const validate = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim())
      newErrors.email = "Please enter an Email Address";
    else if (!emailRegex.test(formData.email.trim()))
      newErrors.email = "Please enter a valid email address";

    if (!formData.firstName.trim())
      newErrors.firstName = "First Name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last Name is required";

    if (formData.firstName && !lettersOnlyRegex.test(formData.firstName))
      newErrors.firstName = "Only letters allowed";
    if (formData.lastName && !lettersOnlyRegex.test(formData.lastName))
      newErrors.lastName = "Only letters allowed";

    if (formData.jobTitle && !lettersOnlyRegex.test(formData.jobTitle))
      newErrors.jobTitle = "Only letters allowed";

    const cleanedPhone = formData.phone.replace(/[\s()-]/g, "");
    if (!cleanedPhone.trim()) newErrors.phone = "Please enter a phone number";
    else if (!/^\+?\d+$/.test(cleanedPhone) || cleanedPhone.length < 7)
      newErrors.phone = "Please enter a valid phone number";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return false;

    if (!formData.jobTitle) {
      notify("⚠️ Job Title is required", "info");
      return false;
    }

    if (!formData.status) {
      notify("⚠️ Lead Status is required", "info");
      return false;
    }

    if (!editData && formData.contactOwner.length === 0) {
      notify("⚠️ Contact Owner is required when creating a lead", "info");
      return false;
    }

    const success = await onSave({
      ...formData,
      phone: cleanedPhone,
      fullPhone: formData.phone,
    });

    return success;
  };

  const inputHeight = "h-[36px]";

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
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
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
          >
            <input
              type="email"
              name="email"
              placeholder="Enter"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleEmailBlur}
              className="flex-1 text-sm text-gray-700 placeholder-gray-400 focus:outline-none h-[36px] bg-transparent px-3"
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
              errors.firstName ? "border-red-500" : "border-gray-300"
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
              errors.lastName ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.lastName && (
            <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
          )}
        </div>

        <PhoneInputField
          value={formData.phone}
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
            className={`${inputHeight} ${
              errors.jobTitle ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.jobTitle && (
            <p className="text-red-500 text-sm mt-1">{errors.jobTitle}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <Inputs
            variant="input"
            name="city"
            placeholder="Enter"
            value={formData.city}
            onChange={handleChange}
            className={`${inputHeight} border-gray-300`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Owner
          </label>
          {isAdmin ? (
            <Inputs
              variant="multiselect"
              name="contactOwner"
              placeholder="Choose"
              value={formData.contactOwner}
              onChange={(selectedValues) =>
                setFormData((prev) => ({
                  ...prev,
                  contactOwner: selectedValues,
                }))
              }
              className={`${inputHeight} border-gray-300`}
              options={users}
            />
          ) : (
            <div className="border border-gray-300 bg-gray-50 rounded-md px-3 py-2 h-[36px] flex items-center text-gray-700 text-sm">
              {currentUserName}
            </div>
          )}
        </div>

        {editData?.status === "Converted" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lead Status
            </label>
            <div className="border border-gray-300 bg-gray-50 rounded-md px-3 py-2 h-[36px] flex items-center text-gray-700 text-sm">
              Converted
            </div>
          </div>
        ) : (
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
              className={`${inputHeight} border-gray-300`}
              options={[
                { label: "Open", value: "Open" },
                { label: "New", value: "New" },
                { label: "In Progress", value: "In Progress" },
                { label: "Contact", value: "Contact" },
                { label: "Qualified", value: "Qualified" },
                { label: "Closed", value: "Closed" },
              ]}
            />
          </div>
        )}
      </div>
    </ModalWrapper>
  );
}
