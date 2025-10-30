"use client";

import React, { useState } from "react";
import { Inputs } from "@/components/ui/Inputs";
import PhoneInputField from "@/components/ui/PhoneInputField";

export interface CompanyFormData {
  domain: string;
  companyName: string;
  companyOwner: string[]; 
  industry: string;
  type: string;
  city: string;
  country: string;
  employees: string;
  revenue: string;
  phone: string;
  website?: string;
  logoUrl?: string;
}

interface FormModalProps {
  formData: CompanyFormData;
  handleChange: (e: { target: { name: string; value: string | string[] } }) => void;
}

export default function FormModal({ formData, handleChange }: FormModalProps) {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleValidation = (name: string, value: string | string[]) => {
    if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === "string" && !value.trim())) {
      setErrors((prev) => ({ ...prev, [name]: "This field is required" }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <form className="grid grid-cols-2 gap-4 mt-2">
      
       <div className="col-span-2">
      <Inputs
        name="domain"
        label={<>Domain Name <span className="text-red-500">*</span></>}
        placeholder="Enter"
        value={formData.domain}
        onChange={(e) => {
          handleChange({ target: { name: e.target.name, value: e.target.value } });
          handleValidation(e.target.name, e.target.value);
        }}
      />
      </div>

      
       <div className="col-span-2">
      <Inputs
        name="companyName"
        label={<>Company Name <span className="text-red-500">*</span></>}
        placeholder="Enter"
        value={formData.companyName}
        onChange={(e) => {
          handleChange({ target: { name: e.target.name, value: e.target.value } });
          handleValidation(e.target.name, e.target.value);
        }}
      />
      </div>

      
      <div className="col-span-2">
      <Inputs
        variant="multiselect"
        name="companyOwner"
        label={<>Company Owner(s)</>}
        placeholder="Choose"
        
        value={formData.companyOwner || []}
        onChange={(selectedValues: string[]) => {
          handleChange({ target: { name: "companyOwner", value: selectedValues } });
          handleValidation("companyOwner", selectedValues);
        }}
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

      
      <Inputs
        variant="select"
        name="industry"
        label={<>Industry <span className="text-red-500">*</span></>}
        placeholder="Choose"
        options={[
          { label: "Technology", value: "Technology" },
          { label: "Finance", value: "Finance" },
          { label: "Healthcare", value: "Healthcare" },
          { label: "Manufacturing", value: "Manufacturing" },
          { label: "Education", value: "Education" },
        ]}
        value={formData.industry}
        onChange={(e) => {
          handleChange({ target: { name: e.target.name, value: e.target.value } });
          handleValidation(e.target.name, e.target.value);
        }}
      />

      
      <Inputs
        variant="select"
        name="type"
        label={<>Type <span className="text-red-500">*</span></>}
        placeholder="Choose"
        options={[
          { label: "Private", value: "Private" },
          { label: "Public", value: "Public" },
          { label: "Government", value: "Government" },
          { label: "Non-profit", value: "Non-profit" },
        ]}
        value={formData.type}
        onChange={(e) => {
          handleChange({ target: { name: e.target.name, value: e.target.value } });
          handleValidation(e.target.name, e.target.value);
        }}
      />

      
      <Inputs
        name="city"
        label="City"
        placeholder="Enter"
        value={formData.city}
        onChange={(e) =>
          handleChange({ target: { name: e.target.name, value: e.target.value } })
        }
      />

      
      <Inputs
        name="country"
        label="Country/Region"
        placeholder="Enter"
        value={formData.country}
        onChange={(e) =>
          handleChange({ target: { name: e.target.name, value: e.target.value } })
        }
      />

      
      <Inputs
        name="employees"
        label="No of Employees"
        placeholder="Enter"
        value={formData.employees}
        onChange={(e) =>
          handleChange({ target: { name: e.target.name, value: e.target.value } })
        }
      />

      
      <Inputs
        name="revenue"
        label="Annual Revenue"
        placeholder="Enter"
        value={formData.revenue}
        onChange={(e) =>
          handleChange({ target: { name: e.target.name, value: e.target.value } })
        }
      />

      
      <div className="col-span-2">
        <PhoneInputField
          value={formData.phone}
          onChange={(val) => handleChange({ target: { name: "phone", value: val } })}
          label="Phone Number"
          required
          error={errors.phone}
        />
      </div>
    </form>
  );
}
