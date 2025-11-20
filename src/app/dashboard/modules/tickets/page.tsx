
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import HeaderBar from "@/components/crm/EntityList";
import TableLayout, {
  TableRow,
  TableCell,
} from "@/components/crm/table/TableLayout";
import ActionButtons from "@/components/crm/table/EntityDetailHeader";
import TicketCreateButton from "./components/TicketCreateButton";
import { notify } from "@/components/ui/toast/Notify";
import { formatDisplayDateTime } from "@/app/lib/date";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchTickets,
  createTicket,
  updateTicket,
  deleteTicket,
  type Ticket,
} from "@/store/slices/ticketsSlice";

const ITEMS_PER_PAGE = 10;

const ticketFiltersStatic = [
  {
    label: "Ticket Status",
    options: ["New", "Closed", "Waiting on us", "Waiting on Contact"],
  },
  { label: "Source", options: ["Chat", "Email", "Phone"] },
  { label: "Priority", options: ["Low", "Medium", "High", "Critical"] },
];

export default function TicketsPage() {
  const dispatch = useAppDispatch();
  const ticketsState = useAppSelector((state) => state.tickets);
  const { tickets = [], loading = false, error = null } = ticketsState || {};

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const [activeFilters, setActiveFilters] = useState({
    "Ticket Owner": "",
    "Ticket Status": "",
    Source: "",
    Priority: "",
    Date: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [ownerOptions, setOwnerOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [companyOptions, setCompanyOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [dealOptions, setDealOptions] = useState<Array<{ label: string; value: string }>>([]);

  
  useEffect(() => {
    const run = async () => {
      const filters: any = {
        page: currentPage,
        size: ITEMS_PER_PAGE,
      };
  
      if (searchTerm) {
        filters.search = searchTerm;
      }
  
      if (activeFilters["Ticket Status"]) {
        filters.status = activeFilters["Ticket Status"];
      }
  
      if (activeFilters["Ticket Owner"]) {
        
        const ids = await mapOwnerNamesToUserIds([activeFilters["Ticket Owner"]]);
        if (ids.length > 0) {
          filters.owner = String(ids[0]);
        }
      }
  
      if (activeFilters["Source"]) {
        filters.source = activeFilters["Source"];
      }
  
      if (activeFilters["Priority"]) {
        filters.priority = activeFilters["Priority"];
      }
  
      if (activeFilters["Date"]) {
        filters.date = activeFilters["Date"].trim();
      }

      dispatch(fetchTickets(filters)).catch((err) => {
        console.error("Error fetching tickets:", err);
      });
    };

    run();
  }, [dispatch, currentPage, searchTerm, activeFilters]);

  const columns = [
    { key: "checkbox", label: "" },
    { key: "name", label: "TICKET NAME" },
    { key: "status", label: "TICKET STATUS" },
    { key: "priority", label: "PRIORITY" },
    { key: "source", label: "SOURCE" },
    { key: "owner", label: "TICKET OWNER" },
    { key: "createdDate", label: "CREATED DATE" },
    { key: "actions", label: "ACTIONS" },
  ];

  
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) {
      headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }
    return headers;
  };

  
  useEffect(() => {
    const fetchAllData = async () => {
      const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
      
      if (!BASE_URL || !token) return;

      const headers = getAuthHeaders();

      
      try {
        const usersRes = await fetch(`${BASE_URL}/api/auth/users`, { headers });
        if (usersRes.ok) {
          const data = await usersRes.json();
          const users = data.data || data || [];
          if (Array.isArray(users) && users.length > 0) {
            const options = users.map((user: any) => {
              const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
              return {
                label: fullName || user.email || `User ${user.id}`,
                value: fullName || user.email || `User ${user.id}`,
              };
            });
            setOwnerOptions(options);
          }
        } else {
          
          if (usersRes.status === 403) {
            console.warn("Access denied: User list requires admin privileges. Using current user as fallback.");
            
            try {
              const authUserRaw = localStorage.getItem("auth_user");
              if (authUserRaw) {
                const authUser = JSON.parse(authUserRaw);
                const fullName = `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim();
                if (fullName || authUser.email) {
                  setOwnerOptions([{
                    label: fullName || authUser.email || `User ${authUser.id}`,
                    value: fullName || authUser.email || `User ${authUser.id}`,
                  }]);
                }
              }
            } catch (fallbackError) {
              console.error("Error getting current user from localStorage:", fallbackError);
            }
          } else {
            console.error("Failed to fetch users:", usersRes.status, usersRes.statusText);
          }
        }
      } catch (error) {
        console.error("Error fetching users:", error);
       
        try {
          const authUserRaw = localStorage.getItem("auth_user");
          if (authUserRaw) {
            const authUser = JSON.parse(authUserRaw);
            const fullName = `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim();
            if (fullName || authUser.email) {
              setOwnerOptions([{
                label: fullName || authUser.email || `User ${authUser.id}`,
                value: fullName || authUser.email || `User ${authUser.id}`,
              }]);
            }
          }
        } catch (fallbackError) {
          console.error("Error getting current user from localStorage:", fallbackError);
        }
      }

      
      try {
        const companiesRes = await fetch(`${BASE_URL}/api/v1/companies`, { headers });
        if (companiesRes.ok) {
          const data = await companiesRes.json();
          const companies = data.data || data || [];
          
          const nameCountMap = new Map<string, number>();
          if (Array.isArray(companies) && companies.length > 0) {
            companies.forEach((company: any) => {
              const companyName = company.companyName || `Company ${company.id}`;
              nameCountMap.set(companyName, (nameCountMap.get(companyName) || 0) + 1);
            });
          }
          
          const options = [
            { label: "Choose", value: "" }, 
            ...(Array.isArray(companies) && companies.length > 0
              ? companies.map((company: any) => {
                  const companyName = company.companyName || `Company ${company.id}`;
                  
                  const isDuplicate = (nameCountMap.get(companyName) || 0) > 1;
                  const uniqueValue = isDuplicate && company.id 
                    ? `${companyName} (ID: ${company.id})` 
                    : companyName;
                  return {
                    label: companyName,
                    value: uniqueValue,
                  };
                })
              : []),
          ];
          setCompanyOptions(options);
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
      
        setCompanyOptions([{ label: "Choose", value: "" }]);
      }

      
      try {
        const dealsRes = await fetch(`${BASE_URL}/api/v1/deal`, { headers });
        if (dealsRes.ok) {
          const data = await dealsRes.json();
          const deals = data.data || data || [];
          
          const nameCountMap = new Map<string, number>();
          if (Array.isArray(deals) && deals.length > 0) {
            deals.forEach((deal: any) => {
              const dealName = deal.dealName || deal.name || `Deal ${deal.id}`;
              nameCountMap.set(dealName, (nameCountMap.get(dealName) || 0) + 1);
            });
          }
        
          const options = [
            { label: "Choose", value: "" }, 
            ...(Array.isArray(deals) && deals.length > 0
              ? deals.map((deal: any) => {
                  const dealName = deal.dealName || deal.name || `Deal ${deal.id}`;
                
                  const isDuplicate = (nameCountMap.get(dealName) || 0) > 1;
                  const uniqueValue = isDuplicate && deal.id 
                    ? `${dealName} (ID: ${deal.id})` 
                    : dealName;
                  return {
                    label: dealName,
                    value: uniqueValue,
                  };
                })
              : []),
          ];
          setDealOptions(options);
        }
      } catch (error) {
        console.error("Error fetching deals:", error);
      
        setDealOptions([{ label: "Choose", value: "" }]);
      }
    };

    fetchAllData();
  }, []);

  const fetchCompanyByName = async (companyName: string): Promise<number | null> => {
    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!BASE_URL) return null;

    try {
      const res = await fetch(
        `${BASE_URL}/api/v1/companies?search=${encodeURIComponent(companyName.trim())}`,
        { headers: getAuthHeaders() }
      );
      
      if (res.ok) {
        const data = await res.json();
        const companies = data.data || data || [];
        const company = companies.find((c: any) => 
          c.companyName?.trim().toLowerCase() === companyName.trim().toLowerCase()
        );
        return company?.id || null;
      }
    } catch (error) {
      console.error("Error fetching company:", error);
    }
    return null;
  };

  const fetchDealByName = async (dealName: string): Promise<number | null> => {
    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!BASE_URL) return null;

    try {
      
      let res = await fetch(
        `${BASE_URL}/api/v1/deal?search=${encodeURIComponent(dealName.trim())}`,
        { headers: getAuthHeaders() }
      );

      let deals: any[] = [];
      if (res.ok) {
        const data = await res.json();
        deals = data.data || data || [];
      } else if (res.status !== 404) {
      
        res = await fetch(`${BASE_URL}/api/v1/deal`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          deals = data.data || data || [];
        }
      }

      
      if (deals.length > 0) {
        const normalizedSearch = dealName.trim().toLowerCase();
        const deal = deals.find((d: any) => {
          const nameField = d.dealName || d.name || d.DealName || "";
          return nameField.trim().toLowerCase() === normalizedSearch;
        });
        return deal?.id || null;
      }
    } catch (error) {
      console.error("Error fetching deal:", error);
    }
    return null;
  };

  
  const mapOwnerNamesToUserIds = async (ownerNames: string[]): Promise<number[]> => {
    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!BASE_URL || ownerNames.length === 0) return [];

    try {
      const res = await fetch(`${BASE_URL}/api/auth/users`, { headers: getAuthHeaders() });
      
      if (res.ok) {
        const data = await res.json();
        const users = data.data || data || [];
        
        if (Array.isArray(users) && users.length > 0) {
          
          const userIds: number[] = [];
          
          for (const ownerName of ownerNames) {
            
            const nameParts = ownerName.trim().split(/\s+/);
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ") || "";
            
            
            const user = users.find((u: any) => {
              const userFirstName = (u.firstName || "").trim().toLowerCase();
              const userLastName = (u.lastName || "").trim().toLowerCase();
              return (
                userFirstName === firstName.toLowerCase() &&
                userLastName === lastName.toLowerCase()
              );
            });
            
            if (user?.id) {
              userIds.push(user.id);
            } else {
              console.warn(`User not found for owner name: "${ownerName}"`);
            }
          }
          
          return userIds;
        }
      } else {
        if (res.status === 403) {
          console.warn("Access denied: User list requires admin privileges for mapping owner names");
        } else {
          console.error("Failed to fetch users:", res.status, res.statusText);
        }
      }
    } catch (error) {
      console.error("Error mapping owner names to user IDs:", error);
    }
    
    return [];
  };

  const handleCreateTicket = async (
    ticketData: Omit<Ticket, "id" | "createdDate" | "TicketName" | "owners" | "createdAt" | "deal" | "company" | "associatedLeadId">
  ) => {
    try {
      // Convert frontend format to backend format
      const backendData: any = {
        TicketName: ticketData.name,
        description: ticketData.description,
        TicketStatus: ticketData.status,
        priority: ticketData.priority,
        source: ticketData.source,
      };

      let hasCompanyOrDeal = false;

      
      if (ticketData.companyName && ticketData.companyName.trim()) {
        try {
          
          let companyNameTrimmed = ticketData.companyName.trim();
          const idMatch = companyNameTrimmed.match(/^(.+)\s+\(ID:\s*(\d+)\)$/);
          if (idMatch) {
            companyNameTrimmed = idMatch[1].trim(); 
          }
          let companyId: number | null = null;

          
          console.log("Fetching company from backend API:", companyNameTrimmed);
          companyId = await fetchCompanyByName(companyNameTrimmed);
          
          
          if (!companyId) {
            console.log("Company not found in API, trying localStorage cache...");
            const companies = JSON.parse(localStorage.getItem("companies") || "[]");
            const company = companies.find((c: any) => 
              c.companyName && c.companyName.trim().toLowerCase() === companyNameTrimmed.toLowerCase()
            );
            
            if (company?.id) {
              companyId = company.id;
              console.log("Found company in localStorage cache:", company.companyName, "ID:", company.id);
            }
          }
          
          
          if (!companyId) {
            const parsedId = parseInt(companyNameTrimmed);
            if (!isNaN(parsedId)) {
              companyId = parsedId;
              console.log("Using company ID directly (assuming ID was entered):", companyId);
            }
          }
          
          if (companyId) {
            backendData.companyId = companyId;
            hasCompanyOrDeal = true;
          } else {
            console.warn("Company not found in API or localStorage:", companyNameTrimmed);
          }
        } catch (error) {
          console.error("Error finding company:", error);
        }
      }

      if (!hasCompanyOrDeal && ticketData.dealName && ticketData.dealName.trim()) {
        try {
          
          let dealNameTrimmed = ticketData.dealName.trim();
          const idMatch = dealNameTrimmed.match(/^(.+)\s+\(ID:\s*(\d+)\)$/);
          if (idMatch) {
            dealNameTrimmed = idMatch[1].trim(); 
          }
          let dealId: number | null = null;

          
          console.log("Fetching deal from backend API:", dealNameTrimmed);
          dealId = await fetchDealByName(dealNameTrimmed);
          
          
          if (!dealId) {
            const parsedId = parseInt(dealNameTrimmed);
            if (!isNaN(parsedId)) {
              dealId = parsedId;
              console.log("Using deal ID directly (assuming ID was entered):", dealId);
            }
          }
          
          if (dealId) {
            backendData.dealId = dealId;
            hasCompanyOrDeal = true;
          } else {
            console.warn("Deal not found in API or localStorage:", dealNameTrimmed);
          }
        } catch (error) {
          console.error("Error finding deal:", error);
        }
      }

      
      if (!hasCompanyOrDeal) {
        const errorMsg = ticketData.companyName || ticketData.dealName
          ? `❌ ${ticketData.companyName ? 'Company' : 'Deal'} "${ticketData.companyName || ticketData.dealName}" not found. Please select a valid ${ticketData.companyName ? 'Company' : 'Deal'}.`
          : "❌ Please select either a Company or Deal for this ticket";
        notify(errorMsg, "error");
        return false;
      }

      
      if (ticketData.owner && Array.isArray(ticketData.owner) && ticketData.owner.length > 0) {
        const userIds = await mapOwnerNamesToUserIds(ticketData.owner);
        backendData.userIds = userIds;
      }

      console.log("Sending ticket data to backend:", backendData);

      const result = await dispatch(createTicket(backendData));
      
      if (createTicket.fulfilled.match(result)) {
    notify("✅ Ticket created successfully", "success");
        setIsModalOpen(false);
        
        dispatch(fetchTickets({ page: currentPage, size: ITEMS_PER_PAGE }));
    return true;
      } else {
      
        const errorPayload = result.payload as any;
        let errorMsg = "❌ Failed to create ticket";
        
        if (typeof errorPayload === "string") {
          errorMsg = errorPayload;
        } else if (errorPayload?.message) {
          errorMsg = errorPayload.message;
        } else if (errorPayload?.error) {
          errorMsg = errorPayload.error;
        }
        
        console.error("Create ticket failed:", errorPayload);
        notify(errorMsg, "error");
        return false;
      }
    } catch (error: any) {
      console.error("Create ticket error:", error);
      const errorMessage = error?.message || error?.error || "❌ Failed to create ticket";
      notify(errorMessage, "error");
      return false;
    }
  };

  const handleUpdateTicket = async (
    ticketData: Omit<Ticket, "id" | "createdDate" | "TicketName" | "owners" | "createdAt" | "deal" | "company" | "associatedLeadId">
  ) => {
    if (!editingTicket) return false;

    try {
      const backendData: any = {
        TicketName: ticketData.name,
        description: ticketData.description,
        TicketStatus: ticketData.status,
        priority: ticketData.priority,
        source: ticketData.source,
      };

      let hasCompanyOrDeal = false;

      
      if (ticketData.companyName && ticketData.companyName.trim()) {
        try {
          
          let companyNameTrimmed = ticketData.companyName.trim();
          const idMatch = companyNameTrimmed.match(/^(.+)\s+\(ID:\s*(\d+)\)$/);
          if (idMatch) {
            companyNameTrimmed = idMatch[1].trim(); 
          }
          let companyId: number | null = null;

          
          console.log("Fetching company from backend API for update:", companyNameTrimmed);
          companyId = await fetchCompanyByName(companyNameTrimmed);
          
          
          if (!companyId) {
            console.log("Company not found in API, trying localStorage cache for update...");
            const companies = JSON.parse(localStorage.getItem("companies") || "[]");
            const company = companies.find((c: any) => 
              c.companyName && c.companyName.trim().toLowerCase() === companyNameTrimmed.toLowerCase()
            );
            
            if (company?.id) {
              companyId = company.id;
              console.log("Found company in localStorage cache for update:", company.companyName, "ID:", company.id);
            }
          }
          
          
          if (!companyId) {
            const parsedId = parseInt(companyNameTrimmed);
            if (!isNaN(parsedId)) {
              companyId = parsedId;
              console.log("Using company ID directly for update (assuming ID was entered):", companyId);
            }
          }
          
          if (companyId) {
            backendData.companyId = companyId;
            backendData.dealId = null;
            hasCompanyOrDeal = true;
          }
        } catch (error) {
          console.error("Error finding company for update:", error);
        }
      } else if (ticketData.dealName && ticketData.dealName.trim()) {
        try {
          
          let dealNameTrimmed = ticketData.dealName.trim();
          const idMatch = dealNameTrimmed.match(/^(.+)\s+\(ID:\s*(\d+)\)$/);
          if (idMatch) {
            dealNameTrimmed = idMatch[1].trim();
          }
          let dealId: number | null = null;

          
          console.log("Fetching deal from backend API for update:", dealNameTrimmed);
          dealId = await fetchDealByName(dealNameTrimmed);
          
          
          if (!dealId) {
            const parsedId = parseInt(dealNameTrimmed);
            if (!isNaN(parsedId)) {
              dealId = parsedId;
              console.log("Using deal ID directly for update (assuming ID was entered):", dealId);
            }
          }
          
          if (dealId) {
            backendData.dealId = dealId;
            backendData.companyId = null;
            hasCompanyOrDeal = true;
          }
        } catch (error) {
          console.error("Error finding deal for update:", error);
        }
      } else {
        
        hasCompanyOrDeal = true; 
      }

      
      if (!hasCompanyOrDeal && (ticketData.companyName || ticketData.dealName)) {
        const errorMsg = ticketData.companyName || ticketData.dealName
          ? `❌ ${ticketData.companyName ? 'Company' : 'Deal'} "${ticketData.companyName || ticketData.dealName}" not found. Please select a valid ${ticketData.companyName ? 'Company' : 'Deal'}.`
          : "❌ Please select either a Company or Deal for this ticket";
        notify(errorMsg, "error");
        return false;
      }

      
      if (ticketData.owner && Array.isArray(ticketData.owner) && ticketData.owner.length > 0) {
        const userIds = await mapOwnerNamesToUserIds(ticketData.owner);
        backendData.userIds = userIds;
      }

      console.log("Sending update ticket data to backend:", backendData);

      const result = await dispatch(
        updateTicket({ id: editingTicket.id, ticketData: backendData })
      );

      if (updateTicket.fulfilled.match(result)) {
        notify("✏️ Ticket updated successfully", "success");
        setIsEditModalOpen(false);
        setEditingTicket(null);
        
        dispatch(fetchTickets({ page: currentPage, size: ITEMS_PER_PAGE }));
        return true;
      } else {
        
        const errorPayload = result.payload as any;
        let errorMsg = "❌ Failed to update ticket";
        
        if (typeof errorPayload === "string") {
          errorMsg = errorPayload;
        } else if (errorPayload?.message) {
          errorMsg = errorPayload.message;
        } else if (errorPayload?.error) {
          errorMsg = errorPayload.error;
        }
        
        console.error("Update ticket failed:", errorPayload);
        notify(errorMsg, "error");
        return false;
      }
    } catch (error: any) {
      console.error("Update ticket error:", error);
      const errorMessage = error?.message || error?.error || "❌ Failed to update ticket";
      notify(errorMessage, "error");
      return false;
    }
  };

  const handleDelete = async (ticket: Ticket) => {
    try {
      const result = await dispatch(deleteTicket(ticket.id));
      
      if (deleteTicket.fulfilled.match(result)) {
    notify("🗑️ Ticket deleted successfully", "success");
      } else {
        notify(result.payload as string || "❌ Failed to delete ticket", "error");
      }
    } catch (error: any) {
      notify(error.message || "❌ Failed to delete ticket", "error");
    }
  };

  const handleEdit = (ticket: Ticket) => {
    
    const editTicket: any = {
      ...ticket,
      name: ticket.name || ticket.TicketName,
      companyName: ticket.companyName || ticket.company?.name || "",
      dealName: ticket.dealName || ticket.deal?.name || "",
      owner: ticket.owner || (ticket.owners?.map((o) => o.name) || []),
    };
    setEditingTicket(editTicket);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTicket(null);
  };

  const statusOptions = [
    { label: "New", value: "New" },
    { label: "Closed", value: "Closed" },
    { label: "Waiting on us", value: "Waiting on us" },
    { label: "Waiting on Contact", value: "Waiting on Contact" },
  ];

  const priorityOptions = [
    { label: "Low", value: "Low" },
    { label: "Medium", value: "Medium" },
    { label: "High", value: "High" },
    { label: "Critical", value: "Critical" },
  ];

  const sourceOptions = [
    { label: "Email", value: "Email" },
    { label: "Phone", value: "Phone" },
    { label: "Chat", value: "Chat" },
  ];


  useEffect(() => {
    const handleCreateClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (target.textContent === "Create" && target.closest("button")) {
        event.preventDefault();
        event.stopPropagation();
        setIsModalOpen(true);
      }
    };

    document.addEventListener("click", handleCreateClick);
    return () => document.removeEventListener("click", handleCreateClick);
  }, []);

  
  useEffect(() => {
    if (error) {
      notify(error, "error");
    }
  }, [error]);

  
  let totalPages: number;
  
  if (ticketsState.totalCount && ticketsState.totalCount > 0) {
    
    totalPages = Math.max(1, Math.ceil(ticketsState.totalCount / ITEMS_PER_PAGE));
  } else {
    
    if (tickets.length === ITEMS_PER_PAGE) {
      
      totalPages = Math.max(currentPage + 1, currentPage);
    } else {
    
      totalPages = Math.max(1, currentPage);
    }
  }
  

  const paginatedTickets = tickets;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilters]);

  return (
    <div className="bg-white rounded-lg h-full ">
      <HeaderBar
        title="Tickets"
        onSearch={setSearchTerm}
        filters={[
          {
            label: "Ticket Owner",
            options: ownerOptions.map((o) => o.label),
          },
          ...ticketFiltersStatic,
        ]}
        onFilterChange={(name, val) => {
          setActiveFilters((prev) => ({ ...prev, [name]: val }));
        }}
        onDateChange={(date) => {
          setActiveFilters((prev) => ({ ...prev, Date: date }));
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        activeFilters={activeFilters}
        searchPlaceholder="Search phone, name, city"
      />
      <div className="px-4  pb-4">
        <TableLayout columns={columns}>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <div className="py-4 text-gray-500 text-center">
                  Loading tickets...
                </div>
              </TableCell>
            </TableRow>
          ) : paginatedTickets.length > 0 ? (
            paginatedTickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell isCheckbox>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>

                <TableCell>
                  <Link
                    href={`/dashboard/modules/tickets/${ticket.id}`}
                    className="hover:underline cursor-pointer"
                  >
                    {ticket.name || ticket.TicketName}
                  </Link>
                </TableCell>

                <TableCell>{ticket.status}</TableCell>
                <TableCell>{ticket.priority}</TableCell>
                <TableCell>{ticket.source}</TableCell>
                <TableCell>
                  {ticket.owners && ticket.owners.length > 0
                    ? ticket.owners.map((o) => o.name).join(", ")
                    : Array.isArray(ticket.owner)
                    ? ticket.owner.join(", ")
                    : ticket.owner || "-"}
                </TableCell>
                <TableCell>
                  {formatDisplayDateTime(
                    ticket.createdDate || ticket.createdAt
                  )}
                </TableCell>
                <TableCell>
                  <ActionButtons
                    item={ticket}
                    isEditing={false}
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
                  No tickets found
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableLayout>
      </div>

      <TicketCreateButton
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateTicket={handleCreateTicket}
        ownerOptions={ownerOptions}
        companyOptions={companyOptions}
        dealOptions={dealOptions}
      />

      <TicketCreateButton
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onCreateTicket={handleUpdateTicket}
        editData={editingTicket as any}
        ownerOptions={ownerOptions}
        companyOptions={companyOptions}
        dealOptions={dealOptions}
      />
    </div>
  );
}
