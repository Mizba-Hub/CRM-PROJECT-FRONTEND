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


const ITEMS_PER_PAGE = 10;   //now added
export interface Ticket {
  id: number;
  name: string;
  leadName?: string;
  companyName: string;
  description: string;
  status: string;
  priority: string;
  source: string;
  owner: string | string[];
  createdDate: string;
}

const ticketFilters = [
  {
    label: "Ticket Owner",
    options: [
      "Maria johnson",
      "Shifa",
      "Mizba",
      "Sabira",
      "Shaima",
      "Greeshma",
    ],
  },
  {
    label: "Ticket Status",
    options: ["New", "Closed", "Waiting on us", "Waiting on contact"],
  },
  { label: "Source", options: ["Chat", "Email", "Phone"] },
  { label: "Priority", options: ["Low", "Medium", "High", "Critical"] },
];

export default function TicketsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  // const totalPages = 68;                             
  const [searchTerm, setSearchTerm] = useState("");
  

  const [activeFilters, setActiveFilters] = useState({
    "Ticket Owner": "",
    "Ticket Status": "",
    Source: "",
    Priority: "",
    Date: "",
  });

  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    const storedTickets = localStorage.getItem("tickets");
    if (storedTickets) {
      try {
        const parsedTickets = JSON.parse(storedTickets);
        setTickets(parsedTickets);
      } catch (error) {
        console.error("Error parsing tickets from localStorage:", error);
        setTickets([]);
      }
    }
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

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

  const handleCreateTicket = (
    ticketData: Omit<Ticket, "id" | "createdDate">
  ) => {
    const newTicket: Ticket = {
      id: Date.now(),
      ...ticketData,
      createdDate: new Date().toISOString(),
    };
    setTickets((prev) => [newTicket, ...prev]);

    localStorage.setItem("tickets", JSON.stringify([newTicket, ...tickets]));

    window.dispatchEvent(new CustomEvent("ticketsUpdated"));
    notify("✅ Ticket created successfully", "success");
    return true;
  };

  const handleUpdateTicket = (
    ticketData: Omit<Ticket, "id" | "createdDate">
  ) => {
    if (!editingTicket) return false;

    const updatedTicket: Ticket = {
      ...editingTicket,
      ...ticketData,
    };

    setTickets((prev) =>
      prev.map((t) => (t.id === editingTicket.id ? updatedTicket : t))
    );

    const updatedTickets = tickets.map((t) =>
      t.id === editingTicket.id ? updatedTicket : t
    );
    localStorage.setItem("tickets", JSON.stringify(updatedTickets));

    window.dispatchEvent(new CustomEvent("ticketsUpdated"));

    notify("✏️ Ticket updated successfully", "success");
    return true;
  };

  const handleDelete = (ticket: Ticket) => {
    setTickets((prev) => prev.filter((t) => t.id !== ticket.id));

    const updatedTickets = tickets.filter((t) => t.id !== ticket.id);
    localStorage.setItem("tickets", JSON.stringify(updatedTickets));

    window.dispatchEvent(new CustomEvent("ticketsUpdated"));
    notify("🗑️ Ticket deleted successfully", "success");
  };

  const handleEdit = (ticket: Ticket) => {
    setEditingTicket(ticket);
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
    { label: "Waiting on contact", value: "Waiting on contact" },
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
    { label: "Web", value: "Web" },
    { label: "Chat", value: "Chat" },
  ];

  const ownerOptions = [
    { label: "Maria johnson", value: "Maria johnson" },
    { label: "Shifa", value: "Shifa" },
    { label: "Mizba", value: "Mizba" },
    { label: "Sabira", value: "Sabira" },
    { label: "Shaima", value: "Shaima" },
    { label: "Greeshma", value: "Greeshma" },
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

  const filteredTickets = tickets.filter((ticket) => {
    const ownerString = Array.isArray(ticket.owner)
      ? ticket.owner.join(" ")
      : ticket.owner;

    const matchesSearch =
      ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ownerString.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.source.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = activeFilters["Ticket Status"]
      ? ticket.status === activeFilters["Ticket Status"]
      : true;

    const matchesOwner = activeFilters["Ticket Owner"]
      ? (() => {
          if (Array.isArray(ticket.owner)) {
            return ticket.owner.includes(activeFilters["Ticket Owner"]);
          } else {
            return ticket.owner === activeFilters["Ticket Owner"];
          }
        })()
      : true;

    const matchesSource = activeFilters["Source"]
      ? ticket.source === activeFilters["Source"]
      : true;

    const matchesPriority = activeFilters["Priority"]
      ? ticket.priority === activeFilters["Priority"]
      : true;

    const matchesDate = activeFilters["Date"]
      ? (() => {
          try {
            const filterDate = new Date(activeFilters["Date"]);
            const ticketDate = new Date(ticket.createdDate);

            const filterDateOnly = new Date(
              filterDate.getFullYear(),
              filterDate.getMonth(),
              filterDate.getDate()
            );
            const ticketDateOnly = new Date(
              ticketDate.getFullYear(),
              ticketDate.getMonth(),
              ticketDate.getDate()
            );

            return filterDateOnly.getTime() === ticketDateOnly.getTime();
          } catch (error) {
            return ticket.createdDate.includes(activeFilters["Date"]);
          }
        })()
      : true;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesOwner &&
      matchesSource &&
      matchesPriority &&
      matchesDate
    );
  });




//now added

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / ITEMS_PER_PAGE) + 1);

  // 🔹 Get paginated tickets (slice the filtered tickets)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

  // 🔹 Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilters]);


  return (
    <div className="bg-white rounded-lg h-full ">
      <HeaderBar
        title="Tickets"
        onSearch={setSearchTerm}
        filters={ticketFilters}
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
          
              {paginatedTickets.length > 0 ? (          //two lines now added
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
                    onClick={() =>
                      localStorage.setItem("tickets", JSON.stringify(tickets))
                    }
                    className="hover:underline cursor-pointer"
                  >
                    {ticket.name}
                  </Link>
                </TableCell>

                <TableCell>{ticket.status}</TableCell>
                <TableCell>{ticket.priority}</TableCell>
                <TableCell>{ticket.source}</TableCell>
                <TableCell>
                  {Array.isArray(ticket.owner)
                    ? ticket.owner.join(", ")
                    : ticket.owner}
                </TableCell>
                <TableCell>
                  {formatDisplayDateTime(ticket.createdDate)}
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
      />

      <TicketCreateButton
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onCreateTicket={handleUpdateTicket}
        editData={editingTicket}
      />
    </div>
  );
}
