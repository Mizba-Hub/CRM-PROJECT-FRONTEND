"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import InfoCard from "@/components/ui/Card";
import EntityInfoCard from "@/components/crm/EntityInfoCard";
import CRMTabHeader from "@/components/crm/CRMTabHeader";
import ActivitySummaryView from "@/components/crm/ActivitySummaryView";
import ActivityDetailView from "@/components/crm/ActivityDetailView";
import AttachmentView from "@/components/crm/AttachmentView";
import DetailHeader from "@/components/crm/DetailHeader";

import NoteModal from "@/components/modal/FormModals/NoteModal";
import EmailModal from "@/components/modal/FormModals/EmailModal";
import CallModal from "@/components/modal/FormModals/CallModal";
import TaskModal from "@/components/modal/FormModals/TaskModal";
import MeetingModal from "@/components/modal/FormModals/MeetingModal";

import { notify } from "@/components/ui/toast/Notify";
import { formatActivityDate, formatDisplayDate } from "@/app/lib/date";

import { getCurrentUserName } from "@/app/lib/auth";
import { calculateDuration } from "@/app/lib/utils";
import { AISummaryCard } from "@/components/ai/AISummaryCard";

type ActivityType = "note" | "call" | "task" | "email" | "meeting" | "activity";

type Activity = {
  id: number;
  type: Exclude<ActivityType, "activity">;
  title: string;
  author: string;
  date: string;
  content?: string;
  extra?: Record<string, any>;
  isTicket?: boolean;
};

export default function CompanyDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [company, setCompany] = useState<any>(null);
  const [editableCompany, setEditableCompany] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<ActivityType>("activity");
  const [searchValue, setSearchValue] = useState("");
  const [showModal, setShowModal] = useState<
    Record<Exclude<ActivityType, "activity">, boolean>
  >({
    note: false,
    call: false,
    task: false,
    email: false,
    meeting: false,
  });

  const companyOwnerList = [
    "Maria Johnson",
    "Shifa",
    "Mizba",
    "Sabira",
    "Shaima",
    "Greeshma",
  ];
  const currentUserName = getCurrentUserName();

  
  useEffect(() => {
    const companyId = Number(id);
    const storedSelected = localStorage.getItem("selectedCompany");
    const storedCompanies = localStorage.getItem("companies");

    let loadedCompany: any = null;
    if (storedSelected) {
      const parsed = JSON.parse(storedSelected);
      if (parsed && parsed.id === companyId) loadedCompany = parsed;
    } else if (storedCompanies) {
      const all = JSON.parse(storedCompanies);
      loadedCompany = all.find((c: any) => c.id === companyId);
    }

    if (!loadedCompany) {
      loadedCompany = {
        id: companyId,
        companyName: "Acme Corporation",
        industry: "Manufacturing",
        phone: "+971 4 123 4567",
        companyOwner: companyOwnerList,
        domain: "acme.com",
        city: "Paris",
        country: "France",
        employees: "120",
        revenue: "$3M",
        createdDate: new Date().toISOString(),
      };
    }

    setCompany(loadedCompany);
    setEditableCompany(loadedCompany);

    if (activities.length === 0) {
      const hardcodedTickets: Activity[] = [
        {
          id: 101,
          type: "note",
          isTicket: true,
          title: "Ticket 1",
          author: "Support Agent",
          date: new Date().toISOString(),
          content: `${currentUserName} created Ticket 1`,
        },
        {
          id: 102,
          type: "note",
          isTicket: true,
          title: "Ticket Activity",
          author: "Support Agent",
          date: new Date().toISOString(),
          content: `${currentUserName} created Ticket Activity`,
        },
      ];
      setActivities(hardcodedTickets);
    }
  }, [id]);

  const ownerOptions = [
    "Maria Johnson",
    "Shifa",
    "Mizba",
    "Sabira",
    "Shaima",
    "Greeshma",
  ];
  const industryOptions = [
    "Manufacturing",
    "IT",
    "Finance",
    "Healthcare",
    "Education",
  ];

  const toggleModal = (
    type: Exclude<ActivityType, "activity">,
    open: boolean
  ) => {
    setShowModal((prev) => ({ ...prev, [type]: open }));
  };

  const handleFieldChange = (label: string, value: string | string[]) => {
    if (!editableCompany) return;

    const keyMap: Record<string, string> = {
      "Company Domain Name": "domain",
      "Company Name": "companyName",
      "Industry": "industry",
      "Phone number": "phone",
      "Company Owner": "companyOwner",
      "City": "city",
      "Country/Region": "country",
      "No of Employees": "employees",
      "Annual Revenue": "revenue",
      "Created Date": "createdDate",
    };

    const key = keyMap[label];
    if (!key) return;

    let val: any;
    if (key === "companyOwner") {
      val = Array.isArray(value) ? value : [];
    } else {
      val = Array.isArray(value) ? value[0] : value;
    }

    setEditableCompany((prev: any) => ({ ...prev, [key]: val }));
  };

  
  useEffect(() => {
    if (editableCompany) {
      setCompany((prev: any) => ({
        ...prev,
        companyOwner: editableCompany.companyOwner,
      }));
    }
  }, [editableCompany?.companyOwner]);

  const handleSave = () => {
    setCompany(editableCompany);
    setIsEditing(false);

    localStorage.setItem("selectedCompany", JSON.stringify(editableCompany));
    const storedCompanies = localStorage.getItem("companies");
    if (storedCompanies) {
      const allCompanies = JSON.parse(storedCompanies);
      const updatedCompanies = allCompanies.map((c: any) =>
        c.id === editableCompany.id ? editableCompany : c
      );
      localStorage.setItem("companies", JSON.stringify(updatedCompanies));
    }

    notify("Company details updated successfully", "success");
  };

  const handleCancel = () => {
    setEditableCompany(company);
    setIsEditing(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleSaveActivity = (
    type: Exclude<ActivityType, "activity">,
    data: any
  ): boolean => {
    if (!company) return false;

    const currentUser = getCurrentUserName() || "Unknown";

    let title = "";
    let content = "";
    let extra: Record<string, any> | undefined = undefined;

    switch (type) {
      case "note":
        title = `Note by ${currentUser}`;
        content = data;
        break;
      case "email":
        title = `Logged Email – ${
          data?.subject || "No Subject"
        } by ${currentUser}`;
        content = data?.body || "Email sent successfully";
        break;
      case "call":
        title = `Call with ${currentUser}`;
        content = data?.summary || "Call logged";
        break;
      case "task":
        const assignedTo = data?.assignedTo || company.companyOwner[0];
        title = `Task assigned to ${assignedTo}`;
        content = data?.description || "Task created";
        extra = {
          priority: data?.priority || "-",
          taskType: data?.type || "-",
          dueDate: data?.dueDate || null,
          assignedTo,
        };
        break;
   case "meeting": {
  const companyName = editableCompany?.companyName || "Client";
  const attendees: string[] = Array.isArray(data?.attendees)
    ? data.attendees
    : [];
  const owners: string[] = Array.isArray(editableCompany?.companyOwner)
    ? editableCompany.companyOwner
    : [];

  const currentUser = getCurrentUserName() || "You";

  
  title = `Meeting ${currentUser} and ${companyName}`;

 
  const normalize = (n: string) => n.trim().toLowerCase();
  const allParticipants = [currentUser, ...owners, ...attendees];
  const uniqueParticipants = Array.from(
    new Set(allParticipants.map(normalize))
  );
  const totalCount = uniqueParticipants.length;

  content = data?.note || "";

  extra = {
    duration:
      data?.duration || calculateDuration(data.startTime, data.endTime),
    attendees: totalCount,
    attendeeNames: attendees.join(" and "),
    organizer: currentUser,
  };
  break;
}

    }

    const newActivity: Activity = {
      id: Date.now(),
      type,
      title,
      author: currentUser,
      date: formatActivityDate(new Date()),
      content,
      extra,
      isTicket: false,
    };

    setActivities((prev) => [newActivity, ...prev]);
    toggleModal(type, false);
    notify(
      `${type.charAt(0).toUpperCase() + type.slice(1)} added successfully`,
      "success"
    );
    return true;
  };

  if (!company) {
    return (
      <div className="p-8 text-center text-gray-600">
        <p>Company not found</p>
        <button
          onClick={() => router.push("/dashboard/modules/companies")}
          className="mt-4 text-indigo-600 hover:underline"
        >
          ← Loading
        </button>
      </div>
    );
  }

  const aboutFields = [
    {
      label: "Company Domain Name",
      value: editableCompany?.domain || "",
      isEditable: true,
      onChange: (val: string | string[]) =>
        handleFieldChange("Company Domain Name", val),
       className: "text-gray-900",
    },
    {
      label: "Company Name",
      value: editableCompany?.companyName || "",
      isEditable: true,
      onChange: (val: string | string[]) =>
        handleFieldChange("Company Name", val),
     className: "text-gray-900",
    },
    {
      label: "Industry",
      value: editableCompany?.industry || "",
      isEditable: true,
      type: "dropdown",
      options: industryOptions,
      multiple: false,
      onChange: (val: string | string[]) => handleFieldChange("Industry", val),
      className: "text-black",
    },
    {
      label: "Phone number",
      value: editableCompany?.phone || "",
      isEditable: true,
      onChange: (val: string | string[]) =>
        handleFieldChange("Phone number", val),
       className: "text-gray-900",
    },
    {
      label: "Company Owner",
      value: editableCompany?.companyOwner || [],
      isEditable: true,
      options: ownerOptions,
      variant: "multiselect" as const,
      onChange: (val: string | string[]) =>
        handleFieldChange("Company Owner", Array.isArray(val) ? val : [val]),
      className: "text-black",
    },
    {
      label: "City",
      value: editableCompany?.city || "",
      isEditable: true,
      onChange: (val: string | string[]) => handleFieldChange("City", val),
      className: "text-black",
    },
    {
      label: "Country/Region",
      value: editableCompany?.country || "",
      isEditable: true,
      onChange: (val: string | string[]) =>
        handleFieldChange("Country/Region", val),
      className: "text-black",
    },
    {
      label: "No of Employees",
      value: editableCompany?.employees || "",
      isEditable: true,
      onChange: (val: string | string[]) =>
        handleFieldChange("No of Employees", val),
      className: "text-black",
    },
    {
      label: "Annual Revenue",
      value: editableCompany?.revenue || "",
      isEditable: true,
      onChange: (val: string | string[]) =>
        handleFieldChange("Annual Revenue", val),
      className: "text-black",
    },
    {
      label: "Created Date",
      value: formatDisplayDate(editableCompany?.createdDate),
      isEditable: false,
      className: "text-black",
    },
  ];
  

  return (
    <div className="p-1 bg-white min-h-screen flex gap-4">
      <div className="w-[310px] space-y-3">
        <InfoCard
          module="companies"
          id={company.id}
          title={company.companyName}
          subtitle={company.industry}
          website={company.domain}
          onNoteClick={() => toggleModal("note", true)}
          onEmailClick={() => toggleModal("email", true)}
          onCallClick={() => toggleModal("call", true)}
          onTaskClick={() => toggleModal("task", true)}
          onMeetingClick={() => toggleModal("meeting", true)}
        />

        <EntityInfoCard
          title="About this company"
          fields={aboutFields}
          isEditing={isEditing}
          onEdit={() => setIsEditing(true)}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>

  
      <div className="flex-1 bg-white rounded-lg shadow p-4 flex flex-col">
        <DetailHeader
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
        />
        <div className="mt-4 flex-1 overflow-auto">
          <CRMTabHeader
            value={activeTab}
            onChange={(tab) => setActiveTab(tab as ActivityType)}
            renderPanel={(tab, label) => {
              const filtered =
                tab === "activity"
                  ? [...activities]
                  : activities.filter((a) => a.type === tab && !a.isTicket);

              const sorted = filtered.sort(
                (a, b) => (a.isTicket ? 0 : 1) - (b.isTicket ? 0 : 1)
              );

              return tab === "activity" ? (
                <ActivitySummaryView heading="Upcoming" activities={sorted} />
              ) : (
                <ActivityDetailView
                  sectionTitle={label}
                  buttonLabel={`Create ${label.slice(0, -1)}`}
                  activities={sorted}
                  onCreate={() =>
                    toggleModal(tab as Exclude<ActivityType, "activity">, true)
                  }
                />
              );
            }}
          />
        </div>
      </div>

    
      <div className="w-[280px] space-y-4">
        <AISummaryCard
          type="company"
          subjectTitle={company.companyName}
          message="There are no activities associated with this company and further details are needed to provide a comprehensive summary."
          className="w-full text-sm"
        />
        <AttachmentView
          attachments={attachments}
          onAdd={() => {
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = ".pdf,image/*";
            fileInput.onchange = (e: any) => {
              const file = e.target.files[0];
              if (!file) return;
              setAttachments((prev) => [
                ...prev,
                {
                  id: Date.now(),
                  name: file.name,
                  uploadedAt: new Date().toLocaleString(),
                  type: file.type.startsWith("image/") ? "image" : "pdf",
                },
              ]);
            };
            fileInput.click();
          }}
          onRemove={(aid) =>
            setAttachments((prev) => prev.filter((a) => a.id !== aid))
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
        connectedPerson={company.companyOwner}
        onSave={(data) => handleSaveActivity("call", data)}
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
