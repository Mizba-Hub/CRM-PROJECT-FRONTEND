"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";

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

import { notify } from "@/components/ui/toast/Notify";
import { formatDisplayDate } from "@/app/lib/date";
import { getCurrentUserName } from "@/app/lib/auth";
import { AISummaryCard } from "@/components/ai/AISummaryCard";
import { calculateDuration, getAttendeeCount } from "@/app/lib/utils";
import ActivitySummaryView from "@/components/crm/ActivitySummaryView";
import { ActivityItem } from "@/components/crm/ActivitySummaryView";
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

interface Deal {
  id: number;
  name: string;
  stage: string;
  closeDate: string;
  owner: string[];
  amount: string;
  priority: string;
  createdDate: string;
}

const formatNoteDate = (date: Date): string => {
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

const formatActivityDateTime = (date: Date): string => {
  const optionsDate: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  };
  const optionsTime: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  const datePart = new Intl.DateTimeFormat("en-US", optionsDate).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", optionsTime).format(date);
  return `${datePart} at ${timePart}`;
};

export default function DealDetailPage() {
  const { id } = useParams();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [editableDeal, setEditableDeal] = useState<Deal | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [dealStage, setDealStage] = useState("");
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

  const currentUserName = getCurrentUserName();
  const ownerOptions = [
    "Shaima",
    "Shifa",
    "Mizba",
    "Sabira",
    "Greeshma",
    "Maria",
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const getDealOwnerName = () => {
    if (!deal?.owner) return "Unknown";
    return Array.isArray(deal.owner) ? deal.owner.join(", ") : deal.owner;
  };

  const getFormattedOwners = () => {
    if (!editableDeal?.owner) return "";
    return Array.isArray(editableDeal.owner)
      ? editableDeal.owner.join(", ")
      : editableDeal.owner;
  };

  const getAllMeetingParticipants = (attendees: string[] = []) => {
    // 🟢 Only include current user
    const allParticipants = new Set<string>();
    allParticipants.add(currentUserName);

    return Array.from(allParticipants);
  };

  useEffect(() => {
    const storedDeals = localStorage.getItem("deals");
    if (storedDeals) {
      const deals = JSON.parse(storedDeals);
      const found = deals.find((d: Deal) => String(d.id) === String(id));
      if (found) {
        const dealWithArrayOwner = {
          ...found,
          owner: Array.isArray(found.owner)
            ? found.owner
            : [found.owner].filter(Boolean),
        };
        setDeal(dealWithArrayOwner);
        setEditableDeal(dealWithArrayOwner);
        setDealStage(found.stage);
      }
    }
  }, [id]);

  useEffect(() => {
    if (deal?.owner && activities.length > 0) {
      const updatedActivities = activities.map((activity) => {
        if (activity.type === "meeting") {
          const attendees = activity.extra?.attendeesRaw || [];
          const allParticipants = getAllMeetingParticipants(attendees);
          const participantNames = currentUserName;

          return {
            ...activity,
            title: `Meeting by ${currentUserName}`,
            description: `Meeting organized by ${currentUserName}`,
            content:
              activity.content || `Meeting organized by ${currentUserName}`,
            extra: {
              ...activity.extra,
              attendees: getAttendeeCount(
                allParticipants,
                allParticipants.length
              ),
              organizer: currentUserName,
              allParticipants: allParticipants,
            },
          };
        }
        return activity;
      });

      const hasChanges =
        JSON.stringify(updatedActivities) !== JSON.stringify(activities);
      if (hasChanges) {
        setActivities(updatedActivities);
      }
    }
  }, [deal?.owner, activities.length, currentUserName]);

  const updateLocalStorageDeals = (updatedDeal: Deal) => {
    const storedDeals = localStorage.getItem("deals");
    if (!storedDeals) return;
    const deals = JSON.parse(storedDeals);
    const updatedDeals = deals.map((d: Deal) =>
      String(d.id) === String(id) ? updatedDeal : d
    );
    localStorage.setItem("deals", JSON.stringify(updatedDeals));
  };

  const simpleActivities: ActivityItem[] = useMemo(() => {
    const now = new Date();
    const dealCreatedDate = deal?.createdDate
      ? new Date(deal.createdDate)
      : now;

    const allActivities = [
      {
        id: 1,
        type: "note" as const,
        title: "Deal activity",
        author: currentUserName,
        date: now.toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        description: `${currentUserName} moved deal to ${
          dealStage || deal?.stage || "New"
        }`,
        content: `${currentUserName} moved deal to ${
          dealStage || deal?.stage || "New"
        }`,
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
        title: `The deal was created by ${currentUserName}`,
        author: currentUserName,
        date: dealCreatedDate.toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        description: dealCreatedDate.toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        content: dealCreatedDate.toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        dueDate: dealCreatedDate.toLocaleString("en-US", {
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
        return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
      };

      return parseDate(b.date || "") - parseDate(a.date || "");
    });
  }, [currentUserName, dealStage, deal?.stage, deal?.createdDate, activities]);

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
        extra = {
          duration: data?.duration || "",
          outcome: data?.outcome || "",
        };
        break;
      case "task":
        title = `Task assigned to ${currentUserName}`;
        content = data?.note || "";
        extra = {
          priority: data?.priority || "-",
          taskType: data?.type || "-",
          status: data?.status || "Not Started",
        };
        break;
      case "meeting":
        const allParticipants = [currentUserName];
        const participantNames = currentUserName;

        title = `Meeting by ${currentUserName}`;
        content = data?.note || `Meeting organized by ${currentUserName}`;
        extra = {
          duration:
            data?.duration || calculateDuration(data.startTime, data.endTime),
          attendees: getAttendeeCount(allParticipants, allParticipants.length),
          organizer: currentUserName,
          location: data?.location || "",
          attendeesRaw: allParticipants,
          allParticipants: allParticipants,
        };
        break;
    }

    const newActivity: Activity = {
      id: Date.now(),
      type,
      title,
      author: currentUserName,
      date: formatActivityDateTime(new Date()),
      dueDate: data?.dueDate
        ? formatNoteDate(new Date(data.dueDate))
        : formatNoteDate(new Date()),
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

  const handleFieldChange = (label: string, value: string | string[]) => {
    if (!editableDeal) return;

    const fieldMap: Record<string, keyof Deal> = {
      "Deal Owner": "owner",
      Priority: "priority",
      "Created Date": "createdDate",
    };

    const key = fieldMap[label];
    if (!key) return;

    let val: any;
    if (key === "owner") {
      val = Array.isArray(value) ? value : [value].filter(Boolean);
    } else {
      val = Array.isArray(value) ? value[0] : value;
    }

    const updated = { ...editableDeal, [key]: val };
    setEditableDeal(updated);
  };

  const handleSaveDeal = () => {
    if (!editableDeal) return;
    try {
      const updatedDeal = { ...editableDeal, stage: dealStage };
      setDeal(updatedDeal);
      setEditableDeal(updatedDeal);
      updateLocalStorageDeals(updatedDeal);
      setIsEditing(false);
      setActivities((prev) => [...prev]);
      notify("Deal details updated successfully", "success");
    } catch (error) {
      console.error("Failed to update deal:", error);
      notify("Failed to save changes", "error");
    }
  };

  const handleCancel = () => {
    setEditableDeal(deal);
    setIsEditing(false);
  };

  const handleStageUpdate = (field: "status" | "stage", value: string) => {
    if (field === "stage") {
      setDealStage(value);
      if (deal) {
        const updatedDeal = { ...deal, stage: value };
        setDeal(updatedDeal);
        setEditableDeal(updatedDeal);
        updateLocalStorageDeals(updatedDeal);
      }
    }
  };

  const aboutFields = [
    {
      label: "Deal Owner",
      value: editableDeal?.owner || [],
      isEditable: true,
      options: ownerOptions,
      variant: "multiselect" as const,
      onChange: (val: string | string[]) => {
        const selectedOwners = Array.isArray(val) ? val : [val].filter(Boolean);
        handleFieldChange("Deal Owner", selectedOwners);
      },
    },
    {
      label: "Priority",
      value: editableDeal?.priority || "",
      isEditable: true,
      options: ["Low", "Medium", "High", "Urgent"],
      onChange: (val: string | string[]) => handleFieldChange("Priority", val),
    },
    {
      label: "Created Date",
      value: editableDeal?.createdDate
        ? formatDisplayDate(editableDeal.createdDate)
        : "",
      isEditable: false,
    },
  ];

  const getFilteredActivities = (type: ActivityType) =>
    activities.filter((a) => a.type === type);

  if (!deal)
    return (
      <div className="p-8 text-center text-gray-600">
        <p>Deal details loading...</p>
      </div>
    );

  return (
    <div className="p-0 bg-white rounded-md h-full overflow-scroll flex gap-6">
      <div className="w-[320px] space-y-4 ml-0 mt-2">
        <InfoCard
          module="deals"
          title={deal.name}
          subtitle={deal.stage}
          amount={deal.amount}
          stage={dealStage}
          onUpdate={handleStageUpdate}
          onNoteClick={() => toggleModal("note", true)}
          onEmailClick={() => toggleModal("email", true)}
          onCallClick={() => toggleModal("call", true)}
          onTaskClick={() => toggleModal("task", true)}
          onMeetingClick={() => toggleModal("meeting", true)}
        />

        <EntityInfoCard
          title="About this deal"
          fields={aboutFields}
          isEditing={isEditing}
          onEdit={() => setIsEditing(true)}
          onSave={handleSaveDeal}
          onCancel={handleCancel}
        />
      </div>

      <div className="flex-1 bg-white p-4 mt-2">
        <DetailHeader
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
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

      <div className="w-[280px] space-y-4 mt-5 mr-4">
        <AISummaryCard type="deal" className="border border-indigo-700" />

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
        connectedPerson={deal.name}
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
