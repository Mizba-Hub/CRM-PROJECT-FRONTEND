"use client";

import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchDeals, createDeal, updateDeal, deleteDeal } from "@/store/slices/dealSlice";
import HeaderBar from "@/components/crm/EntityList";
import TableLayout, { TableRow, TableCell } from "@/components/crm/table/TableLayout";
import ActionButtons from "@/components/crm/table/EntityDetailHeader";
import CreateDeal from "./components/CreateDealButton";
import { notify } from "@/components/ui/toast/Notify";
import { formatDisplayDateOnly } from "@/app/lib/date";
import Link from "next/link";

const ITEMS_PER_PAGE = 10;

export default function DealsPage() {
  const dispatch = useAppDispatch();
  const { deals, loading, error } = useAppSelector((state) => state.deals);
  const { token } = useAppSelector((state) => state.auth);

  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const [users, setUsers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [associatedLead, setAssociatedLead] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const openModal = params.get("openModal");

    if (openModal === "true") {
      setShowModal(true);

      const leadData = JSON.parse(localStorage.getItem("convertLead") || "{}");
      if (leadData?.id) {
        setAssociatedLead(String(leadData.id));
      }
    }
  }, []);

  useEffect(() => {
    dispatch(fetchDeals());
  }, [dispatch]);

  /* --------------------------
      FETCH USERS
  --------------------------- */
  useEffect(() => {
    if (!token) return;

    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/users`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();
        const arr = Array.isArray(data.data ? data.data : data)
          ? (data.data ? data.data : data)
          : [];

        const formatted = arr.map((u: any) => ({
          id: u.id,
          name:
            `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
        }));

        setUsers(formatted);
      } catch {
        notify("Failed to fetch users", "error");
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [token]);

  /* --------------------------
      FETCH LEADS
  --------------------------- */
  useEffect(() => {
    if (!token) return;

    const fetchLeads = async () => {
      setLeadsLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/lead`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        setLeads(
          Array.isArray(data.data ? data.data : data)
            ? data.data || data
            : []
        );
      } catch {
        notify("Failed to fetch leads", "error");
      } finally {
        setLeadsLoading(false);
      }
    };

    fetchLeads();
  }, [token]);

  /* --------------------------
      FILTERS
  --------------------------- */
  const handleFilterChange = (name: string, value: string) => {
    setActiveFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  /* --------------------------
      SEARCH + FILTER LOGIC
  --------------------------- */
  const filteredDeals = deals.filter((deal: any) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      (deal.name || "").toLowerCase().includes(search) ||
      (deal.owner || []).some((o: string) => o.toLowerCase().includes(search)) ||
      (deal.associatedLead || "").toLowerCase().includes(search) ||
      (deal.stage || "").toLowerCase().includes(search) ||
      (deal.amount || "").toLowerCase().includes(search);

    const ownerFilter = activeFilters["Deal Owner"] || "";
    const stageFilter = activeFilters["Deal Stage"] || "";
    const closeDateFilter = activeFilters["Close Date"] || "";
    const createdDateFilter = activeFilters["Created Date"] || "";

    const matchesOwner = ownerFilter ? (deal.owner || []).includes(ownerFilter) : true;
    const matchesStage = stageFilter ? deal.stage === stageFilter : true;
    const matchesCloseDate = closeDateFilter
      ? deal.closeDate?.slice(0, 10) === closeDateFilter
      : true;
    const matchesCreatedDate = createdDateFilter
      ? deal.createdDate?.slice(0, 10) === createdDateFilter
      : true;

    return matchesSearch && matchesOwner && matchesStage && matchesCloseDate && matchesCreatedDate;
  });

  const totalPages = Math.max(1, Math.ceil(filteredDeals.length / ITEMS_PER_PAGE));
  const currentPageDeals = filteredDeals.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const ownerFilterOptions = Array.from(
    new Set(deals.flatMap((d) => d.owner || []).concat(users.map((u) => u.name)))
  )
    .filter(Boolean)
    .sort();

  const stageFilterOptions = [
    "Presentation Scheduled",
    "Qualified to Buy",
    "Contract Sent",
    "Closed Won",
    "Appointment Scheduled",
    "Decision Maker Bought In",
    "Closed Lost",
    "Negotiation",
  ];

  const dealFilters = [
    { label: "Deal Owner", options: ownerFilterOptions },
    { label: "Deal Stage", options: stageFilterOptions },
  ];

  /* --------------------------
      CREATE DEAL
  --------------------------- */
  const handleSaveDeal = async (form: any) => {
    const payload = {
      name: form.name,
      stage: form.stage,
      amount: form.amount,
      priority: form.priority,
      closeDate: form.closeDate,
      ownerIds: Array.isArray(form.owner) ? form.owner : [form.owner],
      leadId: form.associatedLead,
    };

    const res: any = await dispatch(createDeal(payload));

    if (res.meta.requestStatus === "fulfilled") {
      notify("Deal created successfully", "success");
      dispatch(fetchDeals());
      return true;
    }
    notify("Failed to create deal", "error");
    return false;
  };

  /* --------------------------
      UPDATE DEAL
  --------------------------- */
  const handleUpdateDeal = async (form: any) => {
    const dealData = {
      dealName: form.name,
      dealStage: form.stage,
      amount: form.amount,
      priority: form.priority,
      closeDate: form.closeDate,
      leadId: form.associatedLead,
      ownerIds: Array.isArray(form.owner) ? form.owner : [form.owner],
    };

    const res: any = await dispatch(
      updateDeal({
        id: editData.id,
        dealData,
      })
    );

    if (res.meta.requestStatus === "fulfilled") {
      notify("Deal updated successfully", "success");
      dispatch(fetchDeals());
      return true;
    }

    notify("Failed to update deal", "error");
    return false;
  };

  /* --------------------------
      DELETE DEAL
  --------------------------- */
  const handleDelete = async (deal: any) => {
    const res: any = await dispatch(deleteDeal(deal.id));
    if (res.meta.requestStatus === "fulfilled") {
      notify("Deal deleted successfully", "success");
      dispatch(fetchDeals());
    } else {
      notify("Failed to delete deal", "error");
    }
  };

  return (
    <div className="bg-white m-2 rounded-md h-full overflow-auto">
      <HeaderBar
        title="Deals"
        searchPlaceholder="Search deals, owners, leads, stages..."
        onSearch={(v) => {
          setSearchTerm(v);
          setCurrentPage(1);
        }}
        filters={dealFilters}
        onFilterChange={handleFilterChange}
        onDateChange={(date) => handleFilterChange("Date", date)}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        activeFilters={activeFilters}
        onCreate={() => {
          setEditData(null);
          setShowModal(true);
        }}
        isDealPage={true}
      />

      {(usersLoading || leadsLoading) && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
          <span className="text-sm text-blue-600">
            {usersLoading && "Loading users..."} {leadsLoading && "Loading leads..."}
          </span>
        </div>
      )}

      <div className="p-2">
        <TableLayout
          columns={[
            { key: "checkbox", label: "" },
            { key: "name", label: "DEAL NAME" },
            { key: "stage", label: "DEAL STAGE" },
            { key: "closeDate", label: "CLOSE DATE" },
            { key: "owner", label: "DEAL OWNER" },
            { key: "amount", label: "AMOUNT" },
            { key: "associatedlead", label: "ASSOCIATED LEAD" },
            { key: "actions", label: "ACTIONS" },
          ]}
        >
          {currentPageDeals.map((deal: any) => (
            <TableRow key={deal.id}>
              <TableCell isCheckbox>
                <input type="checkbox" className="h-4 w-4" />
              </TableCell>

              <TableCell>
                <Link
                  href={`/dashboard/modules/deals/${deal.id}`}
                  className="hover:underline"
                >
                  {deal.name}
                </Link>
              </TableCell>

              <TableCell>{deal.stage}</TableCell>
              <TableCell>{formatDisplayDateOnly(deal.closeDate)}</TableCell>
              <TableCell>{(deal.owner || []).join(", ")}</TableCell>
              <TableCell>{deal.amount}</TableCell>
              <TableCell>{deal.leadName || deal.associatedLeadName || "-"}</TableCell>

              <TableCell>
                <ActionButtons
                  item={deal}
                  onEdit={() => {
                    setEditData(deal);
                    setShowModal(true);
                  }}
                  onDelete={() => handleDelete(deal)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableLayout>
      </div>

      <CreateDeal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditData(null);
        }}
        onSave={editData ? handleUpdateDeal : handleSaveDeal}
        initialData={editData}
        mode={editData ? "edit" : "create"}
        leads={leads}
        users={users}
        associatedLead={associatedLead}
      />
    </div>
  );
}
