"use client";

import React from "react";
import { Search } from "lucide-react";
import Button from "@/components/ui/Button";
import { Inputs } from "@/components/ui/Inputs";
import Heading from "@/components/ui/Heading";

interface Filter {
  label: string;
  options: string[];
}

interface HeaderBarProps {
  title: string;
  onSearch: (value: string) => void;
  filters: Filter[];
  onFilterChange: (filterName: string, value: string) => void;
  onDateChange: (date: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  onSearch,
  filters,
  onFilterChange,
  onDateChange,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const pages: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="bg-white shadow p-4 mb-2 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-md font-bold text-black">{title}</h3>

        <div className="flex gap-2">
          <Button
            label="Import"
            variant="secondary"
            onClick={() => console.log("Import clicked")}
          />
          <Button
            label="Create"
            variant="primary"
            onClick={() => console.log("Create clicked")}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2 sm:w-auto border border-gray-300 rounded-lg px-3 py-1">
          <Search size={16} className="text-gray-400" />
          <Inputs
            variant="input"
            name="header-search"
            placeholder="Search phone, name, city"
            className="bg-transparent border-none text-sm text-gray-600 focus:ring-0 focus:border-none"
            onChange={(e) => onSearch((e.target as HTMLInputElement).value)}
          />
        </div>

        <div className="flex items-center gap-1 text-xs flex-wrap">
          <span
            className={`cursor-pointer text-gray-600 hover:text-gray-800 ${
              currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          >
            ← Previous
          </span>

          {pages.map((page, idx) =>
            typeof page === "number" ? (
              <span
                key={idx}
                className={`cursor-pointer px-2 py-1 rounded ${
                  page === currentPage
                    ? "bg-indigo-700 text-white"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </span>
            ) : (
              <span key={idx} className="px-1 text-gray-400">
                …
              </span>
            )
          )}

          <span
            className={`cursor-pointer text-gray-600 hover:text-gray-800 ${
              currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={() =>
              currentPage < totalPages && onPageChange(currentPage + 1)
            }
          >
            Next →
          </span>
        </div>
      </div>

      {/* Filters inline */}
      <div className="flex items-center gap-1 h-8 w-42">
        {filters.map((filter, idx) => (
          <Inputs
            key={idx}
            variant="select"
            name={`filter-${filter.label}`}
            placeholder={filter.label}
            options={filter.options.map((opt) => ({
              label: opt,
              value: opt,
            }))}
            onChange={(e) =>
              onFilterChange(
                filter.label,
                (e.target as HTMLSelectElement).value
              )
            }
            className="order-gray-300 rounded-lg px-2 py-1 text-sm text-gray-700 bg-white w-40 h-8"
          />
        ))}

        <Inputs
          variant="input"
          name="filter-date"
          placeholder="Select date"
          type="date"
          className="border-gray-300 rounded-lg px-2 py-1 text-sm text-gray-700 bg-white w-40"
          onChange={(e) => onDateChange((e.target as HTMLInputElement).value)}
        />
      </div>
    </div>
  );
};

export default HeaderBar;
