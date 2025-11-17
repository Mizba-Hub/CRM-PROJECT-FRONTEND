"use client";

interface CsvExportButtonProps<T> {
  data: T[];
  headers: { key: keyof T; label: string }[];
  filename: string;
  buttonText?: string;
}

function CsvExportButton<T>({
  data,
  headers,
  filename,
  buttonText = "Export CSV",
}: CsvExportButtonProps<T>) {
  const exportCSV = () => {
    const rows = data.map((row) =>
      headers
        .map((header) => {
          const cell = row[header.key];
          const cellString =
            cell === undefined || cell === null ? "" : String(cell);
          return `"${cellString.replace(/"/g, '""')}"`;
        })
        .join(",")
    );

    const csvContent =
      [headers.map((h) => `"${h.label}"`).join(","), ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      filename.endsWith(".csv") ? filename : filename + ".csv"
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={exportCSV}
      className="border border-indigo-700 text-indigo-700 bg-transparent rounded px-3 py-1 text-sm hover:bg-indigo-50"
    >
      {buttonText}
    </button>
  );
}

export default CsvExportButton;
