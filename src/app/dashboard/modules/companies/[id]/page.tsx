"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
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
  fetchTasks,
  createTask as createTaskThunk,
  completeTask,
} from "@/store/slices/activity/taskSlice";
import {
  fetchAttachments,
  createAttachments,
  deleteAttachment,
} from "@/store/slices/activity/attachmentSlice";

import {
  fetchMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  Meeting as ReduxMeeting,
  CreateMeetingPayload,
} from "@/store/slices/activity/meetingSlice";
import {
  fetchNotes,
  createNote as createNoteThunk,
} from "@/store/slices/activity/notesSlice";
import {
  initiateCall,
  fetchCallsByUser,
} from "@/store/slices/activity/callSlice";
import {
  fetchEmails,
  createEmail as createEmailThunk,
} from "@/store/slices/activity/emailSlice";

type ActivityType = "note" | "call" | "task" | "email" | "meeting" | "activity";

type Activity = {
  id: number;
  type: "note" | "call" | "task" | "email" | "meeting" | "ticket";
  title: string;
  author: string;
  date: string;
  content?: string;
  description?: string;
  dueDate?: string;
  overdue?: boolean;
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

const formatTaskDueDateTime = (
  dueDate: string | null | undefined,
  dueTime: string | null | undefined,
): string => {
  const date = dueDate ? new Date(dueDate) : null;
  const time = dueTime || "";
  if (date && time) {
    return `${formatActivityDate(date)} ${time}`;
  }
  if (date) {
    return formatActivityDate(date);
  }
  return "No due date";
};

export default function CompanyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const {
    items: meetings,
    loading: meetingsLoading,
    error: meetingsError,
  } = useSelector((state: RootState) => state.meetings);
  const [userOptions, setUserOptions] = useState<
    Array<{ label: string; value: string; id?: number }>
  >([]);
  const [ticketActivities, setTicketActivities] = useState<Activity[]>([]);
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
  const [isInitiatingCall, setIsInitiatingCall] = useState(false);
  const { items: notes, loading: notesLoading } = useSelector(
    (state: RootState) => state.notes,
  );
  const { items: calls, loading: callsLoading } = useSelector(
    (state: RootState) => state.calls,
  );
  const { items: emails, loading: emailsLoading } = useSelector(
    (state: RootState) => state.emails,
  );
  const { items: tasks, loading: tasksLoading } = useSelector(
    (state: RootState) => state.tasks,
  );
  const reduxAttachments = useAppSelector((s) => s.attachments.items);
  const attachmentsLoading = useAppSelector((s) => s.attachments.loading);

  useEffect(() => {
    if (!id) return;

    dispatch(
      fetchMeetings({
        linkedModule: "company",
        linkedModuleId: Number(id),
        page: 1,
        size: 50,
      }),
    );
  }, [dispatch, id]);

  useEffect(() => {
    if (!id) return;
    dispatch(
      fetchNotes({
        type: "company",
        linkedTo: Number(id),
        page: 1,
        size: 50,
      }),
    );
  }, [dispatch, id]);

  useEffect(() => {
    try {
      const authUserRaw = localStorage.getItem("auth_user");
      const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
      const userId = authUser?.id || authUser?.userId || authUser?.userID;
      if (userId) {
        dispatch(fetchCallsByUser(Number(userId)));
      }
    } catch (error) {
      console.error("Error fetching calls:", error);
    }
  }, [dispatch]);

  useEffect(() => {
    if (!id) return;
    dispatch(
      fetchEmails({
        type: "company",
        linkedTo: Number(id),
        page: 1,
        size: 50,
      }),
    );
  }, [dispatch, id]);

  useEffect(() => {
    if (company?.id) {
      dispatch(
        fetchAttachments({
          linkedType: "company",
          linkedId: company.id,
        }),
      );
    }
  }, [company?.id, dispatch]);

  useEffect(() => {
    if (company?.id) {
      fetchCompanyTickets(company.id);
    }
  }, [company?.id]);

  const fetchCompanyTickets = async (companyId: number) => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/tickets?companyId=${companyId}`,
        { headers },
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const currentUser = getCurrentUserName() || "Current user";

          const ticketActivities = result.data.map((ticket: any) => {
            const ticketTitle =
              ticket.title || `Ticket ${ticket.ticketNumber || ticket.id}`;

            return {
              id: 600000 + ticket.id,
              type: "ticket" as const,
              title: "Ticket Activity",
              author: `${currentUser} created ${ticketTitle}`,
              date: formatActivityDate(
                ticket.createdAt ? new Date(ticket.createdAt) : new Date(),
              ),
              description: ticket.description || "No description",
              content: "",
              extra: {
                priority: ticket.priority,
                status: ticket.status,
                ticketNumber: ticket.ticketNumber,
                ticketId: ticket.id,
              },
              isTicket: true,
            };
          });

          setTicketActivities(ticketActivities);
        }
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
        const token =
          localStorage.getItem("token") || localStorage.getItem("auth_token");
        if (!BASE_URL || !token) return;

        const headers: HeadersInit = {
          "Content-Type": "application/json",
          Authorization: token.startsWith("Bearer ")
            ? token
            : `Bearer ${token}`,
        };

        const usersRes = await fetch(`${BASE_URL}/api/auth/users`, { headers });
        if (usersRes.ok) {
          const data = await usersRes.json();
          const users = data.data || data || [];
          if (Array.isArray(users) && users.length > 0) {
            const options = users.map((user: any) => {
              const fullName = `${user.firstName || ""} ${
                user.lastName || ""
              }`.trim();
              return {
                label: fullName || user.email || `User ${user.id}`,
                value: fullName || user.email || `User ${user.id}`,
                id: user.id,
              };
            });
            setUserOptions(options);
          }
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

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
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/companies/${companyId}`,
          {
            headers,
          },
        );

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
            companyOwner: companyData.Owners
              ? companyData.Owners.map((owner: any) =>
                  `${owner.firstName || ""} ${owner.lastName || ""}`.trim(),
                )
              : [],
            domain: companyData.domainName || "",
            city: companyData.city || "",
            country: companyData.country || "",
            employees: companyData.noOfEmployees?.toString() || "",
            revenue: companyData.annualRevenue
              ? `$${companyData.annualRevenue}`
              : "",
            createdDate: companyData.createdDate || companyData.createdAt,
            rawData: companyData,
          };

          console.log(
            "🔍 [COMPANY DETAIL] Transformed company:",
            transformedCompany,
          );

          setCompany(transformedCompany);
          setEditableCompany(transformedCompany);

          dispatch(
            fetchMeetings({
              linkedModule: "company",
              linkedModuleId: companyData.id,
              page: 1,
              size: 50,
            }),
          );
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
            dispatch(
              fetchMeetings({
                linkedModule: "company",
                linkedModuleId: parsed.id,
                page: 1,
                size: 50,
              }),
            );
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

  const noteActivities: Activity[] = useMemo(() => {
    if (!notes) return [];

    const uniqueNotes = Array.from(
      new Map(notes.map((n) => [n.id, n])).values(),
    );

    return uniqueNotes.map((n) => ({
      id: 100000 + n.id,
      type: "note" as const,
      title: `Note${n.owner?.name ? ` by ${n.owner.name}` : ""}`,
      author: n.owner?.name || currentUserName,
      date: formatActivityDate(
        n.createdAt ? new Date(n.createdAt) : new Date(),
      ),
      description: n.content,
      content: n.content,
      extra: {},
      isTicket: false,
    }));
  }, [notes, currentUserName]);

  const callActivities: Activity[] = useMemo(() => {
    if (!calls || !id) return [];

    const companyCalls = calls.filter((call) => {
      return (
        call.target?.type === "company" && String(call.target.id) === String(id)
      );
    });

    const uniqueCalls = Array.from(
      new Map(companyCalls.map((call) => [call.callId, call])).values(),
    );

    return uniqueCalls.map((call) => {
      const callTargetName = company?.companyName || "Company";

      return {
        id: 200000 + call.callId,
        type: "call" as const,
        title: `Call to ${callTargetName}`,
        author: call.user?.name || currentUserName,
        date: formatActivityDate(
          call.startedAt ? new Date(call.startedAt) : new Date(),
        ),
        description: `Call ${
          call.result === "successful" ? "successful" : "unsuccessful"
        }`,
        content: `Call ${
          call.result === "successful"
            ? "completed successfully"
            : "was unsuccessful"
        }`,
        extra: {
          outcome: call.result,
          duration: call.durationSeconds,
          phoneNumber: call.target?.phoneNumber,
        },
        isTicket: false,
      };
    });
  }, [calls, id, company, currentUserName]);

  const emailActivities: Activity[] = useMemo(() => {
    if (!emails || !id) return [];

    const companyEmails = emails.filter((email) => {
      return (
        email.linkedTo?.type === "company" &&
        String(email.linkedTo.id) === String(id)
      );
    });

    const uniqueEmails = Array.from(
      new Map(companyEmails.map((e) => [e.id, e])).values(),
    );

    return uniqueEmails.map((email) => {
      const recipients = Array.isArray(email.recipients)
        ? email.recipients
        : [];
      const recipientsStr =
        recipients.length > 0
          ? recipients.join(", ")
          : email.owner?.email || "Unknown recipient";
      const authorName = email.owner?.name || currentUserName || "Unknown";
      const subject = (email.subject || "No Subject").trim();

      return {
        id: 300000 + email.id,
        type: "email" as const,
        title: `Logged Email – ${subject} by ${authorName}`,
        author: authorName,
        date: formatActivityDate(
          email.sentAt
            ? new Date(email.sentAt)
            : new Date(email.createdAt || new Date()),
        ),
        description: email.body || "",
        content: email.body || "",
        preview: subject,
        extra: {
          subject,
          recipients: recipientsStr,
          cc: email.cc,
          bcc: email.bcc,
          attachments: email.attachments,
        },
        isTicket: false,
      };
    });
  }, [emails, id, currentUserName]);

  const taskActivities: Activity[] = useMemo(() => {
    if (!tasks || !id) return [];

    const companyTasks = tasks.filter((task) => {
      return (
        task.linkedModule === "company" &&
        String(task.linkedModuleId) === String(id)
      );
    });

    return companyTasks.map((task) => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      const dueDateTime = formatTaskDueDateTime(task.dueDate, task.dueTime);

      return {
        id: 400000 + task.id,
        type: "task" as const,
        title: `Task assigned to ${
          task.assignedTo?.name || currentUserName || "Unknown"
        }`,
        author: task.assignedTo?.name || currentUserName,
        date: formatActivityDate(
          task.createdAt ? new Date(task.createdAt) : new Date(),
        ),
        dueDate: dueDateTime,
        description: task.note || `Task: ${task.taskName}`,
        content: task.note || `Task: ${task.taskName}`,
        overdue: dueDate
          ? dueDate < new Date() && task.status !== "completed"
          : false,
        extra: {
          taskName: task.taskName,
          taskType: task.taskType,
          priority: task.priority,
          status: task.status,
          dueDate: task.dueDate,
          dueTime: task.dueTime,
          assignedTo: task.assignedTo,
          completedAt: task.completedAt,
          onComplete: async () => {
            try {
              console.log("Completing task:", task.id);
              const result: any = await dispatch(
                completeTask({
                  taskId: task.id,
                }),
              );

              if (result?.meta?.requestStatus === "fulfilled") {
                notify("Task completed successfully", "success");

                setActivities((prev) =>
                  prev.map((activity) =>
                    activity.id === 400000 + task.id && activity.type === "task"
                      ? {
                          ...activity,
                          extra: {
                            ...activity.extra,
                            status: "completed",
                          },
                        }
                      : activity,
                  ),
                );

                setTimeout(() => {
                  dispatch(
                    fetchTasks({
                      linkedModule: "company",
                      linkedModuleId: String(id),
                      page: 1,
                      size: 50,
                    }),
                  );
                }, 1000);
              } else {
                const errorMsg = result?.payload || "Failed to complete task";
                notify(String(errorMsg), "error");
              }
            } catch (error: any) {
              notify(error?.message || "Failed to complete task", "error");
            }
          },
        },
        isTicket: false,
      };
    });
  }, [tasks, id, currentUserName, dispatch]);

  const meetingActivities: Activity[] = useMemo(() => {
    return meetings.map((meeting: ReduxMeeting) => {
      const currentUser = getCurrentUserName() || "User";

      const customTitle = company
        ? `Meeting ${currentUser} and ${company.companyName}`
        : `Meeting ${currentUser}`;

      const organizerName =
        meeting.organizers
          ?.map((org) => `${org.firstName} ${org.lastName}`)
          .join(", ") || "Unknown Organizer";

      return {
        id: 500000 + meeting.id,
        type: "meeting" as const,
        title: customTitle,
        author: organizerName,
        date: formatActivityDate(
          new Date(`${meeting.startDate} ${meeting.startTime}`),
        ),
        description:
          meeting.note ||
          `Meeting scheduled for ${meeting.startDate} at ${meeting.startTime}`,
        content:
          meeting.note ||
          `Meeting scheduled for ${meeting.startDate} at ${meeting.startTime}`,
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
  }, [meetings, company]);

  const allActivities = [
    ...ticketActivities,
    ...noteActivities,
    ...callActivities,
    ...emailActivities,
    ...taskActivities,
    ...activities,
    ...meetingActivities,
  ];

  const getFilteredActivities = (type: ActivityType) => {
    if (type === "activity") return allActivities;

    const filtered = allActivities.filter((a) => a.type === type);
    return filtered;
  };

  const handleTicketCreated = (ticketData: any) => {
    const currentUser = getCurrentUserName() || "Current user";
    const ticketTitle =
      ticketData.title || `Ticket ${ticketData.ticketNumber || ticketData.id}`;

    const newTicketActivity: Activity = {
      id: 600000 + Date.now(),
      type: "ticket" as const,
      title: `${currentUser} created ${ticketTitle}`,
      author: "Ticket Activity",
      date: formatActivityDate(new Date()),
      description: ticketData.description || "No description",
      content: ticketData.description || "No description",
      extra: {
        priority: ticketData.priority,
        status: ticketData.status,
        ticketNumber: ticketData.ticketNumber,
        ticketId: ticketData.id,
      },
      isTicket: true,
    };

    setTicketActivities((prev) => [newTicketActivity, ...prev]);
    setActivities((prev) => [newTicketActivity, ...prev]);

    notify("Ticket created successfully", "success");
    setActiveTab("activity");
  };

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "newTicket" && e.newValue) {
        try {
          const ticketData = JSON.parse(e.newValue);
          if (ticketData.companyId === company?.id) {
            handleTicketCreated(ticketData);
            localStorage.removeItem("newTicket");
          }
        } catch (error) {
          console.error("Error processing new ticket:", error);
        }
      }
    };

    const handleMessage = (e: MessageEvent) => {
      if (
        e.data.type === "TICKET_CREATED" &&
        e.data.companyId === company?.id
      ) {
        handleTicketCreated(e.data.ticket);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("message", handleMessage);
    };
  }, [company?.id]);

  const handleCreateMeeting = async (meetingData: any): Promise<boolean> => {
    try {
      if (!company) {
        notify("No company selected", "error");
        return false;
      }

      console.log("📤 [MEETING CREATE] Starting meeting creation...");

      const authUserRaw = localStorage.getItem("auth_user");
      const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
      const currentUserId =
        authUser?.id || authUser?.userId || authUser?.userID;

      if (!currentUserId) {
        notify("User not found. Please log in again.", "error");
        return false;
      }

      console.log("📤 [MEETING CREATE] Current user ID:", currentUserId);

      const attendeeIds = meetingData.attendees.map(
        (attendee: any) => attendee.id,
      );

      console.log("📤 [MEETING CREATE] Extracted attendee IDs:", attendeeIds);

      const createData: CreateMeetingPayload = {
        title: meetingData.title,
        startDate: meetingData.startDate,
        startTime: meetingData.startTime,
        endTime: meetingData.endTime,
        location: meetingData.location,
        reminder: meetingData.reminder,
        note: meetingData.note,
        organizerIds: [Number(currentUserId)],
        attendeeIds,
        linkedModule: "company" as const,
        linkedModuleId: company.id,
      };

      console.log("📤 [MEETING CREATE] Final create data:", createData);

      const result = await dispatch(createMeeting(createData)).unwrap();

      console.log("✅ [MEETING CREATE] Success! Result:", result);
      notify("Meeting created successfully", "success");
      toggleModal("meeting", false);

      dispatch(
        fetchMeetings({
          linkedModule: "company",
          linkedModuleId: company.id,
          page: 1,
          size: 50,
        }),
      );

      return true;
    } catch (error: any) {
      console.error("❌ [MEETING CREATE] Error details:", error);
      notify("Failed to create meeting", "error");
      return false;
    }
  };

  const handleDeleteMeeting = async (meetingId: number) => {
    try {
      await dispatch(deleteMeeting(meetingId)).unwrap();
      notify("Meeting deleted successfully", "success");

      dispatch(
        fetchMeetings({
          linkedModule: "company",
          linkedModuleId: Number(id),
          page: 1,
          size: 50,
        }),
      );
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
    open: boolean,
  ) => {
    setShowModal((prev) => ({ ...prev, [type]: open }));
  };

  const handleFieldChange = (label: string, value: string | string[]) => {
    if (!editableCompany) return;

    const keyMap: Record<string, string> = {
      "Company Domain Name": "domain",
      "Company Name": "companyName",
      Industry: "industry",
      "Phone number": "phone",
      "Company Owner": "companyOwner",
      City: "city",
      "Country/Region": "country",
      "No of Employees": "employees",
      "Annual Revenue": "revenue",
      "Created Date": "createdDate",
    };

    const key = keyMap[label];
    if (!key) return;

    let val: any;
    if (key === "companyOwner") {
      val = Array.isArray(value) ? value : [value].filter(Boolean);
    } else {
      val = Array.isArray(value) ? value[0] : value;
    }

    setEditableCompany((prev: any) => ({ ...prev, [key]: val }));
  };

  const updateCompanyInBackend = async (companyData: any) => {
    try {
      const headers = getAuthHeaders();
      const companyId = Number(id);

      let ownerIds: number[] = [];
      if (companyData.companyOwner && companyData.companyOwner.length > 0) {
        ownerIds = companyData.companyOwner
          .map((ownerName: string) => {
            const user = userOptions.find(
              (opt) => opt.label === ownerName || opt.value === ownerName,
            );
            return user?.id;
          })
          .filter((id: number | undefined): id is number => id !== undefined);
      }

      const updateData = {
        companyName: companyData.companyName,
        domainName: companyData.domain,
        industryType: companyData.industry,
        phoneNumber: companyData.phone,
        city: companyData.city,
        country: companyData.country,
        noOfEmployees: parseInt(companyData.employees) || 0,
        annualRevenue: parseFloat(companyData.revenue?.replace("$", "")) || 0,

        ownerIds: ownerIds.length > 0 ? ownerIds : undefined,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/companies/${companyId}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(updateData),
        },
      );

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
      const success = await updateCompanyInBackend(editableCompany);

      if (success) {
        const fetchUpdatedCompany = async () => {
          try {
            const headers = getAuthHeaders();
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/companies/${id}`,
              { headers },
            );

            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data) {
                const companyData = result.data;
                const transformedCompany = {
                  id: companyData.id,
                  companyName: companyData.companyName || "",
                  industry: companyData.industryType || "",
                  phone: companyData.phoneNumber || "",
                  companyOwner: companyData.Owners
                    ? companyData.Owners.map((owner: any) =>
                        `${owner.firstName || ""} ${
                          owner.lastName || ""
                        }`.trim(),
                      )
                    : [],
                  domain: companyData.domainName || "",
                  city: companyData.city || "",
                  country: companyData.country || "",
                  employees: companyData.noOfEmployees?.toString() || "",
                  revenue: companyData.annualRevenue
                    ? `$${companyData.annualRevenue}`
                    : "",
                  createdDate: companyData.createdDate || companyData.createdAt,
                  rawData: companyData,
                };

                setCompany(transformedCompany);
                setEditableCompany(transformedCompany);
              }
            }
          } catch (error) {
            console.error("Error fetching updated company:", error);
          }
        };

        await fetchUpdatedCompany();
        setIsEditing(false);
        localStorage.setItem(
          "selectedCompany",
          JSON.stringify(editableCompany),
        );
        notify("Company details updated successfully", "success");
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      console.error("Save error:", error);
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

  const handleSaveSyncActivity = (type: ActivityType, data: any): boolean => {
    if (!company) return false;

    const currentUser = getCurrentUserName() || "Unknown";

    let title = "";
    let content = "";
    let extra: Record<string, any> | undefined = undefined;

    switch (type) {
      case "note":
        try {
          const authUserRaw = localStorage.getItem("auth_user");
          const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
          const currentUserId =
            authUser?.id || authUser?.userId || authUser?.userID || undefined;

          if (company?.id && data) {
            dispatch(
              createNoteThunk({
                content: String(data),
                userId: currentUserId,
                linkedTo: { type: "company", id: Number(company.id) },
              }),
            ).then(() =>
              dispatch(
                fetchNotes({
                  type: "company",
                  linkedTo: Number(company.id),
                  page: 1,
                  size: 50,
                }),
              ),
            );
          }
        } catch (error) {
          console.error("Error creating note:", error);
          notify("Failed to create note", "error");
          return false;
        }

        setActiveTab("activity");
        toggleModal("note", false);
        return true;

      case "email":
        const emailData = {
          ...data,
          to: data.to || getLeadEmailForCompany() || "",
        };

        try {
          const authUserRaw = localStorage.getItem("auth_user");
          const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
          const currentUserId =
            authUser?.id || authUser?.userId || authUser?.userID || undefined;

          if (!currentUserId) {
            notify("User ID not found. Please log in again.", "error");
            return false;
          }

          if (company?.id && emailData?.to && emailData?.subject) {
            const recipients = Array.isArray(emailData.to)
              ? emailData.to
              : emailData.to
                  .split(/[,\s;]+/)
                  .map((s: string) => s.trim())
                  .filter(Boolean);

            const cc = emailData.cc
              ? Array.isArray(emailData.cc)
                ? emailData.cc
                : emailData.cc
                    .split(/[,\s;]+/)
                    .map((s: string) => s.trim())
                    .filter(Boolean)
              : undefined;

            const bcc = emailData.bcc
              ? Array.isArray(emailData.bcc)
                ? emailData.bcc
                : emailData.bcc
                    .split(/[,\s;]+/)
                    .map((s: string) => s.trim())
                    .filter(Boolean)
              : undefined;

            const attachmentIds = emailData.attachments
              ? emailData.attachments
                  .map((att: any) => att.id)
                  .filter((id: any) => id)
              : undefined;

            dispatch(
              createEmailThunk({
                subject: emailData.subject,
                body: emailData.body || "",
                userId: Number(currentUserId),
                recipients: recipients,
                cc: cc,
                bcc: bcc,
                linkedTo: { type: "company", id: Number(company.id) },
                attachmentIds: attachmentIds,
              }),
            )
              .unwrap()
              .then(() => {
                notify("Email sent successfully", "success");
                dispatch(
                  fetchEmails({
                    type: "company",
                    linkedTo: Number(company.id),
                    page: 1,
                    size: 50,
                  }),
                );
              })
              .catch((error: any) => {
                console.error("Error creating email:", error);
                notify(error?.message || "Failed to send email", "error");
              });
          }
        } catch (error: any) {
          console.error("Error creating email:", error);
          notify(error?.message || "Failed to send email", "error");
          return false;
        }

        setActiveTab("activity");
        toggleModal("email", false);
        return true;

      case "call":
        title = `Call from ${currentUser}`;
        content = data?.summary || "Call logged";
        extra = {
          outcome: data?.outcome || "completed",
          duration: data?.outcome === "successful" ? "5 min" : null,
        };
        break;

      case "meeting":
        title = `Meeting: ${currentUser} with ${company.companyName}`;
        content = data?.note || `Meeting scheduled`;
        extra = {
          startDate: data?.startDate,
          startTime: data?.startTime,
          endTime: data?.endTime,
          location: data?.location,
          attendees: data?.attendees?.length || 0,
        };
        break;

      case "task":
        try {
          const authUserRaw = localStorage.getItem("auth_user");
          const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
          const currentUserId =
            authUser?.id || authUser?.userId || authUser?.userID;

          let assignedToId: number | null = null;

          if (typeof data?.assignedTo === "string") {
            const selectedUser = userOptions.find(
              (opt: { label: string; value: string; id?: number }) =>
                opt.value === data.assignedTo || opt.label === data.assignedTo,
            );
            if (selectedUser && selectedUser.id) {
              assignedToId = Number(selectedUser.id);
            } else {
              const parsed = Number(data.assignedTo);
              if (!isNaN(parsed) && parsed > 0) {
                assignedToId = parsed;
              }
            }
          } else if (data?.assignedTo && typeof data.assignedTo === "object") {
            if (data.assignedTo.id) {
              assignedToId = Number(data.assignedTo.id);
            } else if (data.assignedTo.value) {
              const selectedUser = userOptions.find(
                (opt: { label: string; value: string; id?: number }) =>
                  opt.value === data.assignedTo.value ||
                  opt.label === data.assignedTo.value,
              );
              if (selectedUser && selectedUser.id) {
                assignedToId = Number(selectedUser.id);
              } else {
                const parsed = Number(data.assignedTo.value);
                if (!isNaN(parsed) && parsed > 0) {
                  assignedToId = parsed;
                }
              }
            }
          }

          if (!assignedToId || isNaN(assignedToId)) {
            assignedToId = currentUserId ? Number(currentUserId) : null;
          }

          if (!assignedToId || isNaN(assignedToId)) {
            notify("Please select a valid user", "error");
            return false;
          }

          const assignedUser = userOptions.find(
            (u: { label: string; value: string; id?: number }) =>
              u.id === assignedToId,
          );

          if (company?.id) {
            const assignedUserName =
              assignedUser?.label || currentUserName || "Unknown";
            const dueDate = data?.dueDate ? new Date(data.dueDate) : null;
            const dueDateTime = formatTaskDueDateTime(
              data?.dueDate,
              data?.time,
            );

            const tempActivity: Activity = {
              id: Date.now(),
              type: "task" as const,
              title: `Task assigned to ${assignedUserName}`,
              author: assignedUserName,
              date: formatActivityDate(new Date()),
              dueDate: dueDateTime,
              description: data?.note || `Task: ${data?.name || ""}`,
              content: data?.note || `Task: ${data?.name || ""}`,
              overdue: dueDate ? dueDate < new Date() : false,
              extra: {
                taskName: data?.name || "",
                taskType: data?.type || "",
                priority: data?.priority || "",
                status: "pending",
                dueDate: data?.dueDate || null,
                dueTime: data?.time || null,
              },
              isTicket: false,
            };

            setActivities((prev) => {
              const nonTask = prev.filter((a) => a.type !== "task");
              return [...nonTask, tempActivity];
            });
            setActiveTab("activity");
            toggleModal("task", false);
            notify("Task created successfully", "success");

            dispatch(
              createTaskThunk({
                taskName: data?.name || "",
                dueDate: data?.dueDate || null,
                dueTime: data?.time || null,
                taskType: data?.type as any,
                priority: data?.priority as any,
                assignedToId: Number(assignedToId),
                note: data?.note || null,
                linkedModule: "company",
                linkedModuleId: String(company.id),
              }),
            ).then((result) => {
              if (createTaskThunk.fulfilled.match(result)) {
                const createdTask = result.payload;

                setActivities((prev) => {
                  return prev.map((activity) => {
                    if (
                      activity.id === tempActivity.id &&
                      activity.type === "task"
                    ) {
                      return {
                        ...activity,
                        id: createdTask?.id || activity.id,
                      };
                    }
                    return activity;
                  });
                });
              }

              dispatch(
                fetchTasks({
                  linkedModule: "company",
                  linkedModuleId: String(company.id),
                  page: 1,
                  size: 50,
                }),
              );
            });
            return true;
          }
        } catch (error) {
          console.error("Error creating task:", error);
          notify("Failed to create task", "error");
          return false;
        }
        return false;

      default:
        console.warn("Unhandled activity type:", type);
        return false;
    }

    if (type === "call" || type === "meeting" || type === "task") {
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
      setActiveTab("activity");
      toggleModal(type, false);
      notify(
        `${type.charAt(0).toUpperCase() + type.slice(1)} added successfully`,
        "success",
      );
      return true;
    }

    return true;
  };

  const handleInitiateCall = async () => {
    if (!company?.id) {
      notify("Company not loaded", "error");
      return;
    }

    setIsInitiatingCall(true);

    try {
      const authUserRaw = localStorage.getItem("auth_user");
      const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
      const userId = authUser?.id || authUser?.userId || authUser?.userID;

      if (!userId) {
        notify("User not found. Please log in again.", "error");
        setIsInitiatingCall(false);
        return;
      }

      const callerPhone =
        authUser?.phoneNumber ||
        authUser?.phone ||
        prompt("Enter your phone number (e.g., +15551234567):");

      if (!callerPhone) {
        notify("Phone number is required to make a call", "error");
        setIsInitiatingCall(false);
        return;
      }

      const result = await dispatch(
        initiateCall({
          userId: Number(userId),
          targetType: "company",
          targetId: String(company.id),
          callerPhone: String(callerPhone),
        }),
      ).unwrap();

      notify("Call initiated successfully", "success");
      setShowCallPopup(false);

      const newCallActivity: Activity = {
        id: result.callId || Date.now(),
        type: "call" as const,
        title: `Call to ${company.companyName}`,
        author: result.user?.name || currentUserName,
        date: formatActivityDate(
          result.startedAt ? new Date(result.startedAt) : new Date(),
        ),
        description: `Call ${
          result.result === "successful" ? "successful" : "unsuccessful"
        }`,
        content: `Call ${
          result.result === "successful"
            ? "completed successfully"
            : "was unsuccessful"
        }`,
        extra: {
          outcome: result.result,
          duration: result.durationSeconds || null,
          phoneNumber: result.target?.phoneNumber || null,
        },
        isTicket: false,
      };

      setActivities((prev) => {
        const nonCall = prev.filter(
          (a) => a.type !== "call" || a.id !== newCallActivity.id,
        );
        return [...nonCall, newCallActivity];
      });
      setActiveTab("activity");

      if (userId) {
        dispatch(fetchCallsByUser(Number(userId)));
      }
    } catch (error: any) {
      console.error("Error initiating call:", error);
      notify(error?.message || "Failed to initiate call", "error");
    } finally {
      setIsInitiatingCall(false);
    }
  };
  const getConnectedPersonForEmail = (): string | null => {
    const email = getLeadEmailForCompany();

    if (email) {
      console.log("📧 Final email being sent to EmailModal:", email);
      return `email:${email}`;
    }

    return company?.id ? `company:${company.id}` : null;
  };

  const debugLeads = () => {
    try {
      const leads = JSON.parse(localStorage.getItem("leads") || "[]");
      console.log("🔍 [LEADS DEBUG] All leads in localStorage:", leads);

      if (company?.rawData?.leadId) {
        const targetLead = leads.find(
          (l: any) => l.id === company.rawData.leadId,
        );
        console.log("🔍 [LEADS DEBUG] Target lead (ID: 8):", targetLead);
        console.log("🔍 [LEADS DEBUG] Target lead email:", targetLead?.email);

        if (targetLead?.email) {
          return targetLead.email;
        }
      }
    } catch (error) {
      console.error("🔍 [LEADS DEBUG] Error:", error);
    }
    return null;
  };

  const getLeadEmailForCompany = (): string | null => {
    if (!company) return null;

    console.log(`🔍 Finding email for: ${company.companyName}`);

    const actualEmail = findActualLeadEmail();
    if (actualEmail) return actualEmail;

    return getFallbackEmail();
  };

  const findActualLeadEmail = (): string | null => {
    if (company.rawData?.leadId) {
      const leads = JSON.parse(localStorage.getItem("leads") || "[]");
      const lead = leads.find((l: any) => l.id === company.rawData.leadId);
      if (lead?.email) return lead.email;
    }

    if (company.rawData?.Lead?.email) {
      return company.rawData.Lead.email;
    }

    return null;
  };

  const getFallbackEmail = (): string => {
    const companyName =
      company.companyName?.toLowerCase().replace(/\s+/g, ".") || "company";
    return `contact@${companyName}.com`;
  };

  const fetchLeadEmailFromBackend = async (
    leadId: number,
  ): Promise<string | null> => {
    try {
      console.log("🔍 [BACKEND] Fetching lead from backend, ID:", leadId);

      const headers = getAuthHeaders();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/leads/${leadId}`,
        {
          headers,
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch lead: ${response.status}`);
      }

      const result = await response.json();
      console.log("🔍 [BACKEND] Lead API response:", result);

      if (result.success && result.data) {
        const leadEmail = result.data.email;
        console.log("🔍 [BACKEND] Found lead email:", leadEmail);
        return leadEmail;
      }

      return null;
    } catch (error) {
      console.error("🔍 [BACKEND] Error fetching lead:", error);
      return null;
    }
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
      options: userOptions.map((opt) => opt.label),
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
              const filteredActivities = getFilteredActivities(tab);

              const sorted = filteredActivities.sort((a, b) => {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
              });

              const buttonLabel =
                tab === "call"
                  ? "Make a Phone Call"
                  : `Create ${label.slice(0, -1)}`;

              const handleCreate = () => {
                if (tab === "call") setShowCallPopup(true);
                else
                  toggleModal(tab as Exclude<ActivityType, "activity">, true);
              };

              return tab === "activity" ? (
                <ActivitySummaryView heading="Upcoming" activities={sorted} />
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
              <h3 className="text-lg font-semibold text-gray-800">
                Connecting to Agent
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                {isInitiatingCall || callsLoading
                  ? "Connecting to Agent..."
                  : "Click Connect to start the call"}
              </p>

              <div className="flex justify-center gap-3 mt-5">
                <button
                  onClick={() => {
                    if (!isInitiatingCall && !callsLoading) {
                      setShowCallPopup(false);
                      notify("Call cancelled", "info");
                    }
                  }}
                  disabled={isInitiatingCall || callsLoading}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIsInitiatingCall(true);

                    setTimeout(() => {
                      setShowCallPopup(false);
                      setIsInitiatingCall(false);
                      toggleModal("call", true);
                    }, 1500);
                  }}
                  disabled={isInitiatingCall || callsLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isInitiatingCall || callsLoading
                    ? "Connecting..."
                    : "Connect"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-full xl:w-[300px] flex-shrink-0 space-y-4 mt-[3px] xl:mr-2">
        <AISummaryCard type="company" className="border border-indigo-700" />
        <AttachmentView
          attachments={reduxAttachments.map((a) => ({
            id: a.id,
            name: a.filename || "Unnamed File",
            uploadedAt: a.createdAt
              ? new Date(a.createdAt).toLocaleString()
              : "",
            previewUrl:
              a.frontendUrl ||
              (a.fileUrl
                ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/${a.fileUrl}`
                : undefined),
            type: a.filename?.split(".").pop(),
          }))}
          onAdd={async (file, previewUrl) => {
            try {
              console.log("🚀 Starting upload for file:", file.name);
              const user = JSON.parse(localStorage.getItem("user") || "{}");

              if (!company?.id) {
                notify("Company not loaded", "error");
                return;
              }

              const result: any = await dispatch(
                createAttachments({
                  files: [file],
                  uploadedById: Number(user.id),
                  linkedType: "company",
                  linkedId: company.id,
                }),
              );

              console.log("📦 Upload dispatch result:", result);

              if (result?.meta?.requestStatus === "fulfilled") {
                notify("File uploaded successfully", "success");

                console.log("🔄 Refetching attachments...");
                setTimeout(async () => {
                  const fetchResult: any = await dispatch(
                    fetchAttachments({
                      linkedType: "company",
                      linkedId: company.id,
                    }),
                  );
                  console.log("📥 Fetch attachments result:", fetchResult);
                  console.log("📥 Fetched attachments:", fetchResult?.payload);
                }, 1000);
              } else {
                console.error(
                  "❌ Upload failed:",
                  result?.error || result?.payload,
                );
                const errorMsg =
                  result?.payload?.message ||
                  result?.error?.message ||
                  "Failed to upload file";
                notify(errorMsg, "error");
              }
            } catch (err: any) {
              console.error("💥 Upload exception:", err);
              notify(err.message || "Failed to upload file", "error");
            }
          }}
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
        userOptions={userOptions}
        onSave={(data: any): boolean => handleSaveSyncActivity("task", data)}
      />

      <EmailModal
        isOpen={showModal.email}
        onClose={() => toggleModal("email", false)}
        onSend={(data) => {
          handleSaveSyncActivity("email", data);
          return true;
        }}
        connectedPerson={getConnectedPersonForEmail() || undefined}
        recordAttachments={attachments.map((a) => ({
          id: a.id,
          name: a.name,
          url: a.previewUrl,
        }))}
        onAttachToRecord={async (file) => {
          notify(`${file.name} attached to email`, "info");
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
