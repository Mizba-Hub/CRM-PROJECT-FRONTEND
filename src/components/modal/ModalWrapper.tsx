"use client";

import React from "react";
import Button from "@/components/ui/Button"; 
import { notify } from "@/components/ui/toast/Notify";

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function ModalWrapper({
  isOpen,
  onClose,
  onSave,
  title,
  children,
}: ModalWrapperProps) {
  if (!isOpen) return null;

  const handleCancel = () => {
    notify("Action cancelled", "info"); // 🔔 show info notification
    onClose();
  };

  const handleSave = () => {
    notify("Saved successfully!", "success"); // 🔔 show success notification
    if (onSave) onSave();
  };

  return (
    <div
      className="fixed inset-0 flex justify-end z-50"
      style={{
        backdropFilter: "blur(4px) brightness(0.8)",
        backgroundColor: "rgba(153, 154, 156, 0.3)", 
      }}
    >
      <div className="bg-white h-full w-full max-w-md flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center p-3 border-b border-gray-200">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>

        {/* Footer */}
        <div className="flex justify-center gap-3 p-4">
          <Button
            label="Cancel"
            variant="gray-outline"
            onClick={handleCancel}
            fullWidth={true}
          />
          <Button
            label="Save"
            variant="primary"
            fullWidth={true}
            onClick={handleSave}
          />
        </div>
      </div>
    </div>
  );
}
