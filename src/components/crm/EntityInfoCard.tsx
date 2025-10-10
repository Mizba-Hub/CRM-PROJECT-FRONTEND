"use client";
import React, { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon, PencilSquareIcon } from "@heroicons/react/24/solid";

interface InfoField {
  label: string;
  value: string;
}

interface Props {
  title: string;
  fields: InfoField[];
  onEdit?: () => void;
}

const EntityInfoCard: React.FC<Props> = ({ title, fields, onEdit }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white">
     
      <div
        className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDownIcon className="w-4 h-4 text-indigo-700" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-indigo-700" />
          )}
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        </div>

        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="hover:opacity-80"
          >
            <PencilSquareIcon className="w-4 h-4 text-indigo-700" />
          </button>
        )}
      </div>

      
      {isOpen && (
        <div className="p-3 border-t space-y-3">
          {fields.map((field, idx) => (
            <div key={idx}>
              <p className="text-xs text-gray-500">{field.label}</p>
              <p className="text-sm text-black">{field.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EntityInfoCard;





