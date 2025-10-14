"use client";
import React from "react";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@/components/ui/Tabs";


export type ActivityType = "note" | "call" | "task" | "email" | "meeting";
export type CRMTabKey =
  | "activity"
  | "notes"
  | "emails"
  | "calls"
  | "tasks"
  | "meetings";

export type CRMTabHeaderProps = {
  value?: ActivityType | "activity";
  defaultValue?: CRMTabKey;
  onChange?: (k: ActivityType | "activity") => void;
  renderPanel: (k: ActivityType | "activity") => React.ReactNode;
  className?: string;
};


const LABELS: Record<CRMTabKey, string> = {
  activity: "Activity",
  notes: "Notes",
  emails: "Emails",
  calls: "Calls",
  tasks: "Tasks",
  meetings: "Meetings",
};


const TAB_TO_ACTIVITY: Record<CRMTabKey, ActivityType | "activity"> = {
  activity: "activity",
  notes: "note",
  emails: "email",
  calls: "call",
  tasks: "task",
  meetings: "meeting",
};

const ACTIVITY_TO_TAB: Record<ActivityType | "activity", CRMTabKey> = {
  activity: "activity",
  note: "notes",
  email: "emails",
  call: "calls",
  task: "tasks",
  meeting: "meetings",
};

export default function CRMTabHeader({
  value,
  defaultValue = "activity",
  onChange,
  renderPanel,
  className,
}: CRMTabHeaderProps) {
  const keys: CRMTabKey[] = [
    "activity",
    "notes",
    "emails",
    "calls",
    "tasks",
    "meetings",
  ];

  
  const currentTabKey: CRMTabKey = value ? ACTIVITY_TO_TAB[value] : defaultValue;

  return (
    <Tabs
      value={currentTabKey}
      defaultValue={defaultValue}
      onValueChange={(v) => {
        const mappedValue = TAB_TO_ACTIVITY[v as CRMTabKey];
        onChange?.(mappedValue);
      }}
      className={className}
    >
     
      <TabList className="flex gap-3 border-b-2 border-gray-200">
        {keys.map((k) => {
          const isActive = currentTabKey === k;
          return (
            <Tab
              key={k}
              value={k}
              className={`relative pb-3 text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? "text-black font-semibold"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {LABELS[k]}
            </Tab>
          );
        })}
      </TabList>

      
      <TabPanels className="mt-4">
        {keys.map((k) => (
          <TabPanel key={k} when={k}>
            {renderPanel(TAB_TO_ACTIVITY[k])}
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
}
