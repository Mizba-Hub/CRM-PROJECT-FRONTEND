"use client";

import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import Link from "next/link";

import {
  fetchCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  clearCurrent,
  setCurrent,
  Company,
} from "@/store/slices/companySlice";

import HeaderBar from "@/components/crm/EntityList";
import TableLayout, {
  TableRow,
  TableCell,
} from "@/components/crm/table/TableLayout";
import ActionButtons from "@/components/crm/table/EntityDetailHeader";
import CompanyFormModal, {
  CompanyFormData,
} from "./components/CompanyCreateButton";
import { formatDisplayDate } from "@/app/lib/date";
import { notify } from "@/components/ui/toast/Notify";

interface LeadDropdownOption {
  id: number;
  name: string;
  phoneNumber: string;
}

export default function CompaniesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    list = [],
    currentCompany,
    loading,
    error,
  } = useSelector((state: RootState) => state.companies);

  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CompanyFormData>({
    domainName: "",
    companyName: "",
    companyOwner: [],
    industryType: "",
    type: "",
    city: "",
    country: "",
    noOfEmployees: 0,
    annualRevenue: 0,
    phoneNumber: "",
    leadId: undefined,
  });

  const [ownersList, setOwnersList] = useState<
    { id: number; label: string; value: string }[]
  >([]);
  const [leadsList, setLeadsList] = useState<LeadDropdownOption[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(
    {}
  );

  const ITEMS_PER_PAGE = 10;

  const companyFilters = [
    {
      label: "Industry Type",
      options: ["Technology", "Education", "Finance", "Healthcare", "Retail"],
    },
    {
      label: "City",
      options: ["Delhi", "Al Ain", "Sharjah", "Ajman", "Oman", "Baku"],
    },
    {
      label: "Country/Region",
      options: ["India", "UAE", "UK", "USA", "Canada"],
    },
    {
      label: "Lead Status",
      options: ["Open", "New", "In Progress", "Qualified", "Closed"],
    },
  ];

  useEffect(() => {
    const testApiDirectly = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("🔍 [DIRECT API TEST] Token exists:", !!token);

        const response = await fetch("http://localhost:5000/api/v1/companies", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("🔍 [DIRECT API TEST] Response status:", response.status);
        console.log("🔍 [DIRECT API TEST] Response ok:", response.ok);

        const data = await response.json();
        console.log("🔍 [DIRECT API TEST] Direct API response:", data);
        console.log(
          "🔍 [DIRECT API TEST] Data length:",
          data.data?.length || data.length
        );
      } catch (error) {
        console.error(" [DIRECT API TEST] Error:", error);
      }
    };

    testApiDirectly();
  }, []);

  useEffect(() => {
    setMounted(true);
    dispatch(fetchCompanies()).unwrap().catch(console.error);
  }, [dispatch]);

  useEffect(() => {
    const fetchOwnersAndLeads = async () => {
      const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token =
        localStorage.getItem("token") || localStorage.getItem("auth_token");
      if (!BASE_URL || !token) return;

      try {
        const resOwners = await fetch(`${BASE_URL}/api/auth/users`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: token.startsWith("Bearer ")
              ? token
              : `Bearer ${token}`,
          },
        });
        if (resOwners.ok) {
          const dataOwners = await resOwners.json();
          const users = Array.isArray(dataOwners)
            ? dataOwners
            : dataOwners.data || [];
          setOwnersList(
            users.map((u: any) => ({
              id: u.id,
              label:
                `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
              value: String(u.id),
            }))
          );
        }

        const resLeads = await fetch(`${BASE_URL}/api/v1/lead`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: token.startsWith("Bearer ")
              ? token
              : `Bearer ${token}`,
          },
        });
        if (resLeads.ok) {
          const dataLeads = await resLeads.json();
          const leadsArray = Array.isArray(dataLeads)
            ? dataLeads
            : dataLeads.data || [];
          setLeadsList(
            leadsArray.map((l: any) => ({
              id: l.id,
              name:
                `${l.firstName || ""} ${l.lastName || ""}`.trim() || l.email,
              phoneNumber: l.phoneNumber || "",
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch owners or leads:", err);
      }
    };

    fetchOwnersAndLeads();
  }, []);

  const filteredCompanies = useMemo(() => {
    return list.filter((company) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        company.companyName?.toLowerCase().includes(search) ||
        company.phoneNumber?.toLowerCase().includes(search) ||
        company.city?.toLowerCase().includes(search) ||
        company.country?.toLowerCase().includes(search) ||
        company.domainName?.toLowerCase().includes(search);

      const matchesFilters = Object.entries(activeFilters).every(
        ([key, val]) => {
          if (!val) return true;
          switch (key) {
            case "Industry Type":
              return company.industryType === val;
            case "City":
              return company.city === val;
            case "Country/Region":
              return company.country === val;
            default:
              return true;
          }
        }
      );

      return matchesSearch && matchesFilters;
    });
  }, [list, searchTerm, activeFilters]);

  const paginatedCompanies = useMemo(() => {
    console.log("🔍 [PAGINATION] Total filtered:", filteredCompanies.length);
    console.log("🔍 [PAGINATION] Current page:", currentPage);

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const result = filteredCompanies.slice(startIndex, endIndex);

    console.log("🔍 [PAGINATION] Showing items:", startIndex, "to", endIndex);
    console.log("🔍 [PAGINATION] Result count:", result.length);

    return result;
  }, [filteredCompanies, currentPage]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilters]);

  const handleSearch = (term: string) => {
    console.log("🔍 [SEARCH] Setting search term:", term);
    setSearchTerm(term);
  };

  const handlePageChange = (page: number) => {
    console.log("🔍 [PAGE CHANGE] Changing to page:", page, "of", totalPages);
    setCurrentPage(page);
  };

  const handleFilterChange = (filterName: string, value: string) => {
    console.log("🔍 [FILTER] Changing filter:", filterName, "to:", value);
    setActiveFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const handleCreate = () => {
    dispatch(clearCurrent());
    setFormData({
      domainName: "",
      companyName: "",
      companyOwner: [],
      industryType: "",
      type: "",
      city: "",
      country: "",
      noOfEmployees: 0,
      annualRevenue: 0,
      phoneNumber: "",
      leadId: undefined,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (company: Company) => {
    if (!company) return;
    const ownerIds = company.companyOwner.map((o) => o.id);
    setFormData({
      domainName: company.domainName || "",
      companyName: company.companyName || "",
      companyOwner: ownerIds,
      industryType: company.industryType || "",
      type: company.type || "",
      city: company.city || "",
      country: company.country || "",
      noOfEmployees: company.noOfEmployees || 0,
      annualRevenue: company.annualRevenue || 0,
      phoneNumber: company.phoneNumber || "",
      leadId: company.leadId || undefined,
    });
    setIsModalOpen(true);
  };

  const handleLeadSelect = (leadId: number) => {
    const lead = leadsList.find((l) => l.id === leadId);
    if (!lead) return;
    setFormData((prev) => ({
      ...prev,
      leadId: Number(lead.id),
      phoneNumber: lead.phoneNumber || "",
    }));
  };

  const handleSave = async (data: CompanyFormData) => {
    try {
      const submissionData: Omit<Company, "id" | "createdDate"> = {
        domainName: data.domainName,
        companyName: data.companyName,
        industryType: data.industryType,
        type: data.type,
        city: data.city,
        country: data.country,
        noOfEmployees:
          typeof data.noOfEmployees === "number" ? data.noOfEmployees : 0,
        annualRevenue:
          typeof data.annualRevenue === "number" ? data.annualRevenue : 0,
        phoneNumber: data.phoneNumber,
        companyOwner: data.companyOwner.map((id) => ({
          id,
          firstName: "",
          lastName: "",
        })),
        leadId: data.leadId,
      };

      if (currentCompany) {
        await dispatch(
          updateCompany({ id: currentCompany.id, ...submissionData } as any)
        ).unwrap();
        notify("Company updated successfully!", "success");
      } else {
        await dispatch(createCompany(submissionData as any)).unwrap();
        notify("Company created successfully!", "success");
      }

      await dispatch(fetchCompanies()).unwrap();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Save failed:", err);
      notify(err.message || "Failed to save company", "error");
    }
  };

  const handleDelete = (company?: Company) => {
    if (!company?.id) return;
    dispatch(deleteCompany(company.id))
      .unwrap()
      .then(() => notify("Company deleted successfully", "success"))
      .catch((err) => notify("Failed to delete company: " + err, "error"));
  };

  const columns = [
    { key: "select", label: "" },
    { key: "companyName", label: "COMPANY NAME" },
    { key: "companyOwner", label: "COMPANY OWNER" },
    { key: "phone", label: "PHONE NUMBER" },
    { key: "industry", label: "INDUSTRY" },
    { key: "type", label: "TYPE" },
    { key: "city", label: "CITY" },
    { key: "country", label: "COUNTRY/REGION" },
    { key: "createdDate", label: "CREATED DATE" },
    { key: "actions", label: "ACTIONS" },
  ];

  if (!mounted) {
    return (
      <div className="p-4 bg-white rounded shadow">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <HeaderBar
        title="Companies"
        onSearch={handleSearch}
        searchPlaceholder="Search by name, phone, city…"
        filters={companyFilters}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onDateChange={() => {}}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onCreate={handleCreate}
      />

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading companies...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
          <p className="text-red-700">Error: {error}</p>
          <button
            onClick={() => dispatch(fetchCompanies())}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="mb-4 text-sm text-gray-600">
          {searchTerm && ` for "${searchTerm}"`}
          {filteredCompanies.length !== list.length &&
            ` (${list.length} total companies)`}
        </div>
      )}

      <TableLayout columns={columns}>
        {paginatedCompanies.length > 0 ? (
          paginatedCompanies.map((company) => (
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
                  {company.companyName || "-"}
                </Link>
              </TableCell>

              <TableCell>
                {company.companyOwner && company.companyOwner.length > 0 ? (
                  company.companyOwner
                    .map((owner) => {
                      const fullName = `${owner.firstName || ""} ${
                        owner.lastName || ""
                      }`.trim();
                      return fullName || `User ${owner.id}`;
                    })
                    .join(", ")
                ) : (
                  <span className="text-gray-400">Unassigned</span>
                )}
              </TableCell>

              <TableCell>{company.phoneNumber || "-"}</TableCell>
              <TableCell>{company.industryType || "-"}</TableCell>
              <TableCell>{company.type || "-"}</TableCell>
              <TableCell>{company.city || "-"}</TableCell>
              <TableCell>{company.country || "-"}</TableCell>
              <TableCell>{formatDisplayDate(company.createdDate)}</TableCell>
              <TableCell>
                <ActionButtons
                  item={company}
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
                {loading ? "Loading..." : "No companies found"}
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableLayout>

      <CompanyFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        formData={formData}
        setFormData={setFormData}
        allOwners={ownersList}
        allLeads={leadsList}
        onLeadSelect={handleLeadSelect}
      />
    </div>
  );
}
