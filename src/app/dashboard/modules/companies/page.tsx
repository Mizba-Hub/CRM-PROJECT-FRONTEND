"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

import HeaderBar from "@/components/crm/EntityList";
import TableLayout, {
  TableRow,
  TableCell,
} from "@/components/crm/table/TableLayout";
import ActionButtons from "@/components/crm/table/EntityDetailHeader";
import CreateCompanyModal, { Company } from "./components/CompanyCreateButton";
import { notify } from "@/components/ui/toast/Notify";
import { formatDisplayDate } from "@/app/lib/date";

const companyFilters = [
  {
    label: "Industry",
    options: ["Technology", "Education", "Finance", "Healthcare", "Retail"],
  },
  { label: "Type", options: ["Private", "Public", "Government"] },
  { label: "Country", options: ["India", "USA", "UK", "Canada"] },
];

export default function CompaniesPage() {
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 68;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("companies");
    if (stored) setCompanies(JSON.parse(stored));
  }, []);

  if (!mounted) return null;

  const handleFilterChange = (filterName: string, value: string) => {
    setActiveFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilters = Object.entries(activeFilters).every(([key, val]) => {
      if (!val) return true;
      switch (key) {
        case "Industry":
          return company.industry === val;
        case "Type":
          return company.type === val;
        case "Country":
          return company.country === val;
        default:
          return true;
      }
    });

    const matchesDate = selectedDate
      ? company.createdDate.includes(selectedDate)
      : true;
    return matchesSearch && matchesFilters && matchesDate;
  });

  const columns = [
    { key: "checkbox", label: "" },
    { key: "companyName", label: "COMPANY NAME" },
    { key: "companyOwner", label: "COMPANY OWNER" },
    { key: "phone", label: "PHONE NUMBER" },
    { key: "industry", label: "INDUSTRY" },
    { key: "city", label: "CITY" },
    { key: "country", label: "COUNTRY/REGION" },
    { key: "createdDate", label: "CREATED DATE" },
    { key: "actions", label: "ACTIONS" },
  ];

  const updateLocalStorage = (updated: Company[]) => {
    setCompanies(updated);
    localStorage.setItem("companies", JSON.stringify(updated));
  };

  const handleSaveCompany = (data: Omit<Company, "id" | "createdDate">) => {
    if (editingCompany) {
      const updatedCompany: Company = { ...editingCompany, ...data };
      const updatedCompanies = companies.map((c) =>
        c.id === editingCompany.id ? updatedCompany : c
      );
      updateLocalStorage(updatedCompanies);
      notify("✏ Company updated successfully", "success");
      setEditingCompany(null);
    } else {
      const newCompany: Company = {
        id: Date.now(),
        ...data,
        createdDate: new Date().toISOString(),
      };
      updateLocalStorage([newCompany, ...companies]);
      notify("✅ Company created successfully", "success");
    }
    setIsModalOpen(false);
  };

  const handleDelete = (company: Company) => {
    const updated = companies.filter((c) => c.id !== company.id);
    updateLocalStorage(updated);
    notify("🗑 Company deleted successfully", "success");
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingCompany(null);
    setIsModalOpen(false);
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <HeaderBar
        title="Companies"
        onSearch={setSearchTerm}
        searchPlaceholder="Search phone, name, city"
        filters={companyFilters}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onDateChange={setSelectedDate}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onCreate={() => setIsModalOpen(true)}
      />

      <div className="px-4 pt-2 pb-4">
        <TableLayout columns={columns}>
          {filteredCompanies.length > 0 ? (
            filteredCompanies.map((company) => (
              <TableRow key={company.id}>
                <TableCell isCheckbox>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>

                <TableCell>
                  <Link
                    href={`/dashboard/modules/companies/${company.id}`}
                    onClick={() =>
                      localStorage.setItem(
                        "selectedCompany",
                        JSON.stringify(company)
                      )
                    }
                    className="hover:underline cursor-pointer"
                  >
                    {company.companyName}
                  </Link>
                </TableCell>

                <TableCell>
                  {(Array.isArray(company.companyOwner)
                    ? company.companyOwner
                    : [company.companyOwner]
                  ).map((owner, idx) => (
                    <span key={idx} className="inline-block mr-1">
                      {owner}
                    </span>
                  ))}
                </TableCell>

                <TableCell>{company.phone}</TableCell>
                <TableCell>{company.industry}</TableCell>
                <TableCell>{company.city}</TableCell>
                <TableCell>{company.country}</TableCell>
                <TableCell>{formatDisplayDate(company.createdDate)}</TableCell>

                <TableCell>
                  <ActionButtons
                    item={company}
                    isEditing={false}
                    onEdit={() => handleEdit(company)}
                    onDelete={() => handleDelete(company)}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <div className="py-4 text-gray-500 text-center">
                  No companies found
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableLayout>
      </div>

      <CreateCompanyModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCreate={handleSaveCompany}
        editingCompany={editingCompany}
      />
    </div>
  );
}
