"use client";

import React from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";

interface ActionButtonsProps<T extends { id?: number | string }> {
  item: T;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onSave?: () => void;
  onCancel?: () => void;
  isEditing?: boolean;
  className?: string;
}

function ActionButtons<T extends { id?: number | string }>({
  item,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  isEditing = false,
  className = "",
}: ActionButtonsProps<T>) {
  if (isEditing) {
    return (
      <div className={`flex items-center justify-center gap-1 ${className}`}>
        <button
          onClick={onSave}
          className="p-1.5 rounded bg-green-500 hover:bg-green-600 text-white transition-colors"
          title="Save"
        >
          <Check className="w-4 h-4" />
        </button>

        <button
          onClick={onCancel}
          className="p-1.5 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 transition-colors"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center gap-2 px-2 py-2 ${className}`}
    >
      
      <button
        onClick={() => onEdit(item)}
        className="p-1.5 rounded hover:bg-indigo-100 text-indigo-600 transition-colors"
        title="Edit"
      >
        <Pencil className="w-4 h-4" strokeWidth={2} />
      </button>

      <button
        onClick={() => onDelete(item)}
        className="p-1.5 rounded hover:bg-red-100 text-red-500 transition-colors"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  );
}

export default ActionButtons;

