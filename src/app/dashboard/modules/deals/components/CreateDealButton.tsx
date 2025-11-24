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
  associatedLead?: string;
  ownerIds?: number[]; 
}

interface CreateDealProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deal: DealData) => void;
  mode?: "create" | "edit";
  initialData?: DealData;

  associatedLead?: string;
  users?: { id: number; name: string }[];
  leads?: {
    id: number;
    firstName: string;
    lastName: string;
    status?: string;
    leadStatus?: string;
  }[];
}

const getCurrentDate = () => new Date().toISOString().split("T")[0];

const CreateDeal: React.FC<CreateDealProps> = ({
  isOpen,
  onClose,
  onSave,
  mode = "create",
  initialData,
  associatedLead = "",
  users = [],
  leads = [],
}) => {
  const [formData, setFormData] = useState<DealData>({
    name: "",
    stage: "",
    closeDate: "",
    owner: [],
    amount: "",
    priority: "",
    createdDate: getCurrentDate(),
    associatedLead: associatedLead || "",
  });

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && initialData) {
  setFormData({
    ...initialData,

    associatedLead: String(initialData.associatedLead ?? ""),

    
    owner: initialData.ownerIds
      ? initialData.ownerIds.map((id: number) => String(id))
      : [],

   
    amount: String(initialData.amount ?? ""),
  });
} else {
  setFormData({
    name: "",
    stage: "",
    closeDate: "",
    owner: [],
    amount: "",
    priority: "",
    createdDate: getCurrentDate(),
    associatedLead: associatedLead || "",
  });
}

  }, [isOpen, mode, initialData, associatedLead]);

  const handleChange = (field: keyof DealData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };


  const qualifiedLeads = leads.filter(
    (lead) =>
      (lead.status || lead.leadStatus || "").toUpperCase() === "QUALIFIED"
  );

  const leadOptions = qualifiedLeads.map((lead) => ({
    label:` ${lead.firstName} ${lead.lastName}`,
    value: String(lead.id),
  }));

  const ownerOptions = users.map((user) => ({
    label: user.name,
    value: String(user.id),
  }));

  const handleAmountChange = (e: any) => {
    const val = e.target.value;
    if (/^\d*$/.test(val)) {
      handleChange("amount", val);
    }
  };

  const validate = () => {
    if (!formData.associatedLead) {
      notify("Associated Lead is required", "error");
      return false;
    }

    if (
      !formData.name ||
      !formData.stage ||
      !formData.owner.length ||
      !formData.amount ||
      !formData.closeDate ||
      !formData.priority
    ) {
      notify("Please fill all required fields", "error");
      return false;
    }

    onSave({
      ...formData,
      associatedLead: String(formData.associatedLead),
    });

    return true;
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      title={mode === "edit" ? "Edit Deal" : "Create Deal"}
      onClose={onClose}
      onSave={validate}
    >
      <div className="flex flex-col gap-6">
        
       
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Associated Lead *
          </label>

          {leadOptions.length > 0 ? (
            <Inputs
              variant="select"
              placeholder="Choose"
              options={leadOptions}
              value={formData.associatedLead}
              onChange={(e) => handleChange("associatedLead", e.target.value)}
            />
          ) : (
            <div className="text-sm text-gray-500 p-2 border rounded">
              No qualified leads available.
            </div>
          )}
        </div>

     
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deal Name *
          </label>
          <Inputs
            variant="input"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Enter"
          />
        </div>

       
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deal Stage *
          </label>
          <Inputs
            variant="select"
            placeholder="Choose"
            options={[
              "Presentation Scheduled",
              "Qualified to Buy",
              "Contract Sent",
              "Closed Won",
              "Appointment Scheduled",
              "Decision Maker Bought In",
              "Closed Lost",
              "Negotiation",
            ].map((s) => ({ label: s, value: s }))}
            value={formData.stage}
            onChange={(e) => handleChange("stage", e.target.value)}
          />
        </div>

       
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deal Owner *
          </label>

          {ownerOptions.length > 0 ? (
            <Inputs
              variant="multiselect"
              options={ownerOptions}
              value={formData.owner}
              onChange={(values: string[]) => handleChange("owner", values)}
              placeholder="Choose"
            />
          ) : (
            <div className="text-sm text-gray-500 p-2 border rounded">
              No users available.
            </div>
          )}
        </div>

   
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount *
          </label>
          <Inputs
            variant="input"
            value={formData.amount}
            onChange={handleAmountChange}
            placeholder="Enter"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Close Date *
            </label>
            <Inputs
              variant="date"
              placeholder="Choose"
              value={formData.closeDate}
              onChange={(value) => handleChange("closeDate", value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority *
            </label>
            <Inputs
              variant="select"
              placeholder="Choose"
              options={["Low", "Medium", "High", "Critical"].map((p) => ({
                label: p,
                value: p,
              }))}
              value={formData.priority}
              onChange={(e) => handleChange("priority", e.target.value)}
            />
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default CreateDeal;