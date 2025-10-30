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
  employees: string;
  revenue: string;
  phone: string;
  createdDate: string;
  website?: string;
  logoUrl?: string;
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
    companyOwner: [], // now array
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

  const handleChange = (e: { target: { name: string; value: string | string[] } }) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    onCreate(formData);
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
