"use client";
import React from "react";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@/components/ui/Tabs";

export type CRMTabKey = "activity" | "notes" | "emails" | "calls" | "tasks" | "meetings";
export type CRMTabHeaderProps = {
  value?: CRMTabKey;
  defaultValue?: CRMTabKey;
  onChange?: (k: CRMTabKey) => void;
  renderPanel: (k: CRMTabKey) => React.ReactNode;
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

export default function CRMTabHeader({ value, defaultValue = "activity", onChange, renderPanel, className }: CRMTabHeaderProps) {
  const keys: CRMTabKey[] = ["activity", "notes", "emails", "calls", "tasks", "meetings"];
  return (
    <Tabs value={value} defaultValue={defaultValue} onValueChange={(v) => onChange?.(v as CRMTabKey)} className={className}>
      <TabList className="gap-6 border-b">
        {keys.map((k) => (
          <Tab key={k} value={k}>
            {LABELS[k]}
          </Tab>
        ))}
      </TabList>
      <TabPanels>
        {keys.map((k) => (
          <TabPanel key={k} when={k}>
            {renderPanel(k)}
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
}
