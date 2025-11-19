"use client";

import React from "react";

export type CompanyFormData = {
  domainName: string;
  companyName: string;
  companyOwner: number[]; // IDs for multiselect
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
  formData: CompanyFormData;
  setFormData: React.Dispatch<React.SetStateAction<CompanyFormData>>;
  allOwners?: { id: number; name: string }[]; // <-- FIXED TYPE
}

export default function CompanyFormModal({
  formData,
  setFormData,
  allOwners = [],
}: CompanyFormModalProps) {
  // Generic text handler
  const handleStringChange =
    (field: keyof CompanyFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  // Number handler
  const handleNumberChange =
    (field: keyof CompanyFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const num = Number(e.target.value);
      setFormData((prev) => ({ ...prev, [field]: isNaN(num) ? 0 : num }));
    };

  // Owner multi-select handler (IDs only)
  const handleOwnersChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIds = Array.from(e.target.selectedOptions, (opt) =>
      Number(opt.value)
    );
    setFormData((prev) => ({ ...prev, companyOwner: selectedIds }));
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Company Name */}
      <input
        type="text"
        placeholder="Company Name"
        value={formData.companyName}
        onChange={handleStringChange("companyName")}
        className="border p-2 rounded"
      />

      {/* Domain */}
      <input
        type="text"
        placeholder="Domain"
        value={formData.domainName}
        onChange={handleStringChange("domainName")}
        className="border p-2 rounded"
      />

      {/* Type */}
      <select
        value={formData.type}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, type: e.target.value }))
        }
        className="border p-2 rounded"
      >
        <option value="">Select Type</option>
        <option value="Private">Private</option>
        <option value="Public">Public</option>
      </select>

      {/* Industry */}
      <select
        value={formData.industryType}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, industry: e.target.value }))
        }
        className="border p-2 rounded"
      >
        <option value="">Select Industry</option>
        <option value="IT">IT</option>
        <option value="Finance">Finance</option>
        <option value="Healthcare">Healthcare</option>
      </select>

      {/* Company Owner (MULTI-SELECT) */}
      <div>
        <label className="block mb-1">Company Owner</label>

        <select
          multiple
          value={formData.companyOwner.map(String)} // number[] -> string[]
          onChange={handleOwnersChange}
          className="border p-2 rounded w-full h-24"
        >
          {allOwners.map((owner) => (
            <option key={owner.id} value={owner.id.toString()}>
              {owner.name}
            </option>
          ))}
        </select>
      </div>

      {/* City */}
      <input
        type="text"
        placeholder="City"
        value={formData.city}
        onChange={handleStringChange("city")}
        className="border p-2 rounded"
      />

      {/* Country */}
      <input
        type="text"
        placeholder="Country / Region"
        value={formData.country}
        onChange={handleStringChange("country")}
        className="border p-2 rounded"
      />

      {/* Employees */}
      <input
        type="number"
        placeholder="No. of Employees"
        value={formData.noOfEmployees}
        onChange={handleNumberChange("noOfEmployees")}
        className="border p-2 rounded"
      />

      {/* Revenue */}
      <input
        type="number"
        placeholder="Annual Revenue"
        value={formData.annualRevenue}
        onChange={handleNumberChange("annualRevenue")}
        className="border p-2 rounded"
      />

      {/* Phone */}
      <input
        type="text"
        placeholder="Phone Number"
        value={formData.phoneNumber}
        onChange={handleStringChange("phoneNumber")}
        className="border p-2 rounded"
      />

      {/* Website */}
      
    </div>
  );
}
