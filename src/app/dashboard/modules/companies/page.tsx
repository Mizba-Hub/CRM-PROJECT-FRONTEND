"use client";

import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import Link from "next/link";
import CSVImportModal from "@/app/dashboard/components/CsvImportButton";
import { Button } from "@mui/material";

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

interface FilterOptions {
  cities: string[];
  countries: string[];
  industries: string[];
}

interface DateRange {
  start: Date | null;
  end: Date | null;
}

const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      const isoDate = new Date(dateString.replace(" ", "T"));
      if (!isNaN(isoDate.getTime())) {
        return isoDate;
      }
      return null;
    }

    return date;
  } catch {
    return null;
  }
};

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
  const [openImport, setOpenImport] = useState(false);
  const [ownersList, setOwnersList] = useState<
    { id: number; label: string; value: string }[]
  >([]);
  const [leadsList, setLeadsList] = useState<LeadDropdownOption[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    cities: [],
    countries: [],
    industries: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(
    {}
  );
  const [dateRange, setDateRange] = useState<DateRange>({
    start: null,
    end: null,
  });

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {}, [openImport]);

  const extractUniqueValues = (
    companies: Company[],
    key: keyof Company
  ): string[] => {
    const values = companies
      .map((company) => company[key])
      .filter(
        (value): value is string =>
          typeof value === "string" && value.trim() !== ""
      );

    return Array.from(new Set(values)).sort();
  };

  const isDateInRange = (
    dateString: string,
    start: Date | null,
    end: Date | null
  ): boolean => {
    if (!start && !end) return true;

    const date = parseDate(dateString);
    if (!date) return false;

    const compareDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const compareStart = start
      ? new Date(start.getFullYear(), start.getMonth(), start.getDate())
      : null;
    const compareEnd = end
      ? new Date(end.getFullYear(), end.getMonth(), end.getDate())
      : null;

    if (compareStart && compareEnd) {
      return compareDate >= compareStart && compareDate <= compareEnd;
    } else if (compareStart) {
      return compareDate >= compareStart;
    } else if (compareEnd) {
      return compareDate <= compareEnd;
    }

    return true;
  };

  const fetchFilterOptions = async () => {
    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    const token =
      localStorage.getItem("token") || localStorage.getItem("auth_token");

    if (!BASE_URL || !token) return;

    try {
      const response = await fetch(`${BASE_URL}/api/v1/companies`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token.startsWith("Bearer ")
            ? token
            : `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const companies = Array.isArray(data) ? data : data.data || [];

        const cities = extractUniqueValues(companies, "city");
        const countries = extractUniqueValues(companies, "country");
        const industries = extractUniqueValues(companies, "industryType");

        setFilterOptions({
          cities,
          countries,
          industries,
        });

        console.log("🔍 [FILTER OPTIONS] Loaded:", {
          cities: cities.length,
          countries: countries.length,
          industries: industries.length,
        });
      }
    } catch (err) {
      console.error("Failed to fetch filter options:", err);
    }
  };

  const companyFilters = [
    {
      label: "Industry Type",
      options:
        filterOptions.industries.length > 0
          ? filterOptions.industries
          : ["Technology", "Education", "Finance", "Healthcare", "Retail"],
    },
    {
      label: "City",
      options:
        filterOptions.cities.length > 0
          ? filterOptions.cities
          : ["Delhi", "Al Ain", "Sharjah", "Ajman", "Oman", "Baku"],
    },
    {
      label: "Country/Region",
      options:
        filterOptions.countries.length > 0
          ? filterOptions.countries
          : ["India", "UAE", "UK", "USA", "Canada"],
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

        const response = await fetch("http://localhost:5000/api/v1/companies", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

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
    dispatch(fetchCompanies())
      .unwrap()
      .then(() => {
        fetchFilterOptions();
      })
      .catch(console.error);
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

  useEffect(() => {
    if (list.length > 0) {
      const cities = extractUniqueValues(list, "city");
      const countries = extractUniqueValues(list, "country");
      const industries = extractUniqueValues(list, "industryType");

      setFilterOptions({
        cities,
        countries,
        industries,
      });
    }
  }, [list]);

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

      const matchesDateRange = company.createdDate
        ? isDateInRange(company.createdDate, dateRange.start, dateRange.end)
        : true;

      return matchesSearch && matchesFilters && matchesDateRange;
    });
  }, [list, searchTerm, activeFilters, dateRange]);

  const paginatedCompanies = useMemo(() => {
    console.log("🔍 [PAGINATION] Total filtered:", filteredCompanies.length);
    console.log("🔍 [PAGINATION] Current page:", currentPage);

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const result = filteredCompanies.slice(startIndex, endIndex);

    return result;
  }, [filteredCompanies, currentPage]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilters, dateRange]);

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

  const handleDateChange = (dateString: string) => {
    console.log("📅 [DATE FILTER] Date changed:", dateString);

    if (!dateString) {
      setDateRange({ start: null, end: null });
      return;
    }

    const date = parseDate(dateString);
    if (date) {
      setDateRange({ start: date, end: date });
    }
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

    dispatch(setCurrent(company));

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
      const isEditMode = currentCompany && currentCompany.id;

      if (!isEditMode) {
        console.log("🔍 [COMPANY CREATE] Creating new company...");

        const authUserRaw = localStorage.getItem("auth_user");
        const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
        const currentUserId =
          authUser?.id || authUser?.userId || authUser?.userID;

        if (!currentUserId) {
          notify("User not found. Please log in again.", "error");
          return;
        }

        const ownerObjects = (data.companyOwner as number[]).map((ownerId) => {
          const owner = ownersList.find((o) => o.id === ownerId);
          return {
            id: ownerId,
            firstName: owner?.label.split(" ")[0] ?? "",
            lastName: owner?.label.split(" ").slice(1).join(" ") ?? "",
          };
        });

        const createData = {
          domainName: data.domainName,
          companyName: data.companyName,
          companyOwner: ownerObjects,
          industryType: data.industryType,
          type: data.type,
          city: data.city,
          country: data.country,
          noOfEmployees: Number(data.noOfEmployees),
          annualRevenue: Number(data.annualRevenue),
          phoneNumber: data.phoneNumber,
          leadId: data.leadId,
        };

        await dispatch(createCompany(createData as Company)).unwrap();
        notify("Company created successfully!", "success");
      } else {
        if (!currentCompany || !currentCompany.id) {
          notify("Cannot update: no company selected", "error");
          console.error(
            "Update failed: currentCompany or company id invalid:",
            currentCompany
          );
          return;
        }

        const ownerObjects = (data.companyOwner as number[]).map((ownerId) => {
          const owner = ownersList.find((o) => o.id === ownerId);
          return {
            id: ownerId,
            firstName: owner?.label.split(" ")[0] ?? "",
            lastName: owner?.label.split(" ").slice(1).join(" ") ?? "",
          };
        });

        const updateData = {
          id: currentCompany.id,
          domainName: data.domainName,
          companyName: data.companyName,
          companyOwner: ownerObjects,
          industryType: data.industryType,
          type: data.type,
          city: data.city,
          country: data.country,
          noOfEmployees: Number(data.noOfEmployees),
          annualRevenue: Number(data.annualRevenue),
          phoneNumber: data.phoneNumber,
          leadId: data.leadId,
          createdDate: currentCompany.createdDate,
        };

        await dispatch(updateCompany(updateData as Company)).unwrap();
        notify("Company updated successfully!", "success");
      }

      await dispatch(fetchCompanies()).unwrap();
      fetchFilterOptions();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Save failed:", err);
      let message = "Failed to save company";
      if (typeof err === "string") message = err;
      else if (err instanceof Error) message = err.message;

      try {
        const jsonPart = message.substring(message.indexOf("{"));
        const parsed = JSON.parse(jsonPart);
        if (parsed?.error?.message) message = parsed.error.message;
      } catch {}

      notify(message, "error");
    }
  };

  const handleDelete = (company?: Company) => {
    if (!company?.id) return;
    dispatch(deleteCompany(company.id))
      .unwrap()
      .then(() => {
        notify("Company deleted successfully", "success");

        fetchFilterOptions();
      })
      .catch((err) => notify("Failed to delete company: " + err, "error"));
  };

  const handleImportComplete = () => {
    console.log("🔄 [IMPORT] Refreshing companies data...");

    dispatch(fetchCompanies())
      .unwrap()
      .then(() => {
        notify("Companies imported successfully!", "success");
        fetchFilterOptions();
      })
      .catch((error) => {
        console.error("Failed to refresh after import:", error);
        notify("Import completed but failed to refresh data", "error");
      });
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
        onDateChange={handleDateChange}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onCreate={handleCreate}
        extraButtons={
          <Button
            variant="outlined"
            onClick={() => setOpenImport(true)}
            sx={{
              borderColor: "#4f46e5",
              color: "#4338ca",
              textTransform: "none",
              "&:hover": {
                borderColor: "#3730a3",
                color: "#3730a3",
                backgroundColor: "rgba(67, 56, 202, 0.04)",
              },
            }}
          >
            Import
          </Button>
        }
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

      <CSVImportModal
        open={openImport}
        setOpen={setOpenImport}
        module="company"
        onImportComplete={() => {
          console.log("🔄 [IMPORT COMPLETE] Modal reported completion");

          setTimeout(() => {
            console.log("🔍 [POST-IMPORT CHECK] Current companies:", {
              count: list.length,
              companies: list.map((c) => ({ id: c.id, name: c.companyName })),
            });

            dispatch(fetchCompanies())
              .unwrap()
              .then((companies) => {
                console.log(
                  "🔍 [POST-IMPORT REFRESH] Refreshed companies:",
                  companies.length
                );

                if (companies.length === list.length) {
                  notify(
                    "CSV import failed - no new companies were created. Check console for details.",
                    "error"
                  );
                } else {
                  notify(
                    `Import successful! Added ${
                      companies.length - list.length
                    } new companies.`,
                    "success"
                  );
                }
              })
              .catch((error) => {
                console.error("❌ Refresh failed:", error);
              });
          }, 1000);
        }}
      />

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
