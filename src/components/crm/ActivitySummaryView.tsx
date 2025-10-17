"use client";

import React from "react";
import ActivityDetailView from "@/components/crm/ActivityDetailView";

export type ActivityType = "note" | "call" | "task" | "email" | "meeting";

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
};

const ActivitySummaryView: React.FC<ActivitySummaryViewProps> = ({
  heading,
  activities,
}) => {
  
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

  
  const sorted = [...updated].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="w-full">
      <ActivityDetailView
        sectionTitle={heading} 
        activities={sorted}
      />

     
    </div>
  );
};

export default ActivitySummaryView;
