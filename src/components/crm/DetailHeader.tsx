"use client";

import React from "react";
import { Search } from "lucide-react";
import Button from "@/components/ui/Button";
import { Inputs } from "@/components/ui/Inputs";

interface DetailHeaderProps {
  searchValue: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showConvertButton?: boolean;
  onConvert?: () => void;
}

const DetailHeader: React.FC<DetailHeaderProps> = ({
  searchValue,
  onSearchChange,
  showConvertButton = false,
  onConvert,
}) => {
  return (
    <div className="bg-white rounded-md p-3 flex justify-between items-center">
      <div className="flex items-center gap-2 flex-grow border-2 border-gray-100 rounded-md  bg-gray-50 hover:bg-white focus-within:ring-2 focus-within:ring-indigo-600 transition">
        <Search className="w-5 h-6 text-black mx-1" />
        <div className="h-5 w-px bg-gray-300" />
        <Inputs
          variant="input"
          placeholder="Search activities..."
          value={searchValue}
          onChange={onSearchChange}
          className="text-sm w-full h-[24px] bg-transparent outline-none border-none focus:ring-0 text-gray-700 placeholder-gray-400"
          showFocusRing={false}
        />
      </div>

      {showConvertButton && (
        <div className="ml-4 flex-shrink-0">
          <Button label="Convert" variant="primary" onClick={onConvert} />
        </div>
      )}
    </div>
  );
};

export default DetailHeader;
