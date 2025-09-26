"use client";
import { cn } from "@/app/lib/utils";
import React from "react";

type ButtonVariant = "primary" | "secondary" | "gray-outline";

interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  fullWidth?: boolean; // ✅ for "Save" style full-width if needed
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export default function Button({
  label,
  variant = "primary",
  fullWidth = false,
  onClick,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        // base styles
        "inline-flex items-center justify-center rounded font-medium focus:outline-none focus:ring-2 transition whitespace-nowrap",

        // ✅ auto width logic → button shrinks/grows based on text
        fullWidth ? "w-full px-5 py-2" : "px-5 py-2 min-w-[80px]",

        // ✅ text sizing adjusts automatically
        label.length <= 6
          ? "text-sm"
          : label.length <= 12
          ? "text-sm"
          : "text-xs",

        // ✅ variants
        variant === "primary" &&
          "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500",
        variant === "secondary" &&
          "bg-white border border-purple-500 text-purple-500 hover:bg-gray-100 focus:ring-gray-400",
        variant === "gray-outline" &&
          "bg-white border border-gray-400 text-black hover:bg-gray-50 focus:ring-gray-300"
      )}
    >
      {label}
    </button>
  );
}