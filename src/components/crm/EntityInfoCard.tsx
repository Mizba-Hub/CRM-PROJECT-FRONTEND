"use client";
import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PencilSquareIcon } from "@heroicons/react/24/solid";
import { Inputs } from "@/components/ui/Inputs";

interface InfoField {
  label: string;
  value: string | string[];
  isEditable?: boolean;
  options?: string[];
  onChange?: (value: string | string[]) => void;
  variant?: "select" | "multiselect";
}

interface Props {
  title: string;
  fields: InfoField[];
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

const EntityInfoCard: React.FC<Props> = ({
  title,
  fields,
  onEdit,
  onSave,
  onCancel,
  isEditing = false,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white px-2">
      <div
        className="flex justify-between items-center px-1 m-2 cursor-pointer "
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
                  field.variant === "multiselect" ? (
                    <Inputs
                      variant="multiselect"
                      label={field.label}
                      value={Array.isArray(field.value) ? field.value : []}
                      onChange={(values: string[]) => field.onChange?.(values)}
                      options={field.options.map((opt) => ({
                        label: opt,
                        value: opt,
                      }))}
                    />
                  ) : (
                    <Inputs
                      variant="select"
                      label={field.label}
                      value={
                        Array.isArray(field.value)
                          ? field.value.join(", ")
                          : field.value
                      }
                      onChange={(e: any) => field.onChange?.(e.target.value)}
                      options={field.options.map((opt) => ({
                        label: opt,
                        value: opt,
                      }))}
                    />
                  )
                ) : (
                  <Inputs
                    variant="textarea"
                    label={field.label}
                    value={field.value}
                    onChange={(e) => field.onChange?.(e.target.value)}
                    rows={
                      field.label.toLowerCase().includes("description") ? 3 : 1
                    }
                  />
                )
              ) : (
                <div>
                  <p className="text-xs text-gray-500 mb-1">{field.label}</p>
                  <p className="text-sm text-black">
                    {Array.isArray(field.value)
                      ? field.value.join(", ")
                      : field.value}
                  </p>
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
