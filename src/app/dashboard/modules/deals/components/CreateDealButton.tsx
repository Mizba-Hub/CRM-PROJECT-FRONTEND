"use client";

import React, { useEffect, useState } from "react";
import { Inputs } from "@/components/ui/Inputs";
import ModalWrapper from "@/components/modal/ModalWrapper";
import { notify } from "@/components/ui/toast/Notify";
import { useLocalStorage } from "@/app/lib/useLocalStorage"; 

interface DealData {
  name: string;
  stage: string;
  closeDate: string;
  owner: string[];
  amount: string;
  priority: string;
  createdDate: string;
  associatedLead?: string;
}

interface CreateDealProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deal: DealData) => void;
  mode?: "create" | "edit";
  initialData?: DealData;
  associatedLead?: string;
}

const getCurrentDate = (): string => new Date().toISOString().split("T")[0];

const CreateDeal: React.FC<CreateDealProps> = ({
  isOpen,
  onClose,
  onSave,
  mode = "create",
  initialData,
  associatedLead = "",
}) => {
  const { getItem } = useLocalStorage(); // ✅ use the custom hook

  const [formData, setFormData] = useState<DealData>({
    name: "",
    stage: "",
    closeDate: "",
    owner: [],
    amount: "",
    priority: "",
    createdDate: "",
    associatedLead: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [qualifiedLeads, setQualifiedLeads] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    const resetForm = () => {
      setFormData({
        name: "",
        stage: "",
        closeDate: "",
        owner: [],
        amount: "",
        priority: "",
        createdDate: "",
        associatedLead: "",
      });
      setErrors({});
    };

    if (!isOpen) {
      resetForm();
      return;
    }

    // ✅ Use the custom hook here instead of raw localStorage
    const leadsData = getItem<any[]>("leads", []);
    const qualified = leadsData
      .filter((lead) => lead.status === "Qualified" && !lead.converted)
      .map((lead) => ({
        label: `${lead.firstName} ${lead.lastName}`,
        value: `${lead.firstName} ${lead.lastName}`,
      }));

    if (mode === "edit" && initialData?.associatedLead) {
      const exists = qualified.some(
        (q) => q.value === initialData.associatedLead
      );
      if (!exists) {
        qualified.unshift({
          label: initialData.associatedLead,
          value: initialData.associatedLead,
        });
      }
    }

    setQualifiedLeads(qualified);

    if (mode === "edit" && initialData) {
      setFormData(initialData);
    } else {
      const today = getCurrentDate();
      setFormData({
        name: "",
        stage: "",
        closeDate: "",
        owner: [],
        amount: "",
        priority: "",
        createdDate: today,
        associatedLead:
          typeof window !== "undefined" &&
          associatedLead &&
          window.location.search.includes("openModal=true")
            ? associatedLead
            : "",
      });
    }

    setErrors({});
  }, [isOpen, mode, initialData, associatedLead, getItem]);

  const handleChange = (field: keyof DealData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const stageOptions = [
    { label: "Presentation Scheduled", value: "Presentation Scheduled" },
    { label: "Qualified to Buy", value: "Qualified to Buy" },
    { label: "Contract Sent", value: "Contract Sent" },
    { label: "Closed Won", value: "Closed Won" },
    { label: "Appointment Scheduled", value: "Appointment Scheduled" },
    { label: "Decision Maker Bought In", value: "Decision Maker Bought In" },
    { label: "Closed Lost", value: "Closed Lost" },
  ];

  const ownerOptions = [
    { label: "Shaima", value: "Shaima" },
    { label: "Mizba", value: "Mizba" },
    { label: "Shifa", value: "Shifa" },
    { label: "Sabira", value: "Sabira" },
    { label: "Greesma", value: "Greesma" },
    { label: "Maria Johnson", value: "Maria Johnson" },
  ];

  const priorityOptions = [
    { label: "Low", value: "Low" },
    { label: "Medium", value: "Medium" },
    { label: "High", value: "High" },
    { label: "Critical", value: "Critical" },
  ];

  const RequiredLabel: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => (
    <span className="flex items-center gap-1">
      {children}
      <span className="text-red-500">*</span>
    </span>
  );

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Deal Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Deal Name must be at least 2 characters long";
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Deal Name must be less than 100 characters";
    }
    if (!formData.stage.trim()) {
      newErrors.stage = "Please choose a deal stage";
    }
    if (!formData.owner.length) {
      newErrors.owner = "Please select at least one deal owner";
    }
    if (!formData.amount.trim()) {
      newErrors.amount = "Please enter a deal amount";
    } else {
      const cleanAmount = formData.amount.replace(/[$,]/g, "").trim();
      const amountValue = parseFloat(cleanAmount);
      if (isNaN(amountValue)) {
        newErrors.amount = "Amount must be a valid number";
      } else if (amountValue <= 0) {
        newErrors.amount = "Amount must be greater than 0";
      } else if (amountValue > 1000000000) {
        newErrors.amount = "Amount must be less than 1 billion";
      } else if (!/^\d*\.?\d{0,2}$/.test(cleanAmount)) {
        newErrors.amount = "Amount can have up to 2 decimal places";
      }
    }
    if (!formData.closeDate.trim()) {
      newErrors.closeDate = "Please select a close date";
    } else {
      const closeDate = new Date(formData.closeDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (closeDate < today) {
        newErrors.closeDate = "Close date cannot be in the past";
      }
    }
    if (!formData.priority.trim()) {
      newErrors.priority = "Please select a priority";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      notify("⚠ Please correct the highlighted fields.", "error");
      return false;
    }

    const dealDataToSave = { ...formData };
    if (dealDataToSave.amount) {
      const cleanAmount = dealDataToSave.amount.replace(/[$,]/g, "").trim();
      const amountValue = parseFloat(cleanAmount);
      dealDataToSave.amount = `$${amountValue.toFixed(2)}`;
    }
    if (mode === "create" && !dealDataToSave.createdDate) {
      dealDataToSave.createdDate = getCurrentDate();
    }

    onSave(dealDataToSave);
    notify(
      mode === "edit"
        ? "Deal updated successfully!"
        : "Deal created successfully!",
      "success"
    );

    try {
      if (formData.associatedLead) {
        const urlParams = new URLSearchParams(
          typeof window !== "undefined" ? window.location.search : ""
        );
        const leadId = urlParams.get("leadId");

        if (leadId) {
          const leads = JSON.parse(
            localStorage.getItem("leads") || "[]"
          );
          const updatedLeads = leads.map((l: any) =>
            String(l.id) === String(leadId)
              ? { ...l, status: "Converted", converted: true }
              : l
          );
          localStorage.setItem("leads", JSON.stringify(updatedLeads));

          const convertedLeads = JSON.parse(
            localStorage.getItem("convertedLeads") || "[]"
          );
          if (!convertedLeads.includes(Number(leadId))) {
            convertedLeads.push(Number(leadId));
            localStorage.setItem(
              "convertedLeads",
              JSON.stringify(convertedLeads)
            );
          }

          localStorage.removeItem("pendingConversionId");
        }
      }
    } catch (err) {
      console.error("Error updating conversion status:", err);
    }

    setFormData({
      name: "",
      stage: "",
      closeDate: "",
      owner: [],
      amount: "",
      priority: "",
      createdDate: getCurrentDate(),
      associatedLead: "",
    });
    setErrors({});
    return true;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^[0-9]*\.?[0-9]{0,2}$/.test(value)) {
      handleChange("amount", value);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      title={mode === "edit" ? "Edit Deal" : "Create Deal"}
      onClose={() => {
        onClose();
        localStorage.removeItem("pendingConversionId"); 
        setFormData({
          name: "",
          stage: "",
          closeDate: "",
          owner: [],
          amount: "",
          priority: "",
          createdDate: "",
          associatedLead: "",
        });
        setErrors({});
      }}
      onSave={validate}
    >
      <div className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Associated Lead
          </label>
          <Inputs
            variant="select"
            placeholder="Choose"
            options={qualifiedLeads}
            value={formData.associatedLead || ""}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              handleChange("associatedLead", e.target.value)
            }
            className="border-gray-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <RequiredLabel>Deal Name</RequiredLabel>
          </label>
          <Inputs
            variant="input"
            placeholder="Enter"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChange("name", e.target.value)
            }
            className={`${
              errors.name
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-2 focus:ring-blue-500"
            }`}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <RequiredLabel>Deal Stage</RequiredLabel>
          </label>
          <Inputs
            variant="select"
            placeholder="Choose"
            options={stageOptions}
            value={formData.stage}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              handleChange("stage", e.target.value)
            }
            className={`${
              errors.stage
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-2 focus:ring-blue-500"
            }`}
          />
          {errors.stage && (
            <p className="text-red-500 text-sm mt-1">{errors.stage}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <RequiredLabel>Deal Owner</RequiredLabel>
          </label>
          <Inputs
            variant="multiselect"
            placeholder="Choose"
            options={ownerOptions}
            value={formData.owner}
            onChange={(values: string[]) => handleChange("owner", values)}
            className={`${
              errors.owner
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-2 focus:ring-blue-500"
            }`}
          />
          {errors.owner && (
            <p className="text-red-500 text-sm mt-1">{errors.owner}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <RequiredLabel>Amount</RequiredLabel>
          </label>
          <Inputs
            variant="input"
            placeholder="Enter"
            value={formData.amount}
            onChange={handleAmountChange}
            className={`${
              errors.amount
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-2 focus:ring-blue-500"
            }`}
          />
          {errors.amount && (
            <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <RequiredLabel>Close Date</RequiredLabel>
            </label>
            <Inputs
              variant="input"
              type="date"
              value={formData.closeDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange("closeDate", e.target.value)
              }
              min={getCurrentDate()}
              className={`${
                errors.closeDate
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-2 focus:ring-blue-500"
              }`}
            />
            {errors.closeDate && (
              <p className="text-red-500 text-sm mt-1">{errors.closeDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <RequiredLabel>Priority</RequiredLabel>
            </label>
            <Inputs
              variant="select"
              placeholder="Choose"
              options={priorityOptions}
              value={formData.priority}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                handleChange("priority", e.target.value)
              }
              className={`${
                errors.priority
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-2 focus:ring-blue-500"
              }`}
            />
            {errors.priority && (
              <p className="text-red-500 text-sm mt-1">{errors.priority}</p>
            )}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default CreateDeal;
