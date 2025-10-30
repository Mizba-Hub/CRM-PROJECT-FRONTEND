"use client";

import React, { useEffect, useState } from "react";
import { Inputs } from "@/components/ui/Inputs";
import ModalWrapper from "@/components/modal/ModalWrapper";
import { notify } from "@/components/ui/toast/Notify";

interface DealData {
  name: string;
  stage: string;
  closeDate: string;
  owner: string[];
  amount: string;
  priority: string;
  createdDate: string;
}

interface CreateDealProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deal: DealData) => void;
  mode?: "create" | "edit";
  initialData?: DealData;
}

const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getCurrentDate = (): string => {
  return new Date().toISOString().split("T")[0];
};

const CreateDeal: React.FC<CreateDealProps> = ({
  isOpen,
  onClose,
  onSave,
  mode = "create",
  initialData,
}) => {
  const [formData, setFormData] = useState<DealData>({
    name: "",
    stage: "",
    closeDate: "",
    owner: [],
    amount: "",
    priority: "",
    createdDate: "",
  });

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

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setFormData(initialData);
      } else if (mode === "create") {
        const currentDate = getCurrentDate();
        setFormData({
          name: "",
          stage: "Presentation Scheduled",
          closeDate: "",
          owner: [],
          amount: "",
          priority: "Medium",
          createdDate: currentDate,
        });
      }
    }
  }, [isOpen, mode, initialData]);

  const handleChange = (field: keyof DealData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (): boolean => {
    if (!formData.name.trim() || !formData.stage.trim()) {
      notify("Please fill all required fields (Name & Stage).", "error");
      return false;
    }

    const dealDataToSave = { ...formData };
    if (mode === "create" && !dealDataToSave.createdDate) {
      dealDataToSave.createdDate = getCurrentDate();
    }

    if (dealDataToSave.amount && !dealDataToSave.amount.startsWith("$")) {
      dealDataToSave.amount = `$${dealDataToSave.amount}`;
    }

    console.log("Saving deal with createdDate:", dealDataToSave.createdDate);
    onSave(dealDataToSave);
    notify(
      mode === "edit"
        ? "Deal updated successfully!"
        : "Deal created successfully!",
      "success"
    );
    return true;
  };

  const RequiredLabel: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => (
    <span className="flex items-center gap-1">
      {children}
      <span className="text-red-500">*</span>
    </span>
  );

  return (
    <ModalWrapper
      isOpen={isOpen}
      title={mode === "edit" ? "Edit Deal" : "Create New Deal"}
      onClose={onClose}
      onSave={handleSave}
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <RequiredLabel>Deal Name</RequiredLabel>
          </label>
          <Inputs
            variant="input"
            placeholder="Enter deal name"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChange("name", e.target.value)
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <RequiredLabel>Deal Stage</RequiredLabel>
          </label>
          <Inputs
            variant="select"
            placeholder="Select deal stage"
            options={stageOptions}
            value={formData.stage}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              handleChange("stage", e.target.value)
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Owner(s)
          </label>
          <Inputs
            variant="multiselect"
            placeholder="Select owner(s)"
            options={ownerOptions}
            value={formData.owner}
            onChange={(values: string[]) => handleChange("owner", values)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Close Date
            </label>
            <Inputs
              variant="input"
              type="date"
              value={formData.closeDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange("closeDate", e.target.value)
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <Inputs
              variant="select"
              placeholder="Select priority"
              options={priorityOptions}
              value={formData.priority}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                handleChange("priority", e.target.value)
              }
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <Inputs
            variant="input"
            placeholder="$0.00"
            value={formData.amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChange("amount", e.target.value)
            }
          />
        </div>
      </div>
    </ModalWrapper>
  );
};

export default CreateDeal;
