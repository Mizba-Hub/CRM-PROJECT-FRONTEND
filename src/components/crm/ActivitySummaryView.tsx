"use client";

import React from "react";
import { CalendarIcon } from "@heroicons/react/24/solid";
import { ChevronDownIcon } from "lucide-react";

export type ActivityItem = {
  type: "task" | "call" | "meeting" | "email" | "note";
  title: string;
  description?: string;
  assignedTo?: string;
  dueDate?: string;
  date?: string;
  overdue?: boolean;
};

export type ActivityCardProps = {
  heading: string;
  activities: ActivityItem[];
};

const ActivitySummaryView: React.FC<ActivityCardProps> = ({
  heading,
  activities,
}) => {
  const tasks = activities.filter((a) => a.type === "task");
  const others = activities.filter((a) => a.type !== "task");

  const activitiesByMonth: Record<string, ActivityItem[]> = {};
  others.forEach((activity) => {
    const dateValue = activity.dueDate || activity.date;
    let monthYear = "No Date";

    if (dateValue) {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        monthYear = date.toLocaleString("default", {
          month: "long",
          year: "numeric",
        });
      } else {
        const parts = dateValue.match(/\b([A-Za-z]+)\b.*(\d{4})/);
        if (parts) monthYear = `${parts[1]} ${parts[2]}`;
      }
    }

    if (!activitiesByMonth[monthYear]) activitiesByMonth[monthYear] = [];
    activitiesByMonth[monthYear].push(activity);
  });

  const renderActivity = (activity: ActivityItem, idx: number) => {
    const [firstWord, ...restWords] = activity.title.split(" ");
    const restTitle = restWords.join(" ");

    return (
      <div
        key={idx}
        className="flex justify-between items-start p-3 rounded-md border hover:bg-gray-50 transition"
      >
        <div className="flex-1">
          <p className="text-black flex items-center gap-2">
            <ChevronDownIcon className="w-4 h-4 text-indigo-600" />
            <span className="font-bold">{firstWord}</span>
            <span className="truncate">{restTitle}</span>
          </p>

          {activity.type === "task" ? (
            <div className="flex items-center gap-2 mt-2 ml-[1.6rem]">
              <input
                type="checkbox"
                className="h-4 w-4 rounded-full border-2 border-gray-400 accent-indigo-600 appearance-none checked:bg-indigo-600 checked:border-indigo-600 cursor-pointer"
              />
              <p className="text-sm text-gray-600">{activity.description}</p>
            </div>
          ) : (
            activity.description && (
              <p className="text-sm text-gray-500 mt-1 ml-[1.1rem]">
                {activity.description}
              </p>
            )
          )}
        </div>

        <div className="text-right text-sm text-gray-400">
          {(activity.dueDate || activity.date) && (
            <p className="flex items-center justify-end gap-1">
              {activity.overdue && (
                <span className="flex items-center text-red-500 gap-1">
                  <CalendarIcon className="w-4 h-4" /> Overdue:
                </span>
              )}
              <span>{activity.dueDate || activity.date}</span>
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <h2 className="text-base font-semibold text-gray-700 mb-3">{heading}</h2>
      <div className="space-y-3 mb-6">{tasks.map(renderActivity)}</div>

      {Object.keys(activitiesByMonth).map((month) => (
        <div key={month} className="mt-5 space-y-3">
          <p className="text-sm font-semibold text-gray-500">{month}</p>
          {activitiesByMonth[month].map(renderActivity)}
        </div>
      ))}

      {tasks.length === 0 && Object.keys(activitiesByMonth).length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          No activities to show.
        </p>
      )}
    </div>
  );
};

export default ActivitySummaryView;
