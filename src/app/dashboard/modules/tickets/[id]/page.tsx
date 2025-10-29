"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import InfoCard from "@/components/ui/Card";
import EntityInfoCard from "@/components/crm/EntityInfoCard";
import CRMTabHeader from "@/components/crm/CRMTabHeader";
import ActivityDetailView from "@/components/crm/ActivityDetailView";
import AttachmentView from "@/components/crm/AttachmentView";
import DetailHeader from "@/components/crm/DetailHeader";
import NoteModal from "@/components/modal/FormModals/NoteModal";
import EmailModal from "@/components/modal/FormModals/EmailModal";
import CallModal from "@/components/modal/FormModals/CallModal";
import TaskModal from "@/components/modal/FormModals/TaskModal";
import MeetingModal from "@/components/modal/FormModals/MeetingModal";
import { notify } from "@/components/ui/toast/Notify";
import { formatActivityDate, formatDisplayDateTime } from "@/app/lib/date";
import ActivitySummaryView from "@/components/crm/ActivitySummaryView";
import { AISummaryCard } from "@/components/ai/AISummaryCard";
import { calculateDuration, getAttendeeCount } from "@/app/lib/utils";
import { ActivityItem } from "@/components/crm/ActivitySummaryView";
import { getCurrentUserName } from "@/app/lib/auth";

type ActivityType = "note" | "call" | "task" | "email" | "meeting";

type Activity = {
  id: number;
  type: ActivityType;
  title: string;
  author: string;
  date: string;
  dueDate?: string;
  description?: string;
  content?: string;
  overdue?: boolean;
  extra?: Record<string, any>;
};

export default function TicketDetailPage() {
  const { id } = useParams();

  const [ticket, setTicket] = useState<any>(null);
  const [editableTicket, setEditableTicket] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<ActivityType | "activity">(
    "activity"
  );
  const [showModal, setShowModal] = useState<Record<ActivityType, boolean>>({
    note: false,
    call: false,
    task: false,
    email: false,
    meeting: false,
  });
  const [cardKey, setCardKey] = useState(0);
  const [searchValue, setSearchValue] = useState("");

  const getTicketOwnerName = () => {
    if (!ticket?.owner) return "Unknown";
    return Array.isArray(ticket.owner) ? ticket.owner.join(", ") : ticket.owner;
  };

  const currentUserName = getCurrentUserName();

  useEffect(() => {
    const storedTickets = localStorage.getItem("tickets");
    if (storedTickets) {
      const tickets = JSON.parse(storedTickets);
      const found = tickets.find((t: any) => String(t.id) === String(id));
      if (found) {
        const editableData = {
          ...found,
          owner: Array.isArray(found.owner)
            ? found.owner
            : [found.owner].filter(Boolean),
        };
        setTicket(found);
        setEditableTicket(editableData);
      }
    }
  }, [id]);

  useEffect(() => {
    const handleTicketUpdate = () => {
      const storedTickets = localStorage.getItem("tickets");
      if (storedTickets) {
        const tickets = JSON.parse(storedTickets);
        const found = tickets.find((t: any) => String(t.id) === String(id));
        if (found) {
          const editableData = {
            ...found,
            owner: Array.isArray(found.owner)
              ? found.owner
              : [found.owner].filter(Boolean),
          };
          setTicket(found);
          setEditableTicket(editableData);
        }
      }
    };

    window.addEventListener("ticketsUpdated", handleTicketUpdate);
    return () =>
      window.removeEventListener("ticketsUpdated", handleTicketUpdate);
  }, [id]);

  useEffect(() => {
    if (ticket?.status) {
      setCardKey((prev) => prev + 1);
    }
  }, [ticket?.status]);

  useEffect(() => {
    if (ticket?.id) {
      localStorage.removeItem(`crm_tickets_${ticket.id}`);
    }
  }, [ticket?.id]);

  const simpleActivities: ActivityItem[] = useMemo(() => {
    const now = new Date();
    const ticketCreatedDate = ticket?.createdDate
      ? new Date(ticket.createdDate)
      : now;

    const allActivities = [
      {
        id: 1,
        type: "note" as const,
        title: "Ticket activity",
        author: currentUserName,
        date: now.toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        description: `${currentUserName} moved ticket to ${
          ticket?.status || "New"
        } status`,
        content: `${currentUserName} moved ticket to ${
          ticket?.status || "New"
        } status`,
        dueDate: now.toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      },
      {
        id: 2,
        type: "note" as const,
        title: `The ticket was created by ${currentUserName}`,
        author: currentUserName,
        date: ticketCreatedDate.toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        description: ticketCreatedDate.toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        content: ticketCreatedDate.toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        dueDate: ticketCreatedDate.toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      },

      ...activities.map((activity) => ({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        author: activity.author,
        date: activity.date,
        description: activity.description || activity.content || "",
        dueDate: activity.date,
        content: activity.content,
        extra: activity.extra,
      })),
    ];

    return allActivities.sort((a, b) => {
      if (a.id === 1 && b.id === 2) return -1;
      if (a.id === 2 && b.id === 1) return 1;

      const parseDate = (dateStr: string): number => {
        if (!dateStr || dateStr === "No Date") return 0;

        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          return parsed.getTime();
        }

        return 0;
      };

      return parseDate(b.date || "") - parseDate(a.date || "");
    });
  }, [ticket?.owner, ticket?.status, ticket?.createdDate, activities]);

  const statusOptions = [
    "New",
    "Closed",
    "Waiting on us",
    "Waiting on contact",
  ];

  const priorityOptions = ["Low", "Medium", "High", "Critical"];

  const sourceOptions = ["Email", "Phone", "Chat", "Web"];

  const ownerOptions = [
    "Maria johnson",
    "Shifa",
    "Mizba",
    "Sabira",
    "Shaima",
    "Greeshma",
  ];

  const toggleModal = (type: ActivityType, open: boolean) => {
    setShowModal((prev) => ({ ...prev, [type]: open }));
  };

  const handleSaveActivity = (type: ActivityType, data: any): boolean => {
    let title = "";
    let content = "";
    let extra: Record<string, any> = {};

    switch (type) {
      case "note":
        title = `Note by ${currentUserName}`;
        content = data;
        break;

      case "email":
        title = `Logged Email – ${
          data?.subject || "No Subject"
        } by ${currentUserName}`;
        content = data?.body || "Email sent successfully";
        break;

      case "call":
        title = `Call from ${currentUserName}`;
        content = data?.note || data?.summary;
        break;

      case "task":
        title = `Task assigned to ${data?.assignedTo}`;
        content = data?.note || "";
        extra = {
          priority: data?.priority || "-",
          taskType: data?.type || "-",
        };
        break;
      case "meeting":
        const attendees = data?.attendees || [];
        const attendeeNames = Array.isArray(attendees)
          ? // ? attendees.join(" and ")
            attendees.join(", ")
          : attendees;
        const organizer = currentUserName || "User";

        // Count the number of owners (could be multiple)
        const ownerCount = ticket?.owner
          ? Array.isArray(ticket.owner)
            ? ticket.owner.length
            : 1
          : 1;

        title = `Meeting with ${currentUserName},${getTicketOwnerName()},${
          attendeeNames || "Client"
        }`;
        content = data?.note || "";
        extra = {
          duration:
            data?.duration || calculateDuration(data.startTime, data.endTime),

          attendees: getAttendeeCount(attendees, ownerCount) + 1,
          organizer,
        };

        break;
    }

    const newActivity: Activity = {
      id: Date.now(),
      type,
      title,
      author: currentUserName,
      date: formatActivityDate(new Date()),
      dueDate: formatActivityDate(new Date()),
      description: content,
      content,
      extra,
    };

    setActivities((prev) => [newActivity, ...prev]);
    setActiveTab("activity");
    toggleModal(type, false);
    notify(
      `${type.charAt(0).toUpperCase() + type.slice(1)} added successfully`,
      "success"
    );
    return true;
  };

  const handleSaveTicket = () => {
    try {
      const updatedTicket = {
        ...editableTicket,

        owner: Array.isArray(editableTicket.owner)
          ? editableTicket.owner
          : [editableTicket.owner].filter(Boolean),
      };

      setTicket(updatedTicket);
      const storedTickets = localStorage.getItem("tickets");
      if (storedTickets) {
        const tickets = JSON.parse(storedTickets);
        const updatedTickets = tickets.map((t: any) =>
          String(t.id) === String(id) ? updatedTicket : t
        );
        localStorage.setItem("tickets", JSON.stringify(updatedTickets));

        window.dispatchEvent(new CustomEvent("ticketsUpdated"));
      }
      setIsEditing(false);
      notify("Ticket details updated successfully", "success");
    } catch (error) {
      console.error("Failed to update ticket:", error);
      notify("Failed to save changes", "error");
    }
  };

  if (!ticket)
    return (
      <div className="p-8 text-center text-gray-600">
        <p>Ticket details loading...</p>
      </div>
    );

  const aboutFields = [
    {
      label: "Ticket Name",
      value: editableTicket?.name,
      isEditable: true,
      onChange: (val: string | string[]) =>
        setEditableTicket((p: any) => ({ ...p, name: val })),
    },
    {
      label: "Description",
      value: editableTicket?.description,
      isEditable: true,
      onChange: (val: string | string[]) =>
        setEditableTicket((p: any) => ({ ...p, description: val })),
    },
    {
      label: "Status",
      value: editableTicket?.status,
      isEditable: true,
      options: statusOptions,
      onChange: (val: string | string[]) =>
        setEditableTicket((p: any) => ({ ...p, status: val })),
    },
    {
      label: "Priority",
      value: editableTicket?.priority,
      isEditable: true,
      options: priorityOptions,
      onChange: (val: string | string[]) =>
        setEditableTicket((p: any) => ({ ...p, priority: val })),
    },
    {
      label: "Source",
      value: editableTicket?.source,
      isEditable: true,
      options: sourceOptions,
      onChange: (val: string | string[]) =>
        setEditableTicket((p: any) => ({ ...p, source: val })),
    },
    {
      label: "Owner",
      value: editableTicket?.owner,
      isEditable: true,
      options: ownerOptions,
      variant: "multiselect" as const,
      onChange: (val: string | string[]) =>
        setEditableTicket((p: any) => ({ ...p, owner: val })),
    },
    {
      label: "Created Date",
      value: editableTicket?.createdDate
        ? formatDisplayDateTime(editableTicket.createdDate)
        : "-",
      isEditable: false,
    },
  ];

  const getFilteredActivities = (type: ActivityType) =>
    activities.filter((a) => a.type === type);

  return (
    <div className="p-0 bg-white rounded-md min-h-full overflow-y-auto flex gap-6">
      <div className="w-[280px] space-y-4 ml-0 mt-2">
        <InfoCard
          key={`ticket-card-${ticket.id}-${cardKey}`}
          module="tickets"
          title={ticket.name}
          subtitle={`${ticket.description} • Created: ${formatDisplayDateTime(
            ticket.createdDate
          )}`}
          status={ticket.status}
          id={ticket.id}
          onUpdate={(field, value) => {
            if (field === "status") {
              setTicket((prev: any) => ({ ...prev, status: value }));
              setEditableTicket((prev: any) => ({ ...prev, status: value }));

              const storedTickets = localStorage.getItem("tickets");
              if (storedTickets) {
                const tickets = JSON.parse(storedTickets);
                const updatedTickets = tickets.map((t: any) =>
                  String(t.id) === String(id) ? { ...t, status: value } : t
                );
                localStorage.setItem("tickets", JSON.stringify(updatedTickets));

                window.dispatchEvent(new CustomEvent("ticketsUpdated"));
              }
            }
          }}
          onNoteClick={() => toggleModal("note", true)}
          onEmailClick={() => toggleModal("email", true)}
          onCallClick={() => toggleModal("call", true)}
          onTaskClick={() => toggleModal("task", true)}
          onMeetingClick={() => toggleModal("meeting", true)}
        />

        <EntityInfoCard
          title="About this ticket"
          fields={aboutFields}
          isEditing={isEditing}
          onEdit={() => setIsEditing(true)}
          onSave={handleSaveTicket}
          onCancel={() => {
            setEditableTicket(ticket);
            setIsEditing(false);
          }}
        />
      </div>

      <div className="flex-1 bg-white p-4 mt-2">
        <DetailHeader
          searchValue={searchValue}
          onSearchChange={(e) => setSearchValue(e.target.value)}
        />
        <CRMTabHeader
          value={activeTab}
          onChange={(tab) => setActiveTab(tab)}
          renderPanel={(tab, label) => {
            if (tab === "activity") {
              return (
                <ActivitySummaryView
                  heading="Upcoming"
                  activities={simpleActivities}
                />
              );
            }
            return (
              <ActivityDetailView
                sectionTitle={label}
                buttonLabel={`Create ${label.slice(0, -1)}`}
                activities={getFilteredActivities(tab as ActivityType)}
                onCreate={() => toggleModal(tab as ActivityType, true)}
              />
            );
          }}
        />
      </div>

      <div className="w-[280px] space-y-3 mt-5 mr-4">
        <AISummaryCard
          type="ticket"
          message={`The ticket titled "${ticket.name}" currently has no associated conversation, call, or note transcripts. There are no additional details or properties available for this ticket at this time.`}
          className="border border-indigo-700"
        />

        <AttachmentView
          attachments={attachments}
          onAdd={(file, previewUrl) => {
            const newAttachment = {
              id: Date.now(),
              name: file.name,
              uploadedAt: new Date().toLocaleString(),
              previewUrl,
              type: file.type,
            };
            setAttachments((prev) => [...prev, newAttachment]);
          }}
          onRemove={(id) =>
            setAttachments((prev) => prev.filter((a) => a.id !== id))
          }
        />
      </div>

      <NoteModal
        isOpen={showModal.note}
        onClose={() => toggleModal("note", false)}
        onSave={(data) => handleSaveActivity("note", data)}
      />
      <EmailModal
        isOpen={showModal.email}
        onClose={() => toggleModal("email", false)}
        onSend={(data) => {
          handleSaveActivity("email", data);
          return true;
        }}
      />
      <CallModal
        isOpen={showModal.call}
        onClose={() => toggleModal("call", false)}
        onSave={(data) => handleSaveActivity("call", data)}
        connectedPerson={`${ticket.name}`}
      />
      <TaskModal
        isOpen={showModal.task}
        onClose={() => toggleModal("task", false)}
        onSave={(data) => handleSaveActivity("task", data)}
      />
      <MeetingModal
        isOpen={showModal.meeting}
        onClose={() => toggleModal("meeting", false)}
        onSave={(data) => handleSaveActivity("meeting", data)}
      />
    </div>
  );
}
