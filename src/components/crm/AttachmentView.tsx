"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  X,
  Plus,
  FileText,
  FileSpreadsheet,
  FileArchive,
  File,
  FileCode,
  FileVideo,
} from "lucide-react";

export interface Attachment {
  id: number;
  name: string;
  uploadedAt: string;
  previewUrl?: string;
  type?: string;
}

interface Props {
  attachments: Attachment[];
  onAdd?: (file: File, previewUrl?: string) => void;
  onRemove?: (id: number) => void;
}

const AttachmentView: React.FC<Props> = ({ attachments, onAdd, onRemove }) => {
  const [isDefaultView, setIsDefaultView] = useState(true); 
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsDefaultView(true);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  
  const getFileIcon = (type: string | undefined, name: string) => {
    if (!type && !name) return <File className="w-6 h-6 text-gray-500" />;
    if (type?.includes("pdf") || name.endsWith(".pdf"))
      return <FileText className="w-6 h-6 text-red-500" />;
    if (
      type?.includes("sheet") ||
      name.endsWith(".xls") ||
      name.endsWith(".xlsx") ||
      name.endsWith(".csv")
    )
      return <FileSpreadsheet className="w-6 h-6 text-green-500" />;
    if (
      type?.includes("word") ||
      name.endsWith(".doc") ||
      name.endsWith(".docx")
    )
      return <FileText className="w-6 h-6 text-blue-500" />;
    if (type?.includes("zip") || name.endsWith(".zip"))
      return <FileArchive className="w-6 h-6 text-yellow-500" />;
    if (type?.includes("video"))
      return <FileVideo className="w-6 h-6 text-purple-500" />;
    if (type?.includes("code") || name.endsWith(".js") || name.endsWith(".ts"))
      return <FileCode className="w-6 h-6 text-indigo-500" />;
    return <File className="w-6 h-6 text-gray-500" />;
  };

  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isImage = file.type.startsWith("image/");
      const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
      onAdd?.(file, previewUrl);
      setIsDefaultView(false); 
    }
    e.target.value = "";
  };

  
  const handleToggle = () => setIsDefaultView((prev) => !prev);

  return (
    <div
      ref={wrapperRef}
      className="bg-white pt-1 mx-3 mr-1.5"
    >
      
      <div
  className="flex justify-between items-center cursor-pointer hover:bg-gray-50 transition"
  onClick={handleToggle}
>


        <div className="flex items-center gap-2">
          {isDefaultView ? (
            <ChevronDownIcon className="w-4 h-5 text-indigo-600" />
          ) : (
            <ChevronRightIcon className="w-4 h-5 text-indigo-600" />
          )}
          <h3 className="text-[16px] font-semibold text-gray-700">Attachments</h3>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.js,.ts,.mp4,.mov"
        />
      </div>

      
      <div className="px-1 ">
        {isDefaultView ? (
          
          <p className="text-[14px] text-gray-500 leading-relaxed">
            See the files attached to your activities or uploaded to this record.
          </p>
        ) : (
          
          <>
            <p className="text-sm text-gray-500 mb-3 font-medium">
              Recently uploaded
            </p>

            {attachments.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No attachments yet.</p>
            ) : (
              <div className="space-y-2">
                {attachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between bg-gray-100 rounded-md px-3 py-2 hover:bg-gray-200 transition"
                  >
                    <div className="flex items-center gap-3">
                      
                      {file.previewUrl ? (
                        <img
                          src={file.previewUrl}
                          alt={file.name}
                          className="w-10 h-10 object-cover rounded-md border border-gray-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-md">
                          {getFileIcon(file.type, file.name)}
                        </div>
                      )}

                      
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {file.uploadedAt}
                        </p>
                      </div>
                    </div>

                    
                    {onRemove && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(file.id);
                        }}
                        className="text-gray-400 hover:text-black transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AttachmentView;
