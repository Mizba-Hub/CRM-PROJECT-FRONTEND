"use client";

import React, { useState, useEffect } from "react";
import HeaderBar from "@/components/crm/EntityList";
import TableLayout, {
  TableRow,
  TableCell,
} from "@/components/crm/table/TableLayout";
import ActionButtons from "@/components/crm/table/EntityDetailHeader";
import { Inputs } from "@/components/ui/Inputs";
import { notify } from "@/components/ui/toast/Notify";
import LeadModal from "./components/CreateLeadButton";
import { formatDisplayDate } from "@/app/lib/date";
import Link from "next/link";

const ITEMS_PER_PAGE = 10;

interface Lead {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  fullPhone?: string;
  city: string;
  jobTitle: string;
  contactOwner: string[];
  status:
    | "Open"
    | "New"
    | "In Progress"
    | "Contact"
    | "Qualified"
    | "Closed"
    | "Converted";
  createdDate: string;
}

const leadFilters = [
  {
    label: "Lead Status",
    options: [
      "Open",
      "New",
      "In Progress",
      "Contact",
      "Qualified",
      "Closed",
      "Converted",
    ],
  },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(
    {}
  );
  const [currentPage, setCurrentPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<Lead | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("leads");
    if (stored) {
      const parsed = JSON.parse(stored);
      const fixed = parsed.map((l: any) => ({
        ...l,
        contactOwner: Array.isArray(l.contactOwner)
          ? l.contactOwner
          : [l.contactOwner].filter(Boolean),
      }));
      setLeads(fixed);
      localStorage.setItem("leads", JSON.stringify(fixed));
    } else {
      setLeads([]);
      localStorage.setItem("leads", JSON.stringify([]));
    }
  }, []);

  useEffect(() => {
    const reloadOnStorageChange = () => {
      const stored = localStorage.getItem("leads");
      if (stored) setLeads(JSON.parse(stored));
    };
    window.addEventListener("storage", reloadOnStorageChange);
    return () => window.removeEventListener("storage", reloadOnStorageChange);
  }, []);

  const updateLocalStorage = (updatedLeads: Lead[]) => {
    setLeads(updatedLeads);
    localStorage.setItem("leads", JSON.stringify(updatedLeads));
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      `${lead.firstName} ${lead.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);

    const selectedStatus = activeFilters["Lead Status"] || "";
    const selectedDate = activeFilters["Date"] || "";

    const matchesStatus = selectedStatus
      ? lead.status === selectedStatus
      : true;

    const matchesDate = selectedDate
      ? new Date(lead.createdDate).toISOString().slice(0, 10) === selectedDate
      : true;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleSaveLead = (data: Omit<Lead, "id" | "createdDate">) => {
    if (!data.firstName || !data.lastName || !data.email || !data.status) {
      notify("Please fill all required fields", "error");
      return false;
    }
    const cleanPhone = data.phone.trim().replace(/\D/g, "").slice(-10);
    const newLead: Lead = {
      id: Date.now(),
      createdDate: new Date().toISOString(),
      ...data,
      phone: cleanPhone,
      fullPhone: data.phone,
    };
    const updated = [newLead, ...leads];
    updateLocalStorage(updated);
    notify("Lead created successfully", "success");
    setShowModal(false);
    return true;
  };

  const handleEdit = (lead: Lead) => {
    const storedLeads = localStorage.getItem("leads");
    if (storedLeads) {
      const parsed = JSON.parse(storedLeads);
      const latest = parsed.find((l: any) => l.id === lead.id);
      setEditData(latest || lead);
    } else {
      setEditData(lead);
    }
    setShowModal(true);
  };

  const handleUpdateLead = (updated: Omit<Lead, "id" | "createdDate">) => {
    if (!editData) return false;
    const updatedLead: Lead = {
      ...editData,
      ...updated,
      phone: updated.phone.replace(/\D/g, "").slice(-10),
      fullPhone: updated.phone,
    };
    const updatedLeads = leads.map((l) =>
      l.id === editData.id ? updatedLead : l
    );
    updateLocalStorage(updatedLeads);
    setEditData(null);
    setShowModal(false);
    notify("Lead updated successfully", "success");
    return true;
  };

  const handleDelete = (lead: Lead) => {
    const updated = leads.filter((l) => l.id !== lead.id);
    updateLocalStorage(updated);
    notify("Lead deleted successfully", "success");
  };

  const columns = [
    { key: "checkbox", label: "" },
    { key: "name", label: "NAME" },
    { key: "email", label: "EMAIL" },
    { key: "phone", label: "PHONE NUMBER" },
    { key: "city", label: "CITY" },
    { key: "createdDate", label: "CREATED DATE" },
    { key: "status", label: "LEAD STATUS" },
    { key: "actions", label: "ACTIONS" },
  ];

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLeads.length / ITEMS_PER_PAGE)
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilters]);

  return (
    <div className="bg-white m-2 rounded-md h-full overflow-hidden">
      <div className="w-full overflow-x-auto">
        <HeaderBar
          title="Leads"
          searchPlaceholder="Search phone, name, email"
          onSearch={(val) => setSearchTerm(val)}
          filters={leadFilters}
          activeFilters={activeFilters}
          onFilterChange={(name, val) => {
            setActiveFilters((prev) => ({ ...prev, [name]: val }));
          }}
          onDateChange={(date) => {
            setActiveFilters((prev) => ({ ...prev, Date: date }));
          }}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onCreate={() => {
            setEditData(null);
            setShowModal(true);
          }}
        />

        <div className="bg-white p-2 sm:p-4 overflow-x-auto">
          <TableLayout columns={columns}>
            {paginatedLeads.length > 0 ? (
              paginatedLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell isCheckbox>
                    <Inputs type="checkbox" variant="input" />
                  </TableCell>

                  <TableCell>
                    <Link
                      href={`/dashboard/modules/leads/${lead.id}`}
                      onClick={() =>
                        localStorage.setItem("leads", JSON.stringify(leads))
                      }
                      className="hover:underline whitespace-nowrap"
                    >
                      {lead.firstName} {lead.lastName}
                    </Link>
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    {lead.email}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {lead.phone}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {lead.city || "-"}
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    {formatDisplayDate(lead.createdDate)}
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                        lead.status === "Open"
                          ? "bg-green-100 text-green-700"
                          : lead.status === "New"
                          ? "bg-blue-100 text-blue-700"
                          : lead.status === "In Progress"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {lead.status}
                    </span>
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    <ActionButtons
                      item={lead}
                      onEdit={() => handleEdit(lead)}
                      onDelete={() => handleDelete(lead)}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <p className="text-gray-500 text-center py-4">
                    No leads found
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableLayout>
        </div>
      </div>

      <LeadModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditData(null);
        }}
        onSave={editData ? handleUpdateLead : handleSaveLead}
        editData={editData}
      />
    </div>
  );
}
