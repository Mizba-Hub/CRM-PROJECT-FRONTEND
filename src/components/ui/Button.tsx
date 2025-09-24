"use client";
import { cn } from "@/app/lib/utils";
import React from "react";

type ButtonVariant = "primary" | "secondary" | "gray-outline";
type ButtonSize = "md" | "lg";

interface ButtonProps {
  label: String;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export default function Button({
  label,
  variant = "primary",
  size = "md",
  onClick,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded font-medium focus:outline-none focus:ring-2 transition",

        size === "md" && "px-7 py-1 text-xs",
        size === "lg" && "px-11 py-1 text-base",

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
