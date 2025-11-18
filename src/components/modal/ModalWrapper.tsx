"use client";

import React, { useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";

interface ModalWrapperProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;

  onSave?: () => boolean | Promise<boolean>;

  children: React.ReactNode;
}

export default function ModalWrapper({
  isOpen,
  title,
  onClose,
  onSave,
  children,
}: ModalWrapperProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const handleSaveWithValidation = async () => {
    if (onSave) {
      const valid = await onSave();

      if (!valid) return;
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 flex justify-end z-50"
      style={{
        backdropFilter: "blur(4px) brightness(0.8)",
        backgroundColor: "rgba(153, 154, 156, 0.3)",
      }}
    >
      <div className="bg-white h-full w-full max-w-md flex flex-col text-black">
        <div className="flex justify-between items-center p-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 focus:outline-none"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">{children}</div>

        <div className="flex justify-center gap-3 p-4">
          <Button
            label="Cancel"
            variant="gray-outline"
            fullWidth={true}
            onClick={onClose}
          />
          <Button
            label="Save"
            variant="primary"
            fullWidth={true}
            onClick={handleSaveWithValidation}
          />
        </div>
      </div>
    </div>
  );
}
