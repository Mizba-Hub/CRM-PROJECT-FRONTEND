"use client";

import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchLeads,
  createLeadAPI,
  updateLeadAPI,
  deleteLeadAPI,
} from "@/store/slices/leadSlice";

import HeaderBar from "@/components/crm/EntityList";
import TableLayout, {
  TableRow,
  TableCell,
} from "@/components/crm/table/TableLayout";
import ActionButtons from "@/components/crm/table/EntityDetailHeader";
import LeadModal from "./components/CreateLeadButton";
import { Inputs } from "@/components/ui/Inputs";
import { notify } from "@/components/ui/toast/Notify";
import { formatDisplayDate } from "@/app/lib/date";
import Link from "next/link";

import CSVImportModal from "@/app/dashboard/components/CsvImportButton";
import { Button } from "@mui/material";

const ITEMS_PER_PAGE = 10;

export default function LeadsPage() {
  const dispatch = useAppDispatch();
  const leads = useAppSelector((state) => state.leads.leads);
  const total = useAppSelector((state) => state.leads.total);
  const size = useAppSelector((state) => state.leads.size);
  const [users, setUsers] = useState<{ label: string; value: string }[]>([]);
  const token = useAppSelector((s) => s.auth.token);

  const [openImport, setOpenImport] = useState(false);

  const reduxUser = useAppSelector((s) => s.auth.user);

  const storedUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;

  const currentUser = reduxUser || storedUser;

  const isAdmin = currentUser?.role === "admin";
  const currentUserId = currentUser?.id?.toString();

  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(
    {}
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  useEffect(() => {}, [openImport]);

  useEffect(() => {
    dispatch(fetchLeads({ page: currentPage, size: ITEMS_PER_PAGE }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        if (!isAdmin) {
          setUsers([]);
          return;
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/users`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch users: ${res.status}`);
        }

        const data: any[] = await res.json();

        const formatted = data.map((u) => ({
          label: `${u.firstName} ${u.lastName}`,
          value: u.id.toString(),
        }));

        setUsers(formatted);
      } catch (err) {
        notify("Failed to load users", "error");
      }
    };

    if (token && isAdmin) {
      loadUsers();
    }
  }, [token, isAdmin]);

  const filteredLeads = leads.filter((lead) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(search) ||
      lead.email.toLowerCase().includes(search) ||
      lead.city?.toLowerCase().includes(search) ||
      lead.phone?.includes(search);

    const statusFilter = activeFilters["Lead Status"] || "";
    const dateFilter = activeFilters["Date"] || "";

    const matchesStatus = statusFilter
      ? (lead.leadStatus || "").toLowerCase() === statusFilter.toLowerCase()
      : true;

    const matchesDate = dateFilter
      ? new Date(lead.createdDate).toISOString().slice(0, 10) === dateFilter
      : true;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPages = Math.max(1, Math.ceil(total / size));

  const handleSaveLead = async (form: any) => {
    const userIds = isAdmin
      ? (form.contactOwner || []).map((id: string) => Number(id))
      : [Number(currentUserId)].filter(Boolean);

    const payload = {
      email: form.email,
      firstName: form.firstName,
      lastName: form.lastName,
      phoneNumber: form.phone,
      jobTitle: form.jobTitle,
      city: form.city,
      leadStatus: form.status,
      userIds: userIds,
    };

    const res: any = await dispatch(createLeadAPI(payload));
    if (res.meta.requestStatus === "fulfilled") {
      notify("Lead created successfully", "success");
      dispatch(fetchLeads({ page: 1, size: ITEMS_PER_PAGE }));
      return true;
    }
    notify("Failed to create lead", "error");
    return false;
  };

  const handleUpdateLead = async (form: any) => {
    const userIds = isAdmin
      ? (form.contactOwner || []).map((id: any) => Number(id)).filter(Boolean)
      : [Number(currentUserId)];

    const payload = {
      id: editData.id,
      updates: {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phone,
        jobTitle: form.jobTitle,
        city: form.city,
        leadStatus: form.status,
        userIds,
      },
    };

    const res: any = await dispatch(updateLeadAPI(payload));

    if (res.meta.requestStatus === "fulfilled") {
      notify("Lead updated successfully", "success");
      dispatch(fetchLeads({ page: currentPage, size: ITEMS_PER_PAGE }));
      return true;
    }

    notify("Failed to update lead", "error");
    return false;
  };

  const handleDelete = async (lead: any) => {
    const res: any = await dispatch(deleteLeadAPI(lead.id));

    if (res.meta.requestStatus === "fulfilled") {
      notify("Lead deleted successfully", "success");
      dispatch(fetchLeads({ page: currentPage, size: ITEMS_PER_PAGE }));
    } else notify("Failed to delete lead", "error");
  };

  return (
    <div className="bg-white m-2 rounded-md h-full overflow-auto">
      <HeaderBar
        title="Leads"
        searchPlaceholder="Search phone, name, email"
        onSearch={(v) => {
          setSearchTerm(v);
          setCurrentPage(1);
        }}
        filters={[
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
        ]}
        onFilterChange={(name, val) => {
          setActiveFilters((prev) => ({ ...prev, [name]: val }));
          setCurrentPage(1);
        }}
        onDateChange={(date) => {
          setActiveFilters((prev) => ({ ...prev, Date: date }));
          setCurrentPage(1);
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        activeFilters={activeFilters}
        onCreate={() => {
          setEditData(null);
          setShowModal(true);
        }}
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

      <div className="p-2">
        <TableLayout
          columns={[
            { key: "checkbox", label: "" },
            { key: "name", label: "NAME" },
            { key: "email", label: "EMAIL" },
            { key: "phone", label: "PHONE" },
            { key: "city", label: "CITY" },
            { key: "createdDate", label: "CREATED DATE" },
            { key: "status", label: "STATUS" },
            { key: "actions", label: "ACTIONS" },
          ]}
        >
          {filteredLeads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell isCheckbox>
                <Inputs type="checkbox" variant="input" />
              </TableCell>

              <TableCell>
                <Link
                  href={`/dashboard/modules/leads/${lead.id}`}
                  className="hover:underline"
                >
                  {lead.firstName} {lead.lastName}
                </Link>
              </TableCell>

              <TableCell>{lead.email}</TableCell>
              <TableCell>{lead.phone}</TableCell>
              <TableCell>{lead.city || "-"}</TableCell>
              <TableCell>{formatDisplayDate(lead.createdDate)}</TableCell>

              <TableCell>
                <span
                  className={`px-2 py-1 text-xs rounded font-medium
      ${
        lead.status === "New"
          ? "bg-blue-100 text-blue-600"
          : lead.status === "Open"
          ? "bg-green-100 text-green-600"
          : lead.status === "In Progress"
          ? "bg-yellow-100 text-yellow-700"
          : lead.status === "Contact"
          ? "bg-purple-100 text-purple-600"
          : lead.status === "Qualified"
          ? "bg-indigo-100 text-indigo-600"
          : lead.status === "Closed"
          ? "bg-red-100 text-red-600"
          : lead.status === "Converted"
          ? "bg-teal-100 text-teal-600"
          : "bg-gray-100 text-gray-600"
      }
    `}
                >
                  {lead.status}
                </span>
              </TableCell>

              <TableCell>
                <ActionButtons
                  item={lead}
                  onEdit={() => {
                    setEditData(lead);
                    setShowModal(true);
                  }}
                  onDelete={() => handleDelete(lead)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableLayout>
      </div>

      <CSVImportModal
        open={openImport}
        setOpen={setOpenImport}
        module="lead"
        onImportComplete={() => {
          dispatch(fetchLeads({ page: 1, size: ITEMS_PER_PAGE }));
        }}
      />

      <LeadModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditData(null);
        }}
        editData={editData}
        onSave={editData ? handleUpdateLead : handleSaveLead}
        users={users}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
        currentUserName={
          `${currentUser?.firstName || ""} ${
            currentUser?.lastName || ""
          }`.trim() || "You"
        }
      />
    </div>
  );
}
