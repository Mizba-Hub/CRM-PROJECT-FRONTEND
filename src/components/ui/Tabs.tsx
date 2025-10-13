"use client";
import React, { createContext, useContext, useId, useMemo, useState } from "react";
import clsx from "clsx";

type TabsContextType = { value: string; setValue: (v: string) => void; idBase: string };
const TabsCtx = createContext<TabsContextType | null>(null);

function useTabsCtx() {
  const ctx = useContext(TabsCtx);
  if (!ctx) throw new Error("Tabs descendants must be inside <Tabs>");
  return ctx;
}

export type TabsProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children: React.ReactNode;
};

export function Tabs({ value, defaultValue, onValueChange, className, children }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const isControlled = value !== undefined;
  const current = isControlled ? (value as string) : internal;
  const setValue = (v: string) => {
    if (!isControlled) setInternal(v);
    onValueChange?.(v);
  };
  const idBase = useId();
  const ctx = useMemo(() => ({ value: current, setValue, idBase }), [current, idBase]);

  return (
    <TabsCtx.Provider value={ctx}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  );
}

export function TabList({
  children,
  className,
  orientation = "horizontal",
}: {
  children: React.ReactNode;
  className?: string;
  orientation?: "horizontal" | "vertical";
}) {
  const { idBase } = useTabsCtx();
  return (
    <div
      role="tablist"
      aria-labelledby={`${idBase}-label`}
      aria-orientation={orientation}
      className={clsx("flex gap-4 border-b border-gray-200", className)}
    >
      {children}
    </div>
  );
}

export type TabProps = { value: string; children: React.ReactNode; className?: string };

export function Tab({ value, children, className }: TabProps) {
  const { value: active, setValue, idBase } = useTabsCtx();
  const selected = active === value;
  const tabId = `${idBase}-tab-${value}`;
  const panelId = `${idBase}-panel-${value}`;

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const container = (e.currentTarget.parentElement as HTMLElement) || null;
    if (!container) return;
    const tabs = Array.from(container.querySelectorAll('[role="tab"]')) as HTMLButtonElement[];
    const idx = tabs.findIndex((t) => t === e.currentTarget);
    const move = (i: number) => tabs[i]?.focus();
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        move((idx + 1) % tabs.length);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        move((idx - 1 + tabs.length) % tabs.length);
        break;
      case "Home":
        e.preventDefault();
        move(0);
        break;
      case "End":
        e.preventDefault();
        move(tabs.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        setValue(value);
        break;
    }
  };

  return (
    <button
      id={tabId}
      role="tab"
      aria-selected={selected}
      aria-controls={panelId}
      tabIndex={selected ? 0 : -1}
      onClick={() => setValue(value)}
      onKeyDown={onKeyDown}
      className={clsx(
        "relative py-3 text-sm font-medium text-gray-600 outline-none transition-colors duration-200",
        "focus-visible:ring-2 focus-visible:ring-indigo-500 rounded",
        selected ? "text-black" : "hover:text-gray-900",
        className
      )}
    >
      {children}

      
      <span
  className={clsx(
    "absolute left-1/2 -translate-x-1/2 -bottom-[4px] h-[5px] w-[150%] rounded-full transition-all duration-300 ease-in-out",
    selected ? "bg-indigo-700" : "bg-transparent"
  )}
/>



    </button>
  );
}

export function TabPanels({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("pt-4", className)}>{children}</div>;
}

export function TabPanel({ when, children }: { when: string; children: React.ReactNode }) {
  const { value, idBase } = useTabsCtx();
  const selected = value === when;
  const panelId = `${idBase}-panel-${when}`;
  const tabId = `${idBase}-tab-${when}`;

  return (
    <div role="tabpanel" id={panelId} aria-labelledby={tabId} hidden={!selected}>
      {selected ? children : null}
    </div>
  );
}
