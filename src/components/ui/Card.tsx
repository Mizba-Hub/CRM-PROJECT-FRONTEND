"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  PencilSquareIcon,
  PhoneIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  ClipboardIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/solid";
import {  ChevronDownIcon,
  ChevronLeftIcon,} from "lucide-react";
import { useRouter } from "next/navigation";

interface InfoCardProps {
  module: "leads" | "companies" | "deals" | "tickets";
  title: string;
  subtitle?: string;
  email?: string;
  website?: string;
  amount?: string;
  status?: string;
  stage?: string;
  logoUrl?: string;
  onUpdate?: (field: "status" | "stage", value: string) => void;
  id?: number | string;
  onNoteClick?: () => void;
  onEmailClick?: () => void;
  onCallClick?: () => void;
  onTaskClick?: () => void;
  onMeetingClick?: () => void;
}

const InfoCard: React.FC<InfoCardProps> = ({
  module,
  title,
  subtitle,
  email,
  website,
  amount,
  status: initialStatus,
  stage: initialStage,
  logoUrl,
  onUpdate,
  id,
  onNoteClick,
  onEmailClick,
  onCallClick,
  onTaskClick,
  onMeetingClick,
}) => {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus || "New");
  const [stage, setStage] = useState(initialStage || "Appointment Scheduled");
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownType, setDropdownType] = useState<"status" | "stage" | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [copiedField, setCopiedField] = useState<"email" | "website" | null>(null);

  useEffect(() => {
    if (!id) return;
    const savedData = localStorage.getItem(`crm_${module}_${id}`);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      if (parsed.status) setStatus(parsed.status);
      if (parsed.stage) setStage(parsed.stage);
    }
  }, [id, module]);

  const saveToLocal = (field: "status" | "stage", value: string) => {
    if (!id) return;
    const existing = localStorage.getItem(`crm_${module}_${id}`);
    const data = existing ? JSON.parse(existing) : {};
    data[field] = value;
    localStorage.setItem(`crm_${module}_${id}`, JSON.stringify(data));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setDropdownType(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = (text: string, field: "email" | "website") => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const renderDropdown = (type: "status" | "stage") => {
    const options =
      type === "status"
        ? ["New", "Waiting on us", "Waiting on Contact", "Closed"]
        : [
            "Appointment Scheduled",
            "Presentation Scheduled",
            "Negotiation",
            "Qualified to Buy",
            "Contract Sent",
            "Closed Won",
            "Closed Lost",
          ];
    const currentValue = type === "status" ? status : stage;

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => {
            setDropdownType(type);
            setIsOpen(!isOpen);
          }}
          className="flex items-center text-sm text-black focus:outline-none"
        >
          {currentValue}
          <ChevronDownIcon
            className={`w-4 h-4 ml-1 text-indigo-700 transition-transform ${
              isOpen && dropdownType === type ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && dropdownType === type && (
          <div className="absolute mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  if (type === "status") {
                    setStatus(opt);
                    saveToLocal("status", opt);
                    onUpdate?.("status", opt);
                  } else {
                    setStage(opt);
                    saveToLocal("stage", opt);
                    onUpdate?.("stage", opt);
                  }
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 ${
                  opt === currentValue ? "text-indigo-700 font-medium" : "text-gray-700"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderBackButton = () => {
    const moduleName = module.charAt(0).toUpperCase() + module.slice(1);
    const path = `/dashboard/modules/${module}`;

    return (
      <button
        onClick={() => router.push(path)}
        className="flex items-center text-sm text-black mb-2 font-semibold"
      >
        <ChevronLeftIcon className="w-4 h-4 mr-0 text-black " />
        {moduleName}
      </button>
    );
  };

  const renderTopSection = () => {
    switch (module) {
      case "leads":
      case "companies":
        return (
          <div className="flex flex-col gap-2">
            {renderBackButton()}
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt={title} className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-200" />
              )}

              <div>
                <h3 className="text-[17px] font-semibold text-gray-800">{title}</h3>
                {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}

                
                {email && (
                  <div className="flex items-center gap-1 relative">
                    <p className="text-sm text-gray-700 truncate">{email}</p>
                    <ClipboardIcon
                      className="w-4 h-4 text-indigo-700 cursor-pointer hover:text-indigo-900"
                      onClick={() => handleCopy(email, "email")}
                    />
                    {copiedField === "email" && (
                      <span className="ml-1 px-1.5 py-0.5 text-[11px] border border-gray-400 rounded bg-gray-100 text-black fade-in">
                        Copied!
                      </span>
                    )}
                  </div>
                )}

                
                {website && (
                  <div className="flex items-center gap-1 relative">
                    <p className="text-sm text-gray-700 truncate">
                      {website.startsWith("http") ? website : `https://${website}`}
                    </p>
                    <ClipboardIcon
                      className="w-4 h-4 text-indigo-700 cursor-pointer hover:text-indigo-900"
                      onClick={() =>
                        handleCopy(
                          website.startsWith("http") ? website : `https://${website}`,
                          "website"
                        )
                      }
                    />
                    {copiedField === "website" && (
                      <span className="ml-1 px-1.5 py-0.5 text-[11px] border border-gray-400 rounded bg-gray-100 text-black fade-in">
                        Copied!
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "deals":
        return (
          <div className="flex flex-col gap-2">
            {renderBackButton()}
            <div>
              <h3 className="text-[17px] font-semibold text-gray-800 mb-1">{title}</h3>
              {amount && (
                <p className="text-sm text-gray-600 mb-1">
                  Amount : <span className="font-semibold text-gray-800">{amount}</span>
                </p>
              )}
              <div className="text-sm text-gray-600 flex items-center">
                Stage : <div className="ml-1">{renderDropdown("stage")}</div>
              </div>
            </div>
          </div>
        );

      case "tickets":
        return (
          <div className="flex flex-col gap-2">
            {renderBackButton()}
            <div>
              <h3 className="text-[17px] font-semibold text-gray-800 mb-1">{title}</h3>
              <div className="text-sm text-gray-600 flex items-center">
                Status : <div className="ml-1">{renderDropdown("status")}</div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const actions = [
    { label: "Note", icon: <PencilSquareIcon className="h-5 w-5 text-indigo-700" />, onClick: onNoteClick },
    { label: "Email", icon: <EnvelopeIcon className="h-5 w-5 text-indigo-700" />, onClick: onEmailClick },
    { label: "Call", icon: <PhoneIcon className="h-5 w-5 text-indigo-700" />, onClick: onCallClick },
    { label: "Task", icon: <ClipboardDocumentListIcon className="h-5 w-5 text-indigo-700" />, onClick: onTaskClick },
    { label: "Meeting", icon: <CalendarDaysIcon className="h-5 w-5 text-indigo-700" />, onClick: onMeetingClick },
  ];

  return (
    <>
     
      <style>{`
        .fade-in {
          opacity: 0;
          animation: fadeIn 0.2s ease-in-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-1px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="bg-white  border-b-2 border-gray-50 p-4 w-full max-w-sm relative">
        <div className="mb-4">{renderTopSection()}</div>

        <div className="bg-gray-50 rounded-xl p-3 flex justify-between">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className="flex flex-col items-center text-xs text-gray-600 w-14 focus:outline-none"
            >
              <div className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm mb-1 hover:border-indigo-500 hover:shadow-md transition">
                {action.icon}
              </div>
              <span className="truncate">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default InfoCard;