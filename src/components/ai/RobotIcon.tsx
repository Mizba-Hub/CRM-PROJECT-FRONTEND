import React from "react";

type RobotIconProps = {
  className?: string;
};

export function RobotIcon({ className }: RobotIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? "h-4 w-4"}
      role="img"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v2" />
      <circle cx="12" cy="2.6" r="0.8" fill="currentColor" stroke="none" />

      <rect x="4" y="6.5" width="16" height="11" rx="3" />

      <path d="M3.5 11c0-2.6 1.4-3.9 3.8-4.3" />
      <path d="M20.5 11c0-2.6-1.4-3.9-3.8-4.3" />

      <circle cx="8.5" cy="12" r="1" />
      <circle cx="15.5" cy="12" r="1" />

      <path d="M10 15h4" />
    </svg>
  );
}
