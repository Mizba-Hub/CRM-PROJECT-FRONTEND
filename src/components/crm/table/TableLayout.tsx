
import React from "react";

interface Column {
  key: string;
  label: string;
}

interface TableLayoutProps {
  columns: Column[];
  children?: React.ReactNode;
}

const TableLayout: React.FC<TableLayoutProps> = ({ columns, children }) => {
  return (
    <div className="overflow-x-auto text-center shadow bg-white">
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-indigo-700 justify-center text-white text-sm">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-2 py-2 text-center align-middle font-medium"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-gray-900 text-sm">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export default TableLayout;
