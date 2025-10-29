"use client";

import React, { useState, useEffect } from "react";
import ModalWrapper from "@/components/modal/ModalWrapper";
import { Inputs } from "@/components/ui/Inputs";
import { notify } from "@/components/ui/toast/Notify";

interface TicketCreateButtonProps {
  onCreateTicket?: (
    ticket: Omit<Ticket, "id" | "createdDate">
  ) => boolean | Promise<boolean>;
  isOpen: boolean;
  onClose: () => void;
  editData?: Ticket | null;
}

export type Ticket = {
  id: number;
  name: string;
  companyName: string;
  description: string;
  status: string;
  source: string;
  priority: string;
  owner: string | string[];
  createdDate: string;
};

export default function TicketCreateButton({
  onCreateTicket,
  isOpen,
  onClose,
  editData,
}: TicketCreateButtonProps) {
  const [formData, setFormData] = useState<Omit<Ticket, "id" | "createdDate">>({
    name: "",
    companyName: "",
    description: "",
    status: "",
    source: "",
    priority: "",
    owner: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editData) {
      const { id, createdDate, ...rest } = editData;
      setFormData({
        ...rest,
        owner: Array.isArray(rest.owner)
          ? rest.owner
          : [rest.owner].filter(Boolean),
      });
      setErrors({});
    } else {
      setFormData({
        name: "",
        companyName: "",
        description: "",
        status: "",
        source: "",
        priority: "",
        owner: [],
      });
      setErrors({});
    }
  }, [editData, isOpen]);

  const statusOptions = [
    { label: "New", value: "New" },
    { label: "Closed", value: "Closed" },
    { label: "Waiting on us", value: "Waiting on us" },
    { label: "Waiting on contact", value: "Waiting on contact" },
  ];

  const sourceOptions = [
    { label: "Email", value: "Email" },
    { label: "Phone", value: "Phone" },
    { label: "Web", value: "Web" },
    { label: "Chat", value: "Chat" },
  ];

  const priorityOptions = [
    { label: "Low", value: "Low" },
    { label: "Medium", value: "Medium" },
    { label: "High", value: "High" },
    { label: "Critical", value: "Critical" },
  ];

  const ownerOptions = [
    { label: "Maria johnson", value: "Maria johnson" },
    { label: "Shifa", value: "Shifa" },
    { label: "Mizba", value: "Mizba" },
    { label: "Sabira", value: "Sabira" },
    { label: "Shaima", value: "Shaima" },
    { label: "Greeshma", value: "Greeshma" },
  ];

  const companyOptions = [
    { label: "Client Edge", value: "Client Edge" },
    { label: "Relatia", value: "Relatia" },
    { label: "TrustSphere", value: "TrustSphere" },
    { label: "SalesTrail", value: "SalesTrail" },
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOwnerChange = (owners: string[]) => {
    setFormData((prev) => ({ ...prev, owner: owners }));
  };

  const validate = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Ticket Name is required";
    if (!formData.companyName)
      newErrors.companyName = "Company Name is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.status) newErrors.status = "Ticket Status is required";
    if (!formData.source) newErrors.source = "Source is required";
    if (!formData.priority) newErrors.priority = "Priority is required";
    if (!formData.owner || formData.owner.length === 0)
      newErrors.owner = "Ticket Owner is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      notify("⚠️ Please fill all required fields", "error");
      return false;
    }

    const result = onCreateTicket?.(formData);

    if (result instanceof Promise) {
      try {
        const success = await result;
        if (success) {
          if (editData) notify("✏️ Ticket updated successfully", "success");
          else notify("✅ Ticket created successfully", "success");

          setTimeout(() => onClose(), 150);
        } else {
          notify("❌ Failed to save ticket", "error");
        }
        return success;
      } catch (error) {
        notify("❌ Failed to save ticket", "error");
        return false;
      }
    } else {
      const success = result ?? false;
      if (success) {
        if (editData) notify("✏️ Ticket updated successfully", "success");
        else notify("✅ Ticket created successfully", "success");

        setTimeout(() => onClose(), 150);
      } else {
        notify("❌ Failed to save ticket", "error");
      }
      return success;
    }
  };

  const handleClose = () => {
    onClose();
    setErrors({});
  };

  const handleSave = () => {
    validate();

    return true;
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title={editData ? "Edit Ticket" : "Create Ticket"}
      onSave={handleSave}
    >
      <div className="space-y-4">
        {/* Ticket Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ticket Name <span className="text-red-500">*</span>
          </label>
          <Inputs
            variant="input"
            name="name"
            placeholder="Enter"
            value={formData.name}
            onChange={handleChange}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name <span className="text-red-500">*</span>
          </label>
          <Inputs
            variant="select"
            name="companyName"
            placeholder="Choose"
            value={formData.companyName}
            onChange={handleChange}
            options={companyOptions}
            className={errors.companyName ? "border-red-500" : ""}
          />
          {errors.companyName && (
            <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <Inputs
            variant="textarea"
            name="description"
            placeholder="Enter"
            value={formData.description}
            onChange={handleChange}
            className={`h-28 resize-none ${
              errors.description ? "border-red-500" : ""
            }`}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ticket Status <span className="text-red-500">*</span>
            </label>
            <Inputs
              variant="select"
              name="status"
              placeholder="Choose"
              value={formData.status}
              onChange={handleChange}
              options={statusOptions}
              className={errors.status ? "border-red-500" : ""}
            />
            {errors.status && (
              <p className="text-red-500 text-sm mt-1">{errors.status}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source <span className="text-red-500">*</span>
            </label>
            <Inputs
              variant="select"
              name="source"
              placeholder="Choose"
              value={formData.source}
              onChange={handleChange}
              options={sourceOptions}
              className={errors.source ? "border-red-500" : ""}
            />
            {errors.source && (
              <p className="text-red-500 text-sm mt-1">{errors.source}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority <span className="text-red-500">*</span>
            </label>
            <Inputs
              variant="select"
              name="priority"
              placeholder="Choose"
              value={formData.priority}
              onChange={handleChange}
              options={priorityOptions}
              className={errors.priority ? "border-red-500" : ""}
            />
            {errors.priority && (
              <p className="text-red-500 text-sm mt-1">{errors.priority}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ticket Owner <span className="text-red-500">*</span>
            </label>
            <Inputs
              variant="multiselect"
              name="owner"
              placeholder="Choose owners"
              value={Array.isArray(formData.owner) ? formData.owner : []}
              onChange={handleOwnerChange}
              options={ownerOptions}
              className={errors.owner ? "border-red-500" : ""}
            />
            {errors.owner && (
              <p className="text-red-500 text-sm mt-1">{errors.owner}</p>
            )}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}
