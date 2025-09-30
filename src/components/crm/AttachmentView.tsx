"use client";
import React, { useState } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

export interface Attachment {
  id: number;
  name: string;
  uploadedAt: string;
}

interface Props {
  attachments: Attachment[];
  onAdd?: () => void;
  onRemove?: (id: number) => void;
}

const AttachmentView: React.FC<Props> = ({ attachments, onAdd, onRemove }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow border">
     
      <div
        className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDownIcon className="w-4 h-4 text-indigo-600" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-indigo-600" />
          )}
          <h3 className="text-sm font-semibold text-gray-700">Attachments</h3>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd?.();
          }}
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          + Add
        </button>
      </div>

      
      {isOpen && (
        <div className="p-3 border-t">
          <p className="text-xs text-gray-500 mb-2">Recently uploaded</p>

          {attachments.length === 0 ? (
            <p className="text-xs text-gray-400">No files uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {attachments.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    
                    <div className="w-10 h-10 bg-gray-300 rounded" />

                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {file.uploadedAt}
                      </p>
                    </div>
                  </div>

                  {onRemove && (
                    <button
                      onClick={() => onRemove(file.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttachmentView;
