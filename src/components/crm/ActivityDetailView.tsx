"use client";
import React, { useState } from "react";
import {
  ClockIcon,
} from "@heroicons/react/24/outline";
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";
import Button from "@/components/ui/Button";
import { Inputs } from "@/components/ui/Inputs"; 

type ActivityType = "note" | "call" | "task" | "email" | "meeting";

interface Activity {
  id: number;
  type: ActivityType;
  title: string;
  author: string;
  date: string;
  content?: string;
  preview?: string;
  overdue?: boolean;
  extra?: {
    priority?: string;
    taskType?: string;
    details?: string;
    outcome?: string;
    duration?: string;
    attendees?: number | string[] | [] | string;
    [key: string]: any;
  };
}

interface Props {
  sectionTitle: string;
  buttonLabel: string;
  activities: Activity[];
  onCreate?: () => void;
}

const ActivityDetailView: React.FC<Props> = ({
  sectionTitle,
  buttonLabel,
  activities,
  onCreate,
}) => {
  const [openId, setOpenId] = useState<number | null>(null);

 
  const activitiesByMonth: Record<string, Activity[]> = {};
  activities.forEach((a) => {
    if (a.date) {
      let monthYear = "No Date";
      const cleaned = a.date.replace(" at ", " ");
      const parsed = new Date(cleaned);
      if (!isNaN(parsed.getTime())) {
        monthYear = parsed.toLocaleString("default", {
          month: "long",
          year: "numeric",
        });
      } else {
        const parts = a.date.match(/\b([A-Za-z]+)\b.*(\d{4})/);
        if (parts) monthYear = `${parts[1]} ${parts[2]}`;
      }
      if (!activitiesByMonth[monthYear]) activitiesByMonth[monthYear] = [];
      activitiesByMonth[monthYear].push(a);
    }
  });

  const renderActivity = (a: Activity) => {
    const isOpen = openId === a.id;
    const [firstWord, ...restWords] = a.title.split(" ");
    const restTitle = restWords.join(" ");

    return (
      <div key={a.id} className="flex flex-col border rounded-lg">
       
        {a.type === "task" ? (
          <>
            <div
              className="flex flex-col p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => setOpenId(isOpen ? null : a.id)}
            >
              <div className="flex justify-between items-start">
                <p className="text-black flex items-center gap-2">
                  {isOpen ? (
                    <ChevronDownIcon className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4 text-indigo-600" />
                  )}
                  <span className="font-bold">{firstWord}</span>
                  <span className="truncate">{restTitle}</span>
                </p>
                <div className="text-right text-sm flex items-center gap-1">
                  {a.overdue && (
                    <span className="flex items-center text-red-500 gap-1">
                      <CalendarIcon className="w-4 h-4" /> Overdue:
                    </span>
                  )}
                  <span className="text-gray-400">{a.date}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1 ml-[1.5rem]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded-full border-2 border-black accent-indigo-600 appearance-none checked:bg-indigo-600 checked:border-indigo-600 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-sm text-gray-700">{a.content}</span>
              </div>
            </div>
            {isOpen && (
              <div className="px-4 pb-4 text-sm text-gray-700">
                <div className="grid grid-cols-3 gap-4 bg-gray-50 p-3 rounded mb-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Due Date & Time
                    </p>
                    <p className="text-black font-medium">{a.date}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Priority</p>
                    <p className="text-black font-medium">
                      {a.extra?.priority || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Type</p>
                    <p className="text-black font-medium">
                      {a.extra?.taskType || "-"}
                    </p>
                  </div>
                </div>
                {a.extra?.details && (
                  <p className="text-gray-700">{a.extra.details}</p>
                )}
              </div>
            )}
          </>
        ) : a.type === "note" ? (
          <>
            
            <div
              className="flex justify-between items-start p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => setOpenId(isOpen ? null : a.id)}
            >
              <div className="flex-1">
                <p className="text-black flex items-center gap-2">
                  {isOpen ? (
                    <ChevronDownIcon className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4 text-indigo-600" />
                  )}
                  <span className="font-bold">{firstWord}</span>
                  <span className="truncate">{restTitle}</span>
                </p>
                {!isOpen && a.content && (
                  <p className="text-sm text-gray-500 mt-1 ml-[1.01rem] truncate">
                    {a.content}
                  </p>
                )}
              </div>
              <div className="text-right text-sm flex items-center gap-1">
                {a.overdue && (
                  <span className="flex items-center text-red-500 gap-1">
                    <CalendarIcon className="w-4 h-4" /> Overdue:
                  </span>
                )}
                <span className="text-gray-400">{a.date}</span>
              </div>
            </div>
            {isOpen && a.content && (
              <div className="px-4 pb-4 text-sm text-gray-700 whitespace-pre-line">
                {a.content}
              </div>
            )}
          </>
        ) : (
          <>
           
            <div
              className="flex justify-between items-start p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => setOpenId(isOpen ? null : a.id)}
            >
              <div className="flex-1">
                <p className="text-black flex items-center gap-2">
                  {isOpen ? (
                    <ChevronDownIcon className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4 text-indigo-600" />
                  )}
                  <span className="font-bold">{firstWord}</span>
                  <span className="truncate">{restTitle}</span>
                </p>
                {a.preview && a.type === "email" && !isOpen && (
                  <p className="text-sm text-gray-500 mt-1 ml-[1.01rem]">
                    {a.preview}
                  </p>
                )}
                {a.content && a.type !== "email" && !isOpen && (
                  <p className="text-sm text-gray-500 mt-1 ml-[1.01rem]">
                    {a.content}
                  </p>
                )}
              </div>
              <div className="text-right text-sm flex items-center gap-1">
                {a.overdue && (
                  <span className="flex items-center text-red-500 gap-1">
                    <CalendarIcon className="w-4 h-4" /> Overdue:
                  </span>
                )}
                <span className="text-gray-400">{a.date}</span>
              </div>
            </div>
            {isOpen && a.type === "email" && a.content && (
              <div className="px-4 pb-4 text-sm text-gray-700 whitespace-pre-line">
                {a.content}
              </div>
            )}
            {isOpen && a.type === "call" && (
              <div className="px-4 pb-4 text-sm text-gray-700">
                {a.content && (
                  <p className="mb-3 whitespace-pre-line">{a.content}</p>
                )}
                <div className="flex gap-6">
                  <div className="w-64">
                    <Inputs
                      variant="select"
                      name="outcome"
                      label={
                        <>
                          Outcome <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="Choose"
                      options={[
                        { label: "Completed", value: "completed" },
                        { label: "Missed", value: "missed" },
                        { label: "Rescheduled", value: "rescheduled" },
                      ]}
                    />
                  </div>
                  <div className="w-40 relative">
                    <Inputs
                      variant="select"
                      name="duration"
                      label={
                        <>
                          Duration <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="Choose"
                      options={[
                        { label: "5 mins", value: "5" },
                        { label: "15 mins", value: "15" },
                        { label: "30 mins", value: "30" },
                        { label: "1 hr", value: "60" },
                      ]}
                      className="pr-8 appearance-none "
                    />
                    <ClockIcon className="w-4 h-4 text-gray-500 absolute right-2 bottom-2 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}
            {isOpen && a.type === "meeting" && (
              <div className="px-4 pb-4 text-sm text-gray-700">
                <p className="text-xs text-gray-500 mb-2">
                  Organized by {a.author}
                </p>
                <div className="grid grid-cols-3 gap-4 bg-gray-50 p-3 rounded mb-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Date & Time
                    </p>
                    <p className="text-black font-medium">{a.date}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Duration
                    </p>
                    <p className="text-black font-medium">
                      {a.extra?.duration || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Attendees
                    </p>
                    <p className="text-black font-medium">
                      {a.extra?.attendees || "-"}
                    </p>
                  </div>
                </div>
                {a.content && <p className="text-gray-700">{a.content}</p>}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 bg-white shadow rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-black">{sectionTitle}</h2>

        
        <Button label={buttonLabel} variant="primary" onClick={onCreate} />
      </div>
      {Object.keys(activitiesByMonth).map((month) => (
        <div key={month} className="mt-4 space-y-3">
          <p className="text-sm font-semibold text-gray-500">{month}</p>
          {activitiesByMonth[month].map(renderActivity)}
        </div>
      ))}
    </div>
  );
};

export default ActivityDetailView;
















