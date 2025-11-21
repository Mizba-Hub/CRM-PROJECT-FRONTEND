"use client";

import React, { useEffect, useState } from "react";
import ModalWrapper from "@/components/modal/ModalWrapper";
import { Inputs } from "@/components/ui/Inputs";
import { notify } from "@/components/ui/toast/Notify";
import PhoneInputField from "@/components/ui/PhoneInputField";

export type CompanyFormData = {
  domainName: string;
  companyName: string;
  companyOwner: number[];
  industryType: string;
  type: string;
  city: string;
  country: string;
  noOfEmployees: number | "";
  annualRevenue: number | "";
  phoneNumber: string;
  leadId?: number;
};

interface CompanyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CompanyFormData) => void;
  formData: CompanyFormData;
  setFormData: React.Dispatch<React.SetStateAction<CompanyFormData>>;
  allOwners: { id: number; label: string; value: string }[];
  allLeads: { id: number; name: string; phoneNumber: string }[];
  onLeadSelect: (leadId: number) => void;
}

export default function CompanyFormModal({
  isOpen,
  onClose,
  onSave,
  formData,
  setFormData,
  allOwners,
  allLeads,
  onLeadSelect,
}: CompanyFormModalProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) setErrors({});
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "noOfEmployees" || name === "annualRevenue") {
      const digitsOnly = value.replace(/\D/g, "");
      setFormData((prev) => ({
        ...prev,
        [name]: digitsOnly === "" ? "" : parseInt(digitsOnly, 10),
      }));
    } else if (name === "city" || name === "country") {
      const lettersOnly = value.replace(/[^a-zA-Z\s]/g, "");
      setFormData((prev) => ({ ...prev, [name]: lettersOnly }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleLeadSelect = (leadId: number) => {
    const selectedLead = allLeads.find((l) => l.id === leadId);
    setFormData((prev) => ({
      ...prev,
      leadId,
      phoneNumber: selectedLead?.phoneNumber || "",
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.domainName.trim())
      newErrors.domainName = "Domain is required";
    if (!formData.companyName.trim())
      newErrors.companyName = "Company Name is required";
    if (formData.companyOwner.length === 0)
      newErrors.companyOwner = "Select at least 1 owner";
    if (!formData.industryType.trim())
      newErrors.industryType = "Industry is required";
    if (!formData.type.trim()) newErrors.type = "Type is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.country.trim()) newErrors.country = "Country is required";
    if (formData.noOfEmployees === "" || formData.noOfEmployees < 0)
      newErrors.noOfEmployees = "Required";
    if (formData.annualRevenue === "" || formData.annualRevenue < 0)
      newErrors.annualRevenue = "Required";
    if (!formData.phoneNumber.trim())
      newErrors.phoneNumber = "Phone Number is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      notify("⚠ Please fill all required fields", "error");
      return false;
    }
    return true;
  };

  const handleSaveClick = (): boolean => {
    if (!validate()) return false;
    onSave({ ...formData });
    notify("Company saved successfully", "success");
    return true;
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Create Company"
      onSave={handleSaveClick}
    >
      <div className="space-y-4">
        <Inputs
          id="domainName"
          variant="input"
          label="Domain Name *"
          name="domainName"
          placeholder="Enter"
          value={formData.domainName}
          onChange={handleChange}
          className={errors.domainName ? "border-red-500" : ""}
        />

        <Inputs
          id="companyName"
          variant="input"
          label="Company Name *"
          name="companyName"
          placeholder="Enter"
          value={formData.companyName}
          onChange={handleChange}
          className={errors.companyName ? "border-red-500" : ""}
        />

        <Inputs
          id="leadId"
          variant="select"
          label="Lead Name"
          name="leadId"
          placeholder="Select lead"
          value={formData.leadId || ""}
          onChange={(e) => handleLeadSelect(Number(e.target.value))}
          options={allLeads.map((l) => ({
            label: l.name,
            value: String(l.id),
          }))}
        />

        <Inputs
          id="companyOwner"
          variant="multiselect"
          label="Company Owner"
          name="companyOwner"
          placeholder="Select owners"
          options={allOwners.map((o) => ({
            label: o.label,
            value: String(o.id),
          }))}
          value={formData.companyOwner.map(String)}
          onChange={(val) =>
            setFormData((prev) => ({
              ...prev,
              companyOwner: val.map(Number),
            }))
          }
        />

        <div className="grid grid-cols-2 gap-4">
          <Inputs
            id="industryType"
            variant="select"
            label="Industry *"
            name="industryType"
            placeholder="Choose"
            value={formData.industryType}
            onChange={handleChange}
            options={[
              { label: "Technology", value: "Technology" },
              { label: "Education", value: "Education" },
              { label: "Finance", value: "Finance" },
              { label: "Healthcare", value: "Healthcare" },
              { label: "Retail", value: "Retail" },
            ]}
            className={errors.industryType ? "border-red-500" : ""}
          />

          <Inputs
            id="type"
            variant="select"
            label="Type *"
            name="type"
            placeholder="Choose"
            value={formData.type}
            onChange={handleChange}
            options={[
              { label: "Private", value: "Private" },
              { label: "Public", value: "Public" },
              { label: "Government", value: "Government" },
              { label: "Non-profit", value: "Non-profit" },
            ]}
            className={errors.type ? "border-red-500" : ""}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Inputs
            id="city"
            variant="input"
            label="City *"
            name="city"
            placeholder="Enter"
            value={formData.city}
            onChange={handleChange}
            className={errors.city ? "border-red-500" : ""}
          />

          <Inputs
            id="country"
            variant="input"
            label="Country/Region *"
            name="country"
            placeholder="Enter"
            value={formData.country}
            onChange={handleChange}
            className={errors.country ? "border-red-500" : ""}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Inputs
            id="noOfEmployees"
            variant="input"
            label="No. of Employees *"
            name="noOfEmployees"
            placeholder="Enter"
            value={formData.noOfEmployees.toString()}
            onChange={handleChange}
            className={errors.noOfEmployees ? "border-red-500" : ""}
          />

          <Inputs
            id="annualRevenue"
            variant="input"
            label="Annual Revenue *"
            name="annualRevenue"
            placeholder="Enter"
            value={formData.annualRevenue.toString()}
            onChange={handleChange}
            className={errors.annualRevenue ? "border-red-500" : ""}
          />
        </div>

        <PhoneInputField
          label="Phone Number *"
          value={formData.phoneNumber}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, phoneNumber: value }))
          }
          error={errors.phoneNumber}
          required
        />
      </div>
    </ModalWrapper>
  );
}
