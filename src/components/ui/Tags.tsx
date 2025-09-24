"use client";

interface TagProps {
  label: string;
  value: string;
}

export default function Tag({ label, value }: TagProps) {
  return (
    <div className="flex flex-col mb-2">
      <span className="text-xs text-gray-500">{label}</span>

      <span className="text-xs font-medium text-gray-900">{value}</span>
    </div>
  );
}
