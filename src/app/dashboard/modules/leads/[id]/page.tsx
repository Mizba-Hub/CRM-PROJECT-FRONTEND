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
  const [showCallPopup, setShowCallPopup] = useState(false);

  const [showModal, setShowModal] = useState<Record<ActivityType, boolean>>({
    note: false,
    call: false,
    task: false,
    email: false,
    meeting: false,
  });

  const [searchValue, setSearchValue] = useState("");
  const currentUserName = getCurrentUserName();

  useEffect(() => {
    const storedLeads = localStorage.getItem("leads");
    if (storedLeads) {
      const leads = JSON.parse(storedLeads);
      const found = leads.find((l: any) => String(l.id) === String(id));

      const convertedIds = JSON.parse(
        localStorage.getItem("convertedLeads") || "[]"
      );
      if (convertedIds.includes(Number(id))) {
        found.status = "Converted";
        found.converted = true;
      }

      setLead(found);
      setEditableLead(found);
    }
  }, [id]);

  const statusOptions = ["Open", "New", "In Progress", "Qualified", "Closed"];

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
        const leadFullName = `${lead.firstName} ${lead.lastName}`.trim();

        title = `Logged Email – ${
          data?.subject || "No Subject"
        } by ${currentUserName}`;
        content = data?.body || "Email sent successfully";

        extra = { recipients: leadFullName || "Unknown Lead" };
        break;

      case "call":
        title = "Call from " + currentUserName;
        content = data?.note || data?.summary;
        extra = data.extra;
        break;

      case "task":
        title = `Task assigned to ${data?.assignedTo}`;
        content = data?.note || "";
        extra = {
          priority: data?.priority || "-",
          taskType: data?.type || "-",
          taskName: data?.name || "-",
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
        title = `Meeting ${currentUserName} and ${lead.firstName} ${lead.lastName}`;
        content = data?.note || "";
        extra = {
          duration:
            data?.duration || calculateDuration(data.startTime, data.endTime),
          attendees: getAttendeeCount(attendees, ownerCount),
          meetingTitle: data?.title || "-",
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
        setEditableLead((p: any) => ({
          ...p,
          phone: typeof val === "string" ? val : val[0],
        })),
    },

    editableLead?.status === "Converted"
      ? {
          label: "Lead Status",
          value: "Converted",
          isEditable: false,
        }
      : {
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
    <div className="bg-white rounded-md min-h-screen flex flex-col xl:flex-row overflow-hidden">
      <div className="w-full xl:w-[300px] flex-shrink-0 space-y-4 mt-1">
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

      <div className="flex-1 bg-white px-4 pt-0 pb-4 xl:mt-[4px] min-w-0 xl:max-w-[720px]">
        <DetailHeader
          searchValue={searchValue}
          onSearchChange={(e) => setSearchValue(e.target.value)}
          showConvertButton
          onConvert={() => {
            if (lead?.status === "Converted") return;

            const leadName = `${lead.firstName} ${lead.lastName}`;
            const redirectUrl = `/dashboard/modules/deals?openModal=true&leadId=${
              lead.id
            }&leadName=${encodeURIComponent(leadName)}`;

            localStorage.setItem("pendingConversionId", String(lead.id));

            window.location.href = redirectUrl;
          }}
          convertLabel={lead?.converted ? "Converted" : "Convert"}
          isConverted={lead?.converted}
          isQualified={editableLead?.status === "Qualified"}
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

            const buttonLabel =
              tab === "call"
                ? "Make a Phone Call"
                : `Create ${label.slice(0, -1)}`;
            const handleCreate = () => {
              if (tab === "call") {
                setShowCallPopup(true);
              } else {
                toggleModal(tab as ActivityType, true);
              }
            };

            return (
              <ActivityDetailView
                sectionTitle={label}
                buttonLabel={buttonLabel}
                activities={getFilteredActivities(tab as ActivityType)}
                onCreate={handleCreate}
              />
            );
          }}
        />
        {showCallPopup && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white shadow-lg rounded-lg p-6 w-[320px] text-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Connecting to Agent
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Simulating call connection
              </p>

              <div className="flex justify-center gap-3 mt-5">
                <button
                  onClick={() => {
                    setShowCallPopup(false);
                    notify("Call cancelled", "error");
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowCallPopup(false);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-full xl:w-[300px] flex-shrink-0 space-y-4 mt-[3px] xl:mr-2">
        <AISummaryCard type="lead" className="border border-indigo-700" />
        <AttachmentView
          attachments={attachments}
          onAdd={(file, previewUrl) => {
            if (attachments.some((a) => a.name === file.name)) {
              notify(`${file.name} already exists in attachments`, "info");
              return;
            }

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
        connectedPerson={`lead:${lead.id}`}
        recordAttachments={attachments.map((a) => ({
          id: a.id,
          name: a.name,
          url: a.previewUrl,
        }))}
        onAttachToRecord={(file) => {
          const isImage =
            file.type?.startsWith("image/") ||
            /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);

          setAttachments((prev) => {
            const exists = prev.some((a) => a.name === file.name);

            if (exists) {
              return prev;
            }

            const previewUrl = isImage ? file.url : undefined;

            const newAttachment = {
              id: Date.now(),
              name: file.name,
              uploadedAt: new Date().toLocaleString(),
              previewUrl,
              type:
                file.type ||
                (isImage ? "image/png" : "application/octet-stream"),
            };

            return [...prev, newAttachment];
          });
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
