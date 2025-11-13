"use client";

import React from "react";
import { getCurrentUserName } from "@/app/lib/auth";
import ActivityDetailView from "@/components/crm/ActivityDetailView";

export type ActivityType =
  | "note"
  | "call"
  | "task"
  | "email"
  | "meeting"
  | "deal"
  | "ticket"
  | "company";

export type ActivityItem = {
  id: number;
  type: ActivityType;
  title: string;
  author: string;
  date: string;
  dueDate?: string;
  description?: string;
  content?: string;
  overdue?: boolean;
  extra?: Record<string, any>;
};

export type ActivitySummaryViewProps = {
  heading: string;
  activities: ActivityItem[];
  ticketName?: string;
};

const ActivitySummaryView: React.FC<ActivitySummaryViewProps> = ({
  heading,
  activities,
  ticketName,
}) => {
  const currentUserName = getCurrentUserName();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  
  const updated = activities.map((a) => {
    const isTaskOrMeeting = a.type === "task" || a.type === "meeting";
    const dateValue = a.dueDate || a.date;
    if (isTaskOrMeeting && dateValue) {
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime()) && parsed < today) {
        return { ...a, overdue: true };
      }
    }
    return a;
  });

  
  const summaryTypes: ActivityType[] = ["deal", "ticket", "company", "task"];
  const detailTypes: ActivityType[] = ["note", "call", "email", "meeting"];

  const summaryActivities = updated
    .filter((a) => summaryTypes.includes(a.type))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const detailActivities = updated
    .filter((a) => detailTypes.includes(a.type))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  
  const formatDescription = (html: string = "") => {
    let formatted = html;

    if (currentUserName) {
      const userRegex = new RegExp(`\\b(${currentUserName})\\b`, "gi");
      formatted = formatted.replace(userRegex, "<strong>$1</strong>");
    }

    if (ticketName) {
      const escapedName = ticketName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const ticketRegex = new RegExp(`\\b(${escapedName})\\b`, "gi");
      formatted = formatted.replace(ticketRegex, "<strong>$1</strong>");
    }

    return formatted;
  };

  return (
    <div className="w-full">
      {heading && (
        <h2 className="text-base font-semibold text-gray-600 mb-2">
          {heading}
        </h2>
      )}

      
      {summaryActivities.length > 0 && (
        <div className="space-y-2 mb-4">
          {summaryActivities.map((activity) => {
            
            if (activity.type === "task") {
              return (
                <ActivityDetailView
                  key={activity.id}
                  sectionTitle=""
                  
                  activities={[activity]}
                />
              );
            }

            
            const descriptionHTML = formatDescription(
              activity.description || ""
            );

            return (
              <div
                key={activity.id}
                className="flex flex-col border border-gray-200 rounded-md p-2 hover:bg-gray-50 transition"
              >
                {activity.title ? (
                  <>
                    <div className="flex justify-between items-start">
                      <p className="text-gray-900 font-semibold truncate">
                        {activity.title}
                      </p>
                      <div className="text-right text-sm text-gray-400 flex items-center gap-1 flex-shrink-0">
                        <span className="whitespace-nowrap text-gray-600 font-medium">
                          {activity.date}
                        </span>
                      </div>
                    </div>

                    {activity.description && (
                      <p
                        className="text-sm text-gray-700 mt-1 leading-tight"
                        dangerouslySetInnerHTML={{
                          __html: descriptionHTML,
                        }}
                      />
                    )}
                  </>
                ) : (
                  <div className="flex justify-between items-start">
                    <p
                      className="text-sm text-gray-700 leading-tight flex-1 pr-2"
                      dangerouslySetInnerHTML={{
                        __html: descriptionHTML,
                      }}
                    />
                    <div className="text-right text-sm text-gray-400 flex items-center gap-1 flex-shrink-0">
                      <span className="whitespace-nowrap text-gray-600 font-medium">
                        {activity.date}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

   
      {detailActivities.length > 0 ? (
        <ActivityDetailView sectionTitle="" activities={detailActivities} />
      ) : summaryActivities.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-3">
          No activities to show.
        </p>
      ) : null}
    </div>
  );
};

export default ActivitySummaryView;
