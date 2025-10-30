"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { notify } from "@/components/ui/toast/Notify";

import InfoCard from "@/components/ui/Card";
import EntityInfoCard from "@/components/crm/EntityInfoCard";
import CRMTabHeader from "@/components/crm/CRMTabHeader";
import ActivityDetailView from "@/components/crm/ActivityDetailView";
import AttachmentView from "@/components/crm/AttachmentView";

import NoteModal from "@/components/modal/FormModals/NoteModal";
import EmailModal from "@/components/modal/FormModals/EmailModal";
import CallModal from "@/components/modal/FormModals/CallModal";
import TaskModal from "@/components/modal/FormModals/TaskModal";
import MeetingModal from "@/components/modal/FormModals/MeetingModal";

import { formatActivityDate, formatDisplayDate } from "@/app/lib/date";
import ActivitySummaryView from "@/components/crm/ActivitySummaryView";
import { getCurrentUserName } from "@/app/lib/auth";
import { AISummaryCard } from "@/components/ai/AISummaryCard";
import { calculateDuration, getAttendeeCount } from "@/app/lib/utils";

import DetailHeader from "@/components/crm/DetailHeader";

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

export default function LeadDetailPage() {
  const { id } = useParams();

  const [lead, setLead] = useState<any>(null);
  const [editableLead, setEditableLead] = useState<any>(null);
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

  const [searchValue, setSearchValue] = useState("");
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchValue(e.target.value);

  const currentUserName = getCurrentUserName();

  useEffect(() => {
    const storedLeads = localStorage.getItem("leads");
    if (storedLeads) {
      const leads = JSON.parse(storedLeads);
      const found = leads.find((l: any) => String(l.id) === String(id));
      setLead(found);
      setEditableLead(found);
    }
  }, [id]);

  const statusOptions = ["Open", "New", "In Progress", "Closed"];

  const toggleModal = (type: ActivityType, open: boolean) => {
    setShowModal((prev) => ({ ...prev, [type]: open }));
  };

  const handleSaveActivity = (type: ActivityType, data: any): boolean => {
    let title = "";
    let content = "";
    let extra: Record<string, any> = {};

    switch (type) {
      case "note":
        title = "Note by " + currentUserName;
        content = data;
        break;

      case "email":
        title = `Logged Email – ${
          data?.subject || "No Subject"
        } by ${currentUserName}
        `;
        content = data?.body || "Email sent successfully";
        break;

      case "call":
        title = "Call from " + currentUserName;
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
          ? attendees.join(" and ")
          : attendees;

        const organizer = currentUserName || "User";
        const ownerCount = Array.isArray(lead?.contactOwner)
          ? lead.contactOwner.length
          : 1;

        title = `Meeting ${currentUserName},${lead.firstName} ${lead.lastName}  and ${attendeeNames}`;
        content = data?.note || "";

        extra = {
          duration:
            data?.duration || calculateDuration(data.startTime, data.endTime),

          attendees: getAttendeeCount(attendees, ownerCount),

          organizer,
        };
        break;
    }

    const newActivity: Activity = {
      id: Date.now(),
      type,
      title,
      author: lead?.contactOwner || "Current User",
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

  const handlePhoneChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, "");
    if (digitsOnly.length > 10) return;
    setEditableLead((p: any) => ({ ...p, phone: digitsOnly }));
  };

  const handlePhoneBlur = () => {
    const digits = editableLead?.phone?.replace(/\D/g, "") || "";
    if (digits.length > 0 && digits.length < 10) {
      notify("Please enter a valid 10-digit phone number", "error");
    }
  };

  const handleSaveLead = () => {
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneDigits = editableLead?.phone?.replace(/\D/g, "") || "";

      if (!emailRegex.test(editableLead?.email)) {
        notify("Please enter a valid email address", "error");
        return;
      }

      if (phoneDigits.length !== 10) {
        notify("Please enter a valid 10-digit phone number", "error");
        return;
      }

      const updatedLead = { ...editableLead, phone: phoneDigits };

      setLead(updatedLead);
      const storedLeads = localStorage.getItem("leads");
      if (storedLeads) {
        const leads = JSON.parse(storedLeads);
        const updatedLeads = leads.map((l: any) =>
          String(l.id) === String(id) ? updatedLead : l
        );
        localStorage.setItem("leads", JSON.stringify(updatedLeads));
      }
      setIsEditing(false);
      notify("Lead details updated successfully", "success");
    } catch (error) {
      console.error("Failed to update lead:", error);
      notify("Failed to save changes", "error");
    }
  };

  if (!lead)
    return (
      <div className="p-8 text-center text-gray-600">
        <p>Lead details loading...</p>
      </div>
    );

  const aboutFields = [
    {
      label: "Email",
      value: editableLead?.email,
      isEditable: true,
      onChange: (val: string | string[]) =>
        setEditableLead((p: any) => ({
          ...p,
          email: typeof val === "string" ? val : val[0],
        })),
    },
    {
      label: "First Name",
      value: editableLead?.firstName,
      isEditable: true,
      onChange: (val: string | string[]) =>
        setEditableLead((p: any) => ({
          ...p,
          firstName: typeof val === "string" ? val : val[0],
        })),
    },
    {
      label: "Last Name",
      value: editableLead?.lastName,
      isEditable: true,
      onChange: (val: string | string[]) =>
        setEditableLead((p: any) => ({
          ...p,
          lastName: typeof val === "string" ? val : val[0],
        })),
    },
    {
      label: "Phone Number",
      value: editableLead?.phone,
      isEditable: true,
      onChange: (val: string | string[]) =>
        handlePhoneChange(typeof val === "string" ? val : val[0] || ""),
      onBlur: handlePhoneBlur,
    },
    {
      label: "Lead Status",
      value: editableLead?.status || "New",
      isEditable: true,
      options: statusOptions,
      onChange: (val: string | string[]) =>
        setEditableLead((p: any) => ({
          ...p,
          status: typeof val === "string" ? val : val[0],
        })),
    },
    {
      label: "Job Title",
      value: editableLead?.jobTitle,
      isEditable: true,

      onChange: (val: string | string[]) =>
        setEditableLead((p: any) => ({
          ...p,
          jobTitle: typeof val === "string" ? val : val[0],
        })),
    },
    {
      label: "Created Date",
      value: formatDisplayDate(editableLead?.createdDate),
      isEditable: false,
    },
  ];

  const getFilteredActivities = (type: ActivityType) =>
    activities.filter((a) => a.type === type);

  return (
    <div className="m-2 bg-white rounded-md min-h-screen flex flex-col lg:flex-row gap-6 overflow-hidden">
      <div className="w-[320px] space-y-4 ml-0 mt-2">
        <InfoCard
          module="leads"
          title={`${lead.firstName} ${lead.lastName}`}
          subtitle={lead.jobTitle}
          email={lead.email}
          onNoteClick={() => toggleModal("note", true)}
          onEmailClick={() => toggleModal("email", true)}
          onCallClick={() => toggleModal("call", true)}
          onTaskClick={() => toggleModal("task", true)}
          onMeetingClick={() => toggleModal("meeting", true)}
        />

        <EntityInfoCard
          title="About this lead"
          fields={aboutFields}
          isEditing={isEditing}
          onEdit={() => setIsEditing(true)}
          onSave={handleSaveLead}
          onCancel={() => {
            setEditableLead(lead);
            setIsEditing(false);
          }}
        />
      </div>

      <div className="flex-1 bg-white">
        <DetailHeader
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          showConvertButton={true}
          onConvert={() => notify("Convert Lead flow coming soon!", "info")}
        />

        <CRMTabHeader
          value={activeTab}
          onChange={(tab) => setActiveTab(tab)}
          renderPanel={(tab, label) => {
            if (tab === "activity") {
              return (
                <ActivitySummaryView
                  heading="Upcoming"
                  activities={activities}
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

      <div className="w-[280px] space-y-4 mt-5 mr-4">
        <AISummaryCard type="lead" className="border border-indigo-700" />
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
        connectedPerson={`${lead.firstName} ${lead.lastName}`}
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
