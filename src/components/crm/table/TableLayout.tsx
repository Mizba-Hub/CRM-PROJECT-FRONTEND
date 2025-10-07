"use client";

import React, { useState } from "react";

interface Column {
  key: string;
  label: string;
}

interface TableLayoutProps {
  columns: Column[];
  children?: React.ReactNode;
}

export const TableRow: React.FC<
  React.HTMLAttributes<HTMLTableRowElement> & { children: React.ReactNode }
> = ({ children, className = "", ...props }) => {
  return (
    <tr
      {...props}
      className={`border-b border-gray-300 hover:bg-gray-50 transition-colors ${className}`}
    >
      {children}
    </tr>
  );
};

export const TableCell: React.FC<
  React.TdHTMLAttributes<HTMLTableCellElement> & { isCheckbox?: boolean }
> = ({ isCheckbox = false, children, className = "", ...props }) => {
  return (
    <td
      {...props}
      className={`px-4 text-sm ${
        isCheckbox ? "w-8" : "text-left"
      } ${className}`}
    >
      {isCheckbox ? (
        <div className="flex items-center">{children}</div>
      ) : (
        children
      )}
    </td>
  );
};

const TableLayout: React.FC<TableLayoutProps> = ({ columns, children }) => {
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setSelectAll(isChecked);

    const checkboxes = document.querySelectorAll<HTMLInputElement>(
      'tbody input[type="checkbox"]'
    );
    checkboxes.forEach((checkbox) => {
      checkbox.checked = isChecked;
    });
  };

  return (
    <div className="overflow-x-auto shadow bg-white rounded-lg border border-gray-300">
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-indigo-700 text-white text-sm">
            {columns.map((col, index) => (
              <th
                key={col.key}
                className={`px-4 py-3 font-medium text-left ${
                  index === 0 ? "w-8" : ""
                }`}
              >
                {index === 0 ? (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="appearance-none h-4 w-4 border-2 border-white rounded-sm
                                 checked:bg-indigo-700 checked:border-white 
                                 checked:after:content-['✔'] checked:after:text-white 
                                 checked:after:block checked:after:text-center checked:after:leading-4"
                    />
                  </div>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="text-gray-900 text-sm">{children}</tbody>
      </table>
    </div>
  );
};

export default TableLayout;
