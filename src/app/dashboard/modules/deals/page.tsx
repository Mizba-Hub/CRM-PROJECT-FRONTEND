"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import HeaderBar from "@/components/crm/EntityList";
import TableLayout, {
  TableRow,
  TableCell,
} from "@/components/crm/table/TableLayout";
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
  associatedLead?: string;
}

const dealFilters = [
  {
    label: "Deal Owner",
    options: [
      "Maria Johnson",
      "Shaimah",
      "Mizba",
      "Greeshma",
      "Sabira",
      "Shifa",
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
  const [totalPages, setTotalPages] = useState(1);

  const [deals, setDeals] = useState<Deal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // 🟣 Manage associated lead for modal
  const [tempAssociatedLead, setTempAssociatedLead] = useState("");

  // 🟣 Capture query params (for Convert flow)
  const searchParams = useSearchParams();
  const openModal = searchParams.get("openModal");
  const leadName = searchParams.get("leadName");
  const leadId = searchParams.get("leadId");
  useEffect(() => {
    const stored = localStorage.getItem("deals");
    if (stored) {
      const parsed = JSON.parse(stored);
      const normalized = parsed.map((d: any) => ({
        ...d,
        owner: Array.isArray(d.owner) ? d.owner : [d.owner].filter(Boolean),
      }));
      setDeals(normalized);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "deals") {
        const updated = e.newValue ? JSON.parse(e.newValue) : [];
        setDeals(
          updated.map((d: any) => ({
            ...d,
            owner: Array.isArray(d.owner) ? d.owner : [d.owner].filter(Boolean),
          }))
        );
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);
  useEffect(() => {
    if (openModal === "true") {
      setTempAssociatedLead(leadName || "");
      setModalMode("create");
      setSelectedDeal(null);
      setIsModalOpen(true);
    }
  }, [openModal, leadName]);
  const handleSaveDeal = (dealData: Omit<Deal, "id">) => {
    let updatedDeals: Deal[];

    const newDeal: Deal = {
      id: Date.now(),
      ...dealData,
      associatedLead: tempAssociatedLead || dealData.associatedLead || "",
    };

    if (modalMode === "edit" && selectedDeal) {
      updatedDeals = deals.map((d) =>
        d.id === selectedDeal.id ? { ...d, ...dealData } : d
      );
    } else {
      updatedDeals = [newDeal, ...deals];
    }

    setDeals(updatedDeals);
    localStorage.setItem("deals", JSON.stringify(updatedDeals));
    window.dispatchEvent(new Event("storage"));
    if (leadId || newDeal.associatedLead) {
      const storedLeads = localStorage.getItem("leads");
      if (storedLeads) {
        const leads = JSON.parse(storedLeads);
        const updatedLeads = leads.map((l: any) => {
          const fullName = `${l.firstName} ${l.lastName}`;
          if (
            String(l.id) === String(leadId) ||
            fullName === newDeal.associatedLead
          ) {
            return { ...l, converted: true };
          }
          return l;
        });
        localStorage.setItem("leads", JSON.stringify(updatedLeads));
        window.dispatchEvent(new Event("storage"));
      }
    }
    setIsModalOpen(false);
    setSelectedDeal(null);
    setModalMode("create");
    setTempAssociatedLead("");
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
    setTempAssociatedLead("");
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
  useEffect(() => {
    const itemsPerPage = 10;
    const calculatedTotalPages = Math.ceil(filteredDeals.length / itemsPerPage);
    setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
    if (currentPage > calculatedTotalPages) {
      setCurrentPage(1);
    }
  }, [filteredDeals.length, currentPage]);
  const columns = [
    { key: "checkbox", label: "" },
    { key: "name", label: "DEAL NAME" },
    { key: "stage", label: "DEAL STAGE" },
    { key: "closeDate", label: "CLOSE DATE" },
    { key: "owner", label: "DEAL OWNER" },
    { key: "amount", label: "AMOUNT" },
    { key: "actions", label: "ACTIONS" },
  ];

  return (
    <div className="bg-white m-2 rounded-md h-full overflow-hidden">
      <HeaderBar
        title="Deals"
        searchPlaceholder="Search phone,name,city"
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
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDeal(null);
          setModalMode("create");
          setTempAssociatedLead("");
        }}
        onSave={handleSaveDeal}
        initialData={
          modalMode === "edit" ? selectedDeal || undefined : undefined
        }
        mode={modalMode}
        associatedLead={tempAssociatedLead}
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
