import React from "react";
import { CalendarIcon, ChevronDownIcon } from "@heroicons/react/24/solid";

export type ActivityItem = {
  type: "task" | "call" | "meeting" | "email" | "note";
  title: string;
  description?: string;
  assignedTo?: string;
  dueDate?: string;
  overdue?: boolean;
};

export type ActivityCardProps = {
  heading: string;
  activities: ActivityItem[];
};

const ActivityCard: React.FC<ActivityCardProps> = ({ heading, activities }) => {
  const tasks = activities.filter((a) => a.type === "task");
  const otherActivities = activities.filter((a) => a.type !== "task");

  const activitiesByMonth: Record<string, ActivityItem[]> = {};
  otherActivities.forEach((activity) => {
    if (activity.dueDate) {
      let monthYear = "No Date";
      const date = new Date(activity.dueDate);
      if (!isNaN(date.getTime())) {
        monthYear = date.toLocaleString("default", {
          month: "long",
          year: "numeric",
        });
      } else {
        const parts = activity.dueDate.match(/\b([A-Za-z]+)\b.*(\d{4})/);
        if (parts) monthYear = `${parts[1]} ${parts[2]}`;
      }
      if (!activitiesByMonth[monthYear]) activitiesByMonth[monthYear] = [];
      activitiesByMonth[monthYear].push(activity);
    } else {
      if (!activitiesByMonth["No Date"]) activitiesByMonth["No Date"] = [];
      activitiesByMonth["No Date"].push(activity);
    }
  });

  const renderActivity = (activity: ActivityItem, idx: number) => {
    const [firstWord, ...restWords] = activity.title.split(" ");
    const restTitle = restWords.join(" ");

    return (
      <div
        key={idx}
        className="flex justify-between items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
      >
        <div className="flex-1">
          <p className="text-black flex items-center gap-2 flex-nowrap">
            <ChevronDownIcon className="w-4 h-4 text-indigo-600 stroke-2 flex-shrink-0" />
            <span className="font-bold whitespace-nowrap">{firstWord}</span>
            <span className="truncate">
              {restTitle}
              {activity.assignedTo && ` assigned to ${activity.assignedTo}`}
            </span>
          </p>

          {activity.description && activity.type !== "task" && (
            <p className="text-sm text-gray-500 mt-1 ml-[1.01rem]">
              {activity.description}
            </p>
          )}

          {activity.type === "task" && activity.description && (
            <div className="flex items-center gap-2 mt-1 ml-[1.5rem]">
              <input
                type="checkbox"
                className="h-4 w-4 rounded-full border-2 border-black accent-blue-500 appearance-none checked:bg-blue-500 checked:border-blue-500 cursor-pointer"
              />
              <p className="text-sm text-gray-500">{activity.description}</p>
            </div>
          )}
        </div>

        <div className="text-right text-sm">
          {activity.dueDate && (
            <p className="flex items-center justify-end gap-1">
              {activity.overdue && (
                <span className="flex items-center text-red-500 gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  Overdue:
                </span>
              )}
              <span className="text-gray-400">{activity.dueDate}</span>
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white w-full">
      <h2 className="text-lg font-semibold mb-4 text-black">{heading}</h2>

      {tasks.map(renderActivity)}

      {Object.keys(activitiesByMonth).map((month) => (
        <div key={month} className="mt-4 space-y-3">
          <p className="text-sm font-semibold text-gray-500">{month}</p>
          {activitiesByMonth[month].map(renderActivity)}
        </div>
      ))}
    </div>
  );
};

export default ActivityCard;













