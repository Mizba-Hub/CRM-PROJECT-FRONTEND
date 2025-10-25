"use client";

import React from "react";
import { Search } from "lucide-react";
import Button from "@/components/ui/Button";
import { Inputs } from "@/components/ui/Inputs";

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
  activeFilters: Record<string, string>;
  onCreate?: () => void;
  isDealPage?: boolean;
  modulePlaceholder?: string;
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
  activeFilters,
  onCreate,
  isDealPage = false,
  modulePlaceholder,
}) => {
  const pages: (number | string)[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    if (currentPage <= 3) {
      pages.push(1, 2, 3, "...", totalPages - 1, totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, 2, "...", totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(
        1,
        "...",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "...",
        totalPages
      );
    }
  }

  return (
    <div className="bg-white pb-2">
      <div className="w-full">
        <div className="flex justify-between items-center px-4 pt-4">
          <h3 className="text-md font-bold text-black">{title}</h3>
          <div className="flex gap-2">
            <Button label="Import" variant="secondary" />
            <Button label="Create" variant="primary" onClick={onCreate} />
          </div>
        </div>
        <div className="w-full border-b-2 border-gray-100 mt-2"></div>
      </div>

      <div className="w-full">
        <div className="flex justify-between items-center flex-wrap gap-3 px-4 py-2">
          <div className="flex items-center w-64 h-9 rounded-lg bg-gray-100 border border-gray-300 px-2">
            <Search size={16} className="text-gray-400" />
            <Inputs
              variant="input"
              name="header-search"
              placeholder={modulePlaceholder}
              className="flex-1 h-full bg-transparent border-none text-xs text-gray-600 focus:ring-0 focus:border-none px-1"
              onChange={(e) => onSearch((e.target as HTMLInputElement).value)}
            />
          </div>

          <div className="flex items-center justify-center space-x-1 text-[13px] select-none py-2">
            <button
              onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
              className={`px-3 py-2 rounded transition-all duration-150 ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-indigo-700 hover:text-indigo-900"
              }`}
            >
              ← Previous
            </button>

            {pages.map((page, idx) =>
              typeof page === "number" ? (
                <button
                  key={idx}
                  onClick={() => onPageChange(page)}
                  className={`w-6 h-6 flex items-center justify-center rounded-md transition-all duration-150 ${
                    page === currentPage
                      ? "bg-indigo-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              ) : (
                <span key={idx} className="px-1 text-gray-400">
                  {page}
                </span>
              )
            )}

            <button
              onClick={() =>
                currentPage < totalPages && onPageChange(currentPage + 1)
              }
              className={`px-3 py-2 flex items-center justify-center rounded-md transition-all duration-150 ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-indigo-700"
              }`}
            >
              Next →
            </button>
          </div>
        </div>
        <div className="w-full border-b-3 border-gray-100"></div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-2 px-4 mt-3">
        {filters.map((filter, idx) => {
          const selected = activeFilters[filter.label] || "";
          return (
            <div key={idx} className="w-40">
              {selected ? (
                <div className="flex items-center justify-between border border-gray-200 rounded-lg px-3 text-sm text-gray-600 bg-white h-10">
                  <span>{selected}</span>
                  <span
                    className="ml-2 cursor-pointer text-lg"
                    onClick={() => onFilterChange(filter.label, "")}
                  >
                    ×
                  </span>
                </div>
              ) : (
                <Inputs
                  variant="select"
                  placeholder={filter.label}
                  name={`filter-${filter.label}`}
                  options={filter.options.map((opt) => ({
                    label: opt,
                    value: opt,
                  }))}
                  onChange={(e) => onFilterChange(filter.label, e.target.value)}
                  className="rounded-lg h-10 px-3 text-sm bg-white border-gray-300 pr-10 focus:outline-none focus:ring-0"
                />
              )}
            </div>
          );
        })}

        {isDealPage && (
          <div className="w-44 relative">
            <Inputs
              variant="input"
              type="date"
              name="close-date"
              placeholder="Close Date"
              className="border-gray-300 rounded-lg px-2 text-sm text-gray-600 bg-white w-full h-10 pr-8"
              value={activeFilters["Close Date"] || ""}
              onChange={(e) =>
                onFilterChange(
                  "Close Date",
                  (e.target as HTMLInputElement).value
                )
              }
            />
            {activeFilters["Close Date"] && (
              <span
                onClick={() => onFilterChange("Close Date", "")}
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-700"
              >
                ×
              </span>
            )}
          </div>
        )}

        <div className="w-44 relative">
          <Inputs
            variant="input"
            type="date"
            name="filter-date"
            placeholder="Created Date"
            className="border-gray-300 rounded-lg px-2 text-sm text-gray-600 bg-white w-full h-10 pr-8"
            value={activeFilters["Date"] || ""}
            onChange={(e) => onDateChange((e.target as HTMLInputElement).value)}
          />
          {activeFilters["Date"] && (
            <span
              onClick={() => onFilterChange("Date", "")}
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-700"
            >
              ×
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderBar;
