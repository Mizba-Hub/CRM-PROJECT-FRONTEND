"use client";
import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PencilSquareIcon } from "@heroicons/react/24/solid";
import { Inputs } from "@/components/ui/Inputs";

interface InfoField {
  label: string;
  value: string;
  isEditable?: boolean;
  options?: string[];
  onChange?: (value: string) => void;
}

interface Props {
  title: string;
  fields: InfoField[];
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

const EntityInfoCard: React.FC<Props> = ({ title, fields, onEdit, onSave, onCancel, isEditing = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white">
     
      <div
        className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-50"
        onClick={() => !isEditing && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-indigo-700" />
          ) : (
            <ChevronRight className="w-4 h-4 text-indigo-700" />
          )}
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        </div>

        {isEditing ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSave?.();
              }}
              className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
            >
              Save
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCancel?.();
              }}
              className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="hover:opacity-80 p-1"
            >
              <PencilSquareIcon className="w-4 h-4 text-indigo-700" />
            </button>
          )
        )}
      </div>

      
      {isOpen && (
        <div className="p-3 space-y-3">
          {fields.map((field, idx) => (
            <div key={idx}>
              {isEditing && field.isEditable !== false ? (
                field.options ? (
                  <Inputs
                    variant="select"
                    label={field.label}
                    value={field.value}
                    onChange={(e) => field.onChange?.(e.target.value)}
                    options={field.options.map(opt => ({ label: opt, value: opt }))}
                  />
                ) : (
                  <Inputs
                    variant="textarea"
                    label={field.label}
                    value={field.value}
                    onChange={(e) => field.onChange?.(e.target.value)}
                    rows={field.label.toLowerCase().includes("description") ? 3 : 1}
                  />
                )
              ) : (
                <div>
                  <p className="text-xs text-gray-500 mb-1">{field.label}</p>
                  <p className="text-sm text-black">{field.value}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EntityInfoCard;





