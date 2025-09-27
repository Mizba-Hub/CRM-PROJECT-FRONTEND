import React from "react";
import {
  PencilSquareIcon,
  InboxIcon,
  PhoneIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { EnvelopeIcon } from "@heroicons/react/24/solid";

interface InfoCardProps {
  name: string;
  entityType: string;
  website?: string;
  logoUrl?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({
  name,
  entityType,
  website,
  logoUrl,
}) => {
  const actions = [
    {
      label: "Note",
      icon: <PencilSquareIcon className="h-5 w-5 text-violet-600" />,
    },
    {
      label: "Email",
      icon: <EnvelopeIcon className="h-5 w-5 text-violet-600" />,
    },
    {
      label: "Call",
      icon: <PhoneIcon className="h-5 w-5 text-violet-600" />,
    },
    {
      label: "Task",
      icon: <ClipboardDocumentListIcon className="h-5 w-5 text-violet-600" />,
    },
    {
      label: "Meeting",
      icon: <CalendarDaysIcon className="h-5 w-5 text-violet-600" />,
    },
  ];

  return (
    <div className="w-80 bg-white border border-gray-200 rounded-md shadow-sm p-4">
      <div className="flex items-center gap-3 mb-4">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${name} logo`}
            className="w-12 h-12 rounded-lg object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
            {/* placeholder */}
          </div>
        )}
        <div className="flex flex-col overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-800 truncate">
            {name}
          </h3>
          <span className="text-sm text-gray-500 truncate">{entityType}</span>
          {website && (
            <span className="text-sm text-violet-600 truncate">
              {website.startsWith("http") ? website : `https://${website}`}
            </span>
          )}
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
        {actions.map((action) => (
          <div
            key={action.label}
            className="flex flex-col items-center text-xs text-gray-600 w-14"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm mb-1">
              {action.icon}
            </div>
            <span className="truncate">{action.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfoCard;
