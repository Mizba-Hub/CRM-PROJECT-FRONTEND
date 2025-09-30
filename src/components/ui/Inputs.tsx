"use client";

import { ChevronDownIcon } from "@heroicons/react/24/solid";
import React from "react";

type Option = {
  label: string;
  value: string | number;
};

type InputProps =
  | ({
      variant?: "input";
      label?:React.ReactNode;
      placeholder?:string;
      options?: never;
    } & React.InputHTMLAttributes<HTMLInputElement>)
  | ({
      variant: "textarea";
      label?: React.ReactNode;
      placeholder?: string;
      options?: never;
    } & React.TextareaHTMLAttributes<HTMLTextAreaElement>)
  | ({
      variant: "select";
      label?: React.ReactNode;
      placeholder?: string;
      options: Option[];
    } & React.SelectHTMLAttributes<HTMLSelectElement>);

export function Inputs({
  variant = "input",
  label,
  placeholder,
  className,
  options,
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label
          htmlFor={props.name}
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      {variant === "input" && (
        <input
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          placeholder={placeholder}
          id={props.name}
          className={`
      border border-gray-300 rounded px-2 py-1 text-sm 
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      placeholder-gray-400
      ${
        (props as React.InputHTMLAttributes<HTMLInputElement>).type === "date"
          ? "pr-10"
          : ""
      }
      ${className ?? ""}
    `}
        />
      )}

      {variant === "textarea" && (
        <textarea
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          placeholder={placeholder}
          id={props.name}
          className={`
            border border-gray-300 rounded px-3 py-2 text-sm 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            placeholder-gray-400
            ${className ?? ""}
          `}
        />
      )}

{variant === "select" && (
  <div className="relative w-full">
    <select
      {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
      id={props.name}
      className={`
        border border-gray-300 rounded px-3 py-2 text-sm w-full
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        appearance-none
        ${className ?? ""}
        ${props.value ? "text-black" : "text-gray-400"}
      `}
      {...(props.value !== undefined
        ? { value: props.value }
        : { defaultValue: "" })}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>

    
    <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
)}



    </div>
  );
}
