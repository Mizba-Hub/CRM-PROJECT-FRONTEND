"use client";
import { cn } from "@/app/lib/utils";
import React from "react";

type ButtonVariant = "primary" | "secondary" | "gray-outline";

interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  fullWidth?: boolean;
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
        "inline-flex items-center justify-center rounded font-medium focus:outline-none focus:ring-2 transition whitespace-nowrap",

        fullWidth ? "w-full px-5 py-2" : "px-5 py-2 min-w-[80px]",

        label.length <= 6
          ? "text-sm"
          : label.length <= 12
          ? "text-sm"
          : "text-xs",

        variant === "primary" &&
          "bg-indigo-700 text-white hover:bg-indio-800 focus:ring-indigo-600",
        variant === "secondary" &&
          "bg-white border border-indigo-600 text-indigo-600 hover:bg-gray-100 focus:ring-gray-400",
        variant === "gray-outline" &&
          "bg-white border border-gray-400 text-black hover:bg-gray-50 focus:ring-gray-300"
      )}
    >
      {label}
    </button>
  );
}
