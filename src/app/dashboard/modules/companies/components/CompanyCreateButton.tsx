"use client";

import React, { useEffect, useState } from "react";
import ModalWrapper from "@/components/modal/ModalWrapper";
import { notify } from "@/components/ui/toast/Notify";
import FormModal, { CompanyFormData } from "./CompanyFormModal";

export interface Company {
  id: number;
  domain: string;
  companyName: string;
  companyOwner: string[];
  industry: string;
  type: string;
  city: string;
  country: string;
  employees: number;
  revenue: number;
  phone: string; 
  createdDate: string;
  website?: string;
  logoUrl?: string;
  leadStatus?: string;
}

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: Omit<Company, "id" | "createdDate">) => void;
  editingCompany?: Company | null;
}

export default function CreateCompanyModal({
  isOpen,
  onClose,
  onCreate,
  editingCompany,
}: CreateCompanyModalProps) {
  const [formData, setFormData] = useState<CompanyFormData>({
    domain: "",
    companyName: "",
    companyOwner: [],
    industry: "",
    type: "",
    city: "",
    country: "",
    employees: "",
    revenue: "",
    phone: "",
  });

  useEffect(() => {
    if (isOpen && editingCompany) {
      const { id, createdDate, ...rest } = editingCompany;
      setFormData(rest);
    } else if (isOpen) {
      setFormData({
        domain: "",
        companyName: "",
        companyOwner: [],
        industry: "",
        type: "",
        city: "",
        country: "",
        employees: "",
        revenue: "",
        phone: "",
      });
    }
  }, [isOpen, editingCompany]);
  const handleChange = (e: {
    target: { name: string; value: string | string[] };
  }) => {
    const { name, value } = e.target;
    let newValue: string | number | string[] = value;

    
    if (name === "employees" || name === "revenue") {
      
      const digitsOnly = (value as string).replace(/\D/g, "");
      newValue = digitsOnly === "" ? "" : parseInt(digitsOnly, 10);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSubmit = (): boolean => {
    if (
      !formData.domain ||
      !formData.companyName ||
      !formData.industry ||
      !formData.type ||
      !formData.phone
    ) {
      notify("Please fill all required fields!", "error");
      return false;
    }

    
    const submissionData = {
      ...formData,
      employees:
        typeof formData.employees === "number" ? formData.employees : 0,
      revenue: typeof formData.revenue === "number" ? formData.revenue : 0,
    };

    onCreate(submissionData as Omit<Company, "id" | "createdDate">);
    return true;
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={editingCompany ? "Edit Company" : "Create Company"}
      onSave={handleSubmit}
    >
      <FormModal formData={formData} handleChange={handleChange} />
    </ModalWrapper>
  );
}
