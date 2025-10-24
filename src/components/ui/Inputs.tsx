"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import React, { useState, useRef, useEffect } from "react";

type Option = {
  label: string;
  value: string | number;
};

type InputProps =
  | ({
      variant?: "input";
      label?: React.ReactNode;
      placeholder?: string;
      options?: never;
      showChevron?: boolean;
      value?: string | number | readonly string[];
    } & React.InputHTMLAttributes<HTMLInputElement>)
  | ({
      variant: "textarea";
      label?: React.ReactNode;
      placeholder?: string;
      options?: never;
      showChevron?: boolean;
      value?: string | number | readonly string[];
    } & React.TextareaHTMLAttributes<HTMLTextAreaElement>)
  | ({
      variant: "select";
      label?: React.ReactNode;
      placeholder?: string;
      options: Option[];
      showChevron?: boolean;
      value?: string | number;
    } & React.SelectHTMLAttributes<HTMLSelectElement>)
  | ({
      variant: "multiselect";
      label?: React.ReactNode;
      name?: string;
      placeholder?: string;
      options: Option[];
      showChevron?: boolean;
      value: string[];
      onChange: (values: string[]) => void;
    } & Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">);

export function Inputs({
  variant = "input",
  label,
  placeholder,
  className,
  options,
  value,
  showChevron = true,
  ...props
}: InputProps) {
  const [showMulti, setShowMulti] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowMulti(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label
          htmlFor={(props as any).name}
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      {variant === "input" && (
        <input
          {...(props as any)}
          id={(props as any).name}
          placeholder={placeholder}
          value={value ?? (props as any).value ?? ""}
          disabled={(props as any).disabled}
          className={`
      border border-gray-300 rounded px-2 py-1 text-sm 
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      placeholder-gray-400 h-[36px]
      ${
        (props as any).disabled
          ? "bg-gray-100 text-gray-700 cursor-not-allowed"
          : ""
      }
      ${className ?? ""}
    `}
        />
      )}

      {variant === "textarea" && (
        <textarea
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          id={(props as any).name}
          placeholder={placeholder}
          value={value ?? ""}
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
            {...(props as Omit<
              React.SelectHTMLAttributes<HTMLSelectElement>,
              "value" | "showChevron"
            >)}
            id={(props as any).name}
            value={value ?? ""}
            onChange={(props as any).onChange || (() => {})}
            className={`
              border border-gray-300 rounded px-3 py-2 text-sm w-full
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              appearance-none h-[36px] bg-white
              ${!value || value === "" ? "text-gray-400" : "text-gray-700"}
              ${className ?? ""}
            `}
            style={{
              color: !value || value === "" ? "#9ca3af" : "#374151",
            }}
          >
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {showChevron && (
            <ChevronDownIcon
              className="w-3 h-3 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              strokeWidth={3.5}
            />
          )}
        </div>
      )}

      {variant === "multiselect" && (
        <div className="relative w-full" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowMulti((p) => !p)}
            className={`w-full border rounded px-3 py-2 flex justify-between items-center text-sm ${
              (value as string[])?.length ? "text-gray-700" : "text-gray-400"
            } border-gray-300`}
          >
            <span className="truncate text-left">
              {(value as string[])?.length
                ? (value as string[]).join(", ")
                : placeholder || "Choose"}
            </span>
            <ChevronDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>

          {showMulti && (
            <div className="absolute mt-1 w-full border border-gray-300 rounded bg-white shadow-md z-10 max-h-40 overflow-y-auto">
              {options?.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={(value as string[]).includes(String(opt.value))}
                    onChange={() => {
                      const current = value as string[];
                      const newValues = current.includes(String(opt.value))
                        ? current.filter((v) => v !== String(opt.value))
                        : [...current, String(opt.value)];
                      (props as any).onChange?.(newValues);
                    }}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <span className="text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
