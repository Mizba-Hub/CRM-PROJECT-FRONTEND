"use client";

import React, { useState, useRef, useEffect } from "react";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

interface PhoneInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
  onBlur?: () => void;
}

export default function PhoneInputField({
  value,
  onChange,
  error,
  label = "Phone Number",
  required,
  onBlur,
}: PhoneInputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  
  useEffect(() => {
    const unlockTyping = () => {
      const input = wrapperRef.current?.querySelector("input.form-control") as HTMLInputElement | null;
      if (input) {
        input.readOnly = false;
        input.removeAttribute("readonly");
        input.type = "tel";
        input.style.caretColor = "auto";
      }
    };
    unlockTyping();
    const interval = setInterval(unlockTyping, 300);
    return () => clearInterval(interval);
  }, []);

  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsFocused(false);
        if (onBlur) onBlur();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onBlur]);

  
  const handleChevronClick = () => {
    const trigger = wrapperRef.current?.querySelector(".selected-flag") as HTMLElement | null;
    if (trigger) {
      trigger.click();
      setIsOpen((prev) => !prev);
    }
  };

  const dynamicPlaceholder = isFocused || value ? "" : "Enter";

  return (
    <div className="w-full relative" ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div
        className={`relative flex items-center rounded-md bg-white transition-all ${
          error
            ? "border border-red-500 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
            : "border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
        }`}
      >
        <PhoneInput
          country="in" 
          value={value}
          onChange={(val, data, event, formattedValue) => {
            
            const country = data as CountryData;
            const dialCode = country?.dialCode ?? "";

            
            let cleaned = val.replace(/^(\+\d{1,3})(\+\d{1,3})/, "$1");

            
            if (dialCode && formattedValue === `+${dialCode}` && !isFocused) {
              cleaned = `+${dialCode}`;
            }

            
            cleaned = cleaned.replace(/[^\d+]/g, "");

            onChange(cleaned || "");
          }}
          inputProps={{
            name: "phone",
            required,
            autoComplete: "off",
            placeholder: dynamicPlaceholder,
            onFocus: () => setIsFocused(true),
            onBlur: () => {
              setIsFocused(false);
              if (onBlur) onBlur();
            },
          }}
          countryCodeEditable={true}
          disableDropdown={false}
          containerClass="w-full"
          inputClass="!w-full !text-sm !h-[36px] !border-0 !rounded-md !pl-[60px] !pr-3 !text-gray-700 !placeholder-gray-400 focus:!outline-none focus:!ring-0 bg-transparent"
          buttonClass="!absolute !left-0 !top-0 !bottom-0 !w-[52px] !border-0 !bg-transparent !rounded-l-md !flex !items-center !justify-center z-10"
          dropdownClass="!absolute !left-0 !top-full !mt-1 !min-w-[260px] !bg-white !border !border-gray-200 !rounded-md !shadow-lg !max-h-60 !overflow-y-auto !z-20"
        />

        
        <div className="absolute left-[52px] h-4 w-px bg-gray-300 pointer-events-none" />

        
        <button
          type="button"
          onClick={handleChevronClick}
          className="absolute left-[34px] flex items-center justify-center text-gray-600 z-30"
          aria-label="Toggle country list"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-3 h-3 text-gray-600 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

       
        <style jsx global>{`
          .react-tel-input .selected-flag .arrow {
            display: none !important;
          }
          .react-tel-input .flag {
            transform: scale(1.25);
            transition: opacity 0.2s ease;
          }
          .react-tel-input .selected-flag .dial-code {
            opacity: ${isFocused || value ? "1" : "0"};
            transition: opacity 0.2s ease;
          }
        `}</style>
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
