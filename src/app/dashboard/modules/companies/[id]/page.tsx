"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";

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
import { getEntityEmail } from "@/app/lib/utils";
import { getCurrentUserName } from "@/app/lib/auth";
import { AISummaryCard } from "@/components/ai/AISummaryCard";

import {
  fetchCompanyMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  Meeting as ReduxMeeting,
  CreateMeetingData,
} from "@/store/slices/activity/meetingSlice";

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


const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found. Please log in.");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export default function CompanyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { meetings, loading: meetingsLoading, error: meetingsError } = useSelector(
    (state: RootState) => state.meetings
  );
  const [availableAttendees, setAvailableAttendees] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [editableCompany, setEditableCompany] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<ActivityType>("activity");
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState<
    Record<Exclude<ActivityType, "activity">, boolean>
  >({
    note: false,
    call: false,
    task: false,
    email: false,
    meeting: false,
  });
  const [showCallPopup, setShowCallPopup] = useState(false);
 
 
  useEffect(() => {
    const fetchCompanyDetails = async () => {

    };

    if (id) {
      fetchCompanyDetails();
    }
  }, [id, dispatch]);

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
    const fetchCompanyDetails = async () => {
      try {
        setLoading(true);
        const companyId = Number(id);
        
       
        
        const headers = getAuthHeaders();
        const response = await fetch(`http://localhost:5000/api/v1/companies/${companyId}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch company: ${response.status}`);
        }

        const result = await response.json();
        console.log("🔍 [COMPANY DETAIL] API Response:", result);
        
        if (result.success && result.data) {
          const companyData = result.data;
          
          
          const transformedCompany = {
            id: companyData.id,
            companyName: companyData.companyName || "",
            industry: companyData.industryType || "",
            phone: companyData.phoneNumber || "",
            companyOwner: companyData.Owners ? companyData.Owners.map((owner: any) => 
              `${owner.firstName || ''} ${owner.lastName || ''}`.trim()
            ) : [],
            domain: companyData.domainName || "",
            city: companyData.city || "",
            country: companyData.country || "",
            employees: companyData.noOfEmployees?.toString() || "",
            revenue: companyData.annualRevenue ? `$${companyData.annualRevenue}` : "",
            createdDate: companyData.createdDate || companyData.createdAt || new Date().toISOString(),
         
            rawData: companyData
          };

          console.log("🔍 [COMPANY DETAIL] Transformed company:", transformedCompany);
          
          setCompany(transformedCompany);
          setEditableCompany(transformedCompany);
          
        
          dispatch(fetchCompanyMeetings({ companyId: companyData.id }));
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error("🔍 [COMPANY DETAIL] Error fetching company:", error);
        notify("Failed to load company details", "error");
        
       
        const storedSelected = localStorage.getItem("selectedCompany");
        if (storedSelected) {
          const parsed = JSON.parse(storedSelected);
          if (parsed && parsed.id === Number(id)) {
            setCompany(parsed);
            setEditableCompany(parsed);
            dispatch(fetchCompanyMeetings({ companyId: parsed.id }));
          }
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCompanyDetails();
    }
  }, [id, dispatch]);


const meetingActivities: Activity[] = meetings.map((meeting: ReduxMeeting) => {
  const organizerName = meeting.organizers?.map(org => `${org.firstName} ${org.lastName}`).join(", ") || "Unknown Organizer";
  
 
  const currentUser = getCurrentUserName() || "User";
  

  const customTitle = company 
    ? `Meeting ${currentUser} and ${company.companyName}`
    : `Meeting ${currentUser}`; 
  
  console.log("🔍 TRANSFORMING:", {
    from: meeting.title,
    to: customTitle,
    currentUser: currentUser,
    companyName: company?.companyName
  });

  return {
    id: meeting.id,
    type: "meeting" as const,
    title: customTitle,
    author: organizerName,
    date: formatActivityDate(new Date(`${meeting.startDate} ${meeting.startTime}`)),
    content: meeting.note || `Meeting scheduled for ${meeting.startDate} at ${meeting.startTime}`,
    extra: {
      duration: meeting.duration,
      location: meeting.location,
      attendees: meeting.totalcount,
      organizer: organizerName,
      originalTitle: meeting.title,
    },
    isTicket: false,
  };
});
  const allActivities = [...activities, ...meetingActivities];


const handleCreateMeeting = async (meetingData: any): Promise<boolean> => {
  try {
    if (!company) {
      notify("No company selected", "error");
      return false;
    }

    console.log("📤 [MEETING CREATE] Starting meeting creation...");
    console.log("📤 [MEETING CREATE] Meeting data received:", meetingData);
    console.log("📤 [MEETING CREATE] Attendees in meetingData:", meetingData.attendees);

   
    const attendeeIds = meetingData.attendees.map((attendee: any) => attendee.id);
    
    console.log("📤 [MEETING CREATE] Extracted attendee IDs:", attendeeIds);

    const createData: CreateMeetingData = {
      title: meetingData.title,
      startDate: meetingData.startDate,
      startTime: meetingData.startTime,
      endTime: meetingData.endTime,
      location: meetingData.location,
      reminder: meetingData.reminder,
      note: meetingData.note,
      organizerIds: [1],
      attendeeIds, 
      linkedModule: "company" as const,
      linkedModuleId: company.id,
    };

    console.log("📤 [MEETING CREATE] Final create data:", createData);

    const result = await dispatch(createMeeting(createData)).unwrap();
    
    console.log("✅ [MEETING CREATE] Success! Result:", result);
    notify("Meeting created successfully", "success");
    toggleModal("meeting", false);
    
  
    dispatch(fetchCompanyMeetings({ companyId: company.id }));
    
    return true;
    
  } catch (error: any) {
    console.error("❌ [MEETING CREATE] Error details:", {
      error,
      type: typeof error,
      payload: error?.payload,
      message: error?.message
    });
    
    let errorMessage = "Failed to create meeting";
    
    if (error?.payload) {
      errorMessage = error.payload;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    notify(errorMessage, "error");
    return false;
  }
};
 
  const handleDeleteMeeting = async (meetingId: number) => {
    try {
      await dispatch(deleteMeeting(meetingId)).unwrap();
      notify("Meeting deleted successfully", "success");
    } catch (error) {
      console.error("Failed to delete meeting:", error);
      notify("Failed to delete meeting", "error");
    }
  };

  const ownerOptions = [
    "Maria Johnson",
    "Shifa",
    "Mizba",
    "Sabira",
    "Shaima",
    "Greeshma",
  ];
  
  const industryOptions = [
    "Technology",
    "Education", 
    "Finance",
    "Healthcare",
    "Retail",
    "Manufacturing",
    "IT",
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

  
  const updateCompanyInBackend = async (companyData: any) => {
    try {
      const headers = getAuthHeaders();
      const companyId = Number(id);
      
      
      const updateData = {
        companyName: companyData.companyName,
        domainName: companyData.domain,
        industryType: companyData.industry,
        phoneNumber: companyData.phone,
        city: companyData.city,
        country: companyData.country,
        noOfEmployees: parseInt(companyData.employees) || 0,
        annualRevenue: parseFloat(companyData.revenue?.replace('$', '')) || 0,
      };

      console.log("🔍 [COMPANY UPDATE] Sending update:", updateData);

      const response = await fetch(`http://localhost:5000/api/v1/companies/${companyId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update company: ${response.status}`);
      }

      const result = await response.json();
      console.log("🔍 [COMPANY UPDATE] Update response:", result);
      
      return result.success;
    } catch (error) {
      console.error("🔍 [COMPANY UPDATE] Error updating company:", error);
      throw error;
    }
  };

  const handleSave = async () => {
    try {
   
      await updateCompanyInBackend(editableCompany);
      

      setCompany(editableCompany);
      setIsEditing(false);

    
      localStorage.setItem("selectedCompany", JSON.stringify(editableCompany));

      notify("Company details updated successfully", "success");
    } catch (error) {
      notify("Failed to update company details", "error");
    }
  };

  const handleCancel = () => {
    setEditableCompany(company);
    setIsEditing(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };


const handleSaveSyncActivity = (
  type: ActivityType,  
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
      title = `Logged Email – ${data?.subject || "No Subject"} by ${currentUser}`;
      content = data?.body || "Email sent successfully";
      break;
    case "call":
      title = `Call with ${currentUser}`;
      content = data?.summary || "Call logged";
      break;
    case "task":
      const assignedTo =
        data?.assignedTo ||
        (company.companyOwner && company.companyOwner[0]) ||
        "Unassigned";
      title = `Task assigned to ${assignedTo}`;
      content = data?.description || "Task created";
      extra = {
        priority: data?.priority || "-",
        taskType: data?.type || "-",
        taskName: data?.name || "-",
        dueDate: data?.dueDate || null,
        assignedTo,
      };
      break;

    case "meeting":
     
      title = `Meeting: ${currentUser} with ${company.companyName}`;
      
 
      content = data?.note || `Meeting scheduled for ${data?.startDate} at ${data?.startTime}`;
      
  
      extra = {
        startDate: data.startDate,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        attendees: data.attendees?.length || 0,
        organizerIds: data.organizerIds,
      
      };
      break;

    default:
   
      console.warn("Unhandled activity type:", type);
      return false;
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
  if (loading) {
    return (
      <div className="p-8 text-center text-gray-600">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2">Loading company details...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-8 text-center text-gray-600">
        <p>Company not found</p>
        <button
          onClick={() => router.push("/dashboard/modules/companies")}
          className="mt-4 text-indigo-600 hover:underline"
        >
          ← Back to Companies
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
    <div className="m-2 bg-white rounded-md flex flex-col lg:flex-row gap-6 overflow-hidden">
    
      <div className="w-[320px] space-y-4 ml-0 mt-2">
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

   
      <div className="flex-1 bg-white rounded-lg flex flex-col">
        <DetailHeader
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
        />

        <div className="mt-4 flex-1 overflow-auto">
          <CRMTabHeader
            value={activeTab}
            onChange={(tab) => setActiveTab(tab as ActivityType)}
            renderPanel={(tab, label) => {
             
              let filteredActivities = [];
              
              if (tab === "activity") {
              
                filteredActivities = [...allActivities];
              } else {
                
                filteredActivities = allActivities.filter((a) => a.type === tab);
              }

        
              const sorted = filteredActivities.sort((a, b) => {
            
                if (a.isTicket && !b.isTicket) return -1;
                if (!a.isTicket && b.isTicket) return 1;
                
              
                return new Date(b.date).getTime() - new Date(a.date).getTime();
              });

              const buttonLabel =
                tab === "call" ? "Make a Phone Call" : `Create ${label.slice(0, -1)}`;

              const handleCreate = () => {
                if (tab === "call") setShowCallPopup(true);
                else toggleModal(tab as Exclude<ActivityType, "activity">, true);
              };

              return tab === "activity" ? (
                <ActivitySummaryView 
                  heading="Upcoming" 
                  activities={sorted}
                />
              ) : (
                <ActivityDetailView
                  sectionTitle={label}
                  buttonLabel={buttonLabel}
                  activities={sorted}
                  onCreate={handleCreate}
                  onDelete={tab === "meeting" ? handleDeleteMeeting : undefined}
                />
              );
            }}
          />
        </div>

     
        {showCallPopup && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white shadow-lg rounded-lg p-6 w-[320px] text-center">
              <h3 className="text-lg font-semibold text-gray-800">Connecting to Agent</h3>
              <p className="text-sm text-gray-500 mt-2">Simulating call connection</p>

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
                  onClick={() => setShowCallPopup(false)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

  
      <div className="w-[280px] space-y-4">
        <AISummaryCard
          type="company"
          subjectTitle={company.companyName}
          message={`There are ${meetings.length} meetings and ${activities.length} other activities associated with this company.`}
          className="w-full text-sm"
        />
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
          onRemove={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
        />
      </div>

    
      <NoteModal
        isOpen={showModal.note}
        onClose={() => toggleModal("note", false)}
        onSave={(data) => handleSaveSyncActivity("note", data)}
      />

      <CallModal
        isOpen={showModal.call}
        onClose={() => toggleModal("call", false)}
        connectedPerson={company?.companyOwner || []}
        onSave={(data) => handleSaveSyncActivity("call", data)}
      />

      <TaskModal
        isOpen={showModal.task}
        onClose={() => toggleModal("task", false)}
        onSave={(data) => handleSaveSyncActivity("task", data)}
      />

      <EmailModal
        isOpen={showModal.email}
        onClose={() => toggleModal("email", false)}
        onSend={(data) => handleSaveSyncActivity("email", data)}
        connectedPerson={(() => {
          const leadEmail = getEntityEmail("company", String(company.id));
          return leadEmail ? `lead:${leadEmail}` : undefined;
        })()}
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
            if (exists) return prev;

            const previewUrl = isImage ? file.url : undefined;
            const newAttachment = {
              id: Date.now(),
              name: file.name,
              uploadedAt: new Date().toLocaleString(),
              previewUrl,
              type: file.type || (isImage ? "image/png" : "application/octet-stream"),
            };
            return [...prev, newAttachment];
          });
        }}
      />

     
      <MeetingModal
        isOpen={showModal.meeting}
        onClose={() => toggleModal("meeting", false)}
        onSave={handleCreateMeeting}
        linkedModule="company"
        linkedModuleId={company.id}

      />
    </div>
  );
}