"use client";

import React, { useState, useEffect } from "react";
import HeaderBar from "@/components/crm/EntityList";
import TableLayout, { TableRow, TableCell, } from "@/components/crm/table/TableLayout";
import ActionButtons from "@/components/crm/table/EntityDetailHeader";
import CreateDeal from "./components/CreateDealButton";
import Link from "next/link";
import { formatDisplayDateOnly } from "@/app/lib/date";

interface Deal {
  id: number;
  name: string;
  stage: string;
  closeDate: string;
  owner: string[];
  amount: string;
  priority: string;
  createdDate: string;
  description?: string;
  accountName?: string;
}

const dealFilters = [
  {
    label: "Deal Owner",
    options: [
      "Jane Cooper",
      "Wade Warren",
      "Brooklyn Simmons",
      "Leslie Alexander",
      "Jenny Wilson",
      "Guy Hawkins",
      "Robert Fox",
      "Cameron Williamson",
    ],
  },
  {
    label: "Deal Stage",
    options: [
      "Presentation Scheduled",
      "Qualified to Buy",
      "Contract Sent",
      "Closed Won",
      "Appointment Scheduled",
      "Decision Maker Bought In",
      "Closed Lost",
    ],
  },
];

export default function DealsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 68;

  const [deals, setDeals] = useState<Deal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  useEffect(() => {
    const storedDeals = localStorage.getItem("deals");
    if (storedDeals) {
      const parsed = JSON.parse(storedDeals);

      const normalized = parsed.map((d: any) => ({
        ...d,
        owner: Array.isArray(d.owner) ? d.owner : [d.owner],
      }));
      setDeals(normalized);
    } else {
      const defaultDeals: Deal[] = [
        {
          id: 1,
          name: "Website Revamp - Atlas Corp",
          stage: "Presentation Scheduled",
          closeDate: "2025-04-08",
          owner: ["Jane Cooper"],
          amount: "$12,500",
          priority: "High",
          createdDate: "2024-01-15",
        },
        {
          id: 2,
          name: "Mobile App for FitBuddy",
          stage: "Qualified to Buy",
          closeDate: "2025-04-08",
          owner: ["Wade Warren"],
          amount: "$25,000",
          priority: "Low",
          createdDate: "2024-01-16",
        },
        {
          id: 3,
          name: "HR Software Licenses - ZenHR",
          stage: "Contract Sent",
          closeDate: "2025-04-08",
          owner: ["Brooklyn Simmons"],
          amount: "$18,750",
          priority: "High",
          createdDate: "2024-01-17",
        },
        {
          id: 4,
          name: "CRM Onboarding - NexTech",
          stage: "Closed Won",
          closeDate: "2025-04-08",
          owner: ["Leslie Alexander"],
          amount: "$22,000",
          priority: "High",
          createdDate: "2024-01-18",
        },
        {
          id: 5,
          name: "Marketing Suite - QuickAdz",
          stage: "Appointment Scheduled",
          closeDate: "2025-04-08",
          owner: ["Jenny Wilson"],
          amount: "$14,800",
          priority: "High",
          createdDate: "2024-01-19",
        },
        {
          id: 6,
          name: "Inventory Tool - GreenMart",
          stage: "Decision Maker Bought In",
          closeDate: "2025-04-08",
          owner: ["Guy Hawkins"],
          amount: "$9,200",
          priority: "High",
          createdDate: "2024-01-20",
        },
        {
          id: 7,
          name: "ERP Integration - BlueChip",
          stage: "Qualified to Buy",
          closeDate: "2025-04-08",
          owner: ["Robert Fox"],
          amount: "$15,000",
          priority: "High",
          createdDate: "2024-01-21",
        },
        {
          id: 8,
          name: "Loyalty Program - FoodiFlex",
          stage: "Closed Lost",
          closeDate: "2025-04-08",
          owner: ["Cameron Williamson"],
          amount: "$11,000",
          priority: "High",
          createdDate: "2024-01-22",
        },
      ];
      localStorage.setItem("deals", JSON.stringify(defaultDeals));
      setDeals(defaultDeals);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "deals") {
        const updated = e.newValue ? JSON.parse(e.newValue) : [];
        const normalized = updated.map((d: any) => ({
          ...d,
          owner: Array.isArray(d.owner) ? d.owner : [d.owner],
        }));
        setDeals(normalized);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleSaveDeal = (dealData: Omit<Deal, "id">) => {
    let updatedDeals: Deal[];
    if (modalMode === "create") {
      const newDeal: Deal = { id: Date.now(), ...dealData };
      updatedDeals = [newDeal, ...deals];
    } else if (modalMode === "edit" && selectedDeal) {
      updatedDeals = deals.map((d) =>
        d.id === selectedDeal.id ? { ...d, ...dealData } : d
      );
    } else {
      updatedDeals = deals;
    }

    setDeals(updatedDeals);
    localStorage.setItem("deals", JSON.stringify(updatedDeals));
    window.dispatchEvent(new Event("storage"));
    setIsModalOpen(false);
    setSelectedDeal(null);
  };

  const handleEdit = (deal: Deal) => {
    setModalMode("edit");
    setSelectedDeal(deal);
    setIsModalOpen(true);
  };

  const handleDelete = (deal: Deal) => {
    const updated = deals.filter((d) => d.id !== deal.id);
    setDeals(updated);
    localStorage.setItem("deals", JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
  };

  const handleCreate = () => {
    setModalMode("create");
    setSelectedDeal(null);
    setIsModalOpen(true);
  };

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch =
      deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.owner.some((o) =>
        o.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesOwner = selectedOwner
      ? deal.owner.includes(selectedOwner)
      : true;
    const matchesStage = selectedStage ? deal.stage === selectedStage : true;
    const dealDisplayDate = formatDisplayDateOnly(deal.closeDate);
    const matchesDate = selectedDate ? dealDisplayDate === selectedDate : true;
    return matchesSearch && matchesOwner && matchesStage && matchesDate;
  });

  const columns = [
    { key: "checkbox", label: "" },
    { key: "name", label: "DEAL NAME" },
    { key: "stage", label: "DEAL STAGE" },
    { key: "closeDate", label: "CLOSE DATE" },
    { key: "owner", label: "DEAL OWNER(S)" },
    { key: "amount", label: "AMOUNT" },
    { key: "actions", label: "ACTIONS" },
  ];

  return (
    <div className="p-4 bg-white rounded-lg">
      <HeaderBar
        title="Deals"
        onSearch={setSearchTerm}
        filters={dealFilters}
        onFilterChange={(name, val) => {
          if (name === "Deal Owner") setSelectedOwner(val);
          else if (name === "Deal Stage") setSelectedStage(val);
        }}
        onDateChange={setSelectedDate}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onCreate={handleCreate}
        activeFilters={{
          "Deal Owner": selectedOwner,
          "Deal Stage": selectedStage,
          Date: selectedDate,
        }}
        isDealPage={true}
      />


      <CreateDeal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveDeal}
        initialData={
          modalMode === "edit" ? selectedDeal || undefined : undefined
        }
        mode={modalMode}
      />

      <div className="px-4">
        <TableLayout columns={columns}>
          {filteredDeals.length > 0 ? (
            filteredDeals.map((deal) => (
              <TableRow key={deal.id}>
                <TableCell isCheckbox>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </TableCell>

                <TableCell>
                  <Link
                    href={`/dashboard/modules/deals/${deal.id}`}
                    onClick={() =>
                      localStorage.setItem("deals", JSON.stringify(deals))
                    }
                    className="hover:underline cursor-pointer"
                  >
                    {deal.name}
                  </Link>
                </TableCell>

                <TableCell>{deal.stage}</TableCell>
                <TableCell>{formatDisplayDateOnly(deal.closeDate)}</TableCell>

                <TableCell>{deal.owner.join(", ")}</TableCell>
                <TableCell>{deal.amount}</TableCell>

                <TableCell>
                  <ActionButtons
                    item={deal}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <div className="py-4 text-gray-500 text-center">
                  No deals found
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableLayout>
      </div>
    </div>
  );
}
