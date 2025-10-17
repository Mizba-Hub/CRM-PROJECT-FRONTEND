"use client";
import React from "react";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@/components/ui/Tabs";

export type ActivityType = "activity" | "note" | "email" | "call" | "task" | "meeting";

interface CRMTabHeaderProps {
  value?: ActivityType;
  defaultValue?: ActivityType;
  onChange?: (tab: ActivityType) => void;
  renderPanel: (tab: ActivityType, label: string) => React.ReactNode;
  className?: string;
}

const TABS: { key: ActivityType; label: string }[] = [
  { key: "activity", label: "Activity" },
  { key: "note", label: "Notes" },
  { key: "email", label: "Emails" },
  { key: "call", label: "Calls" },
  { key: "task", label: "Tasks" },
  { key: "meeting", label: "Meetings" },
];

const CRMTabHeader: React.FC<CRMTabHeaderProps> = ({
  value,
  defaultValue = "activity",
  onChange,
  renderPanel,
  className,
}) => {
  const currentValue = value || defaultValue;

  return (
    <Tabs
      value={currentValue}
      defaultValue={defaultValue}
      onValueChange={(v) => onChange?.(v as ActivityType)}
      className={className}
    >
     
      <TabList className="flex gap-3 border-b-2 border-gray-200">
        {TABS.map(({ key, label }) => {
          const active = currentValue === key;
          return (
            <Tab
              key={key}
              value={key}
              className={`pb-3 text-sm font-medium transition ${
                active ? "text-black font-semibold" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {label}
            </Tab>
          );
        })}
      </TabList>

      
      <TabPanels className="mt-4">
        {TABS.map(({ key, label }) => (
          <TabPanel key={key} when={key}>
            {renderPanel(key, label)}
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
};

export default CRMTabHeader;
