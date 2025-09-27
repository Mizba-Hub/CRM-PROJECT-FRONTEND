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
      <div className={` flex items-center justify-center gap-1 ${className}`}>
        <button
          onClick={onSave}
          className="p-1 rounded bg-green-500 hover:bg-green-600 text-white"
          title="Save"
        >
          <Check className="w-4 h-4" />
        </button>

        <button
          onClick={onCancel}
          className="p-1 rounded bg-gray-400 hover:bg-gray-500 text-white"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex justify-center items-center gap-1 ${className}`}>
      <button
        onClick={() => onEdit(item)}
        className="p-1 rounded hover:bg-gray-200"
        title="Edit"
      >
        <Pencil className="w-4 h-4 text-blue-600" />
      </button>
      <button
        onClick={() => onDelete(item)}
        className="p-1 rounded hover:bg-gray-200"
        title="Delete"
      >
        <Trash2 className="w-4 h-4 text-red-600" />
      </button>
    </div>
  );
}

export default ActionButtons;
