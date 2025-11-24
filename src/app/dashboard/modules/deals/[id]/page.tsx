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
import {
  formatActivityDate,
  formatDisplayDateTime,
  formatDisplayDate,
} from "@/app/lib/date";
import ActivitySummaryView from "@/components/crm/ActivitySummaryView";
import { AISummaryCard } from "@/components/ai/AISummaryCard";
import { calculateDuration, getEntityEmail } from "@/app/lib/utils";
import { ActivityItem } from "@/components/crm/ActivitySummaryView";
import { getCurrentUserName } from "@/app/lib/auth";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchNotes, createNote as createNoteThunk } from "@/store/slices/activity/notesSlice";
import { initiateCall, fetchCallsByUser } from "@/store/slices/activity/callSlice";
import { fetchTasks, createTask as createTaskThunk, completeTask } from "@/store/slices/activity/taskSlice";
import { fetchEmails, createEmail as createEmailThunk } from "@/store/slices/activity/emailSlice";
import { 
  fetchAttachments, 
  createAttachments, 
  deleteAttachment 
} from "@/store/slices/activity/attachmentSlice";
import {
  fetchMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  Meeting as ReduxMeeting,
  CreateMeetingPayload,
} from "@/store/slices/activity/meetingSlice";

type ActivityType = "note" | "call" | "task" | "email" | "meeting";

type Activity = {
  id: string;
  type: ActivityType;
  title: string;
  author: string;
  date: string;
  dueDate?: string;
  description?: string;
  content?: string;
  overdue?: boolean;
  extra?: Record<string, any>;
  isTicket?: boolean;
};

 
const fetchDealByIdAPI = async (id: string) => {
  try {
    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
    
    if (!BASE_URL || !token) throw new Error("Missing API configuration");

    const response = await fetch(`${BASE_URL}/api/v1/deal/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to fetch deal");

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching deal:", error);
    throw error;
  }
};

const updateDealAPI = async (id: string, dealData: any) => {
  try {
    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
    
    if (!BASE_URL || !token) throw new Error("Missing API configuration");

    console.log("🔄 Updating deal with data:", dealData);

    const response = await fetch(`${BASE_URL}/api/v1/deal/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
      },
      body: JSON.stringify(dealData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to update deal");
    }

    const updateResult = await response.json();
    console.log("✅ Update response:", updateResult); 

    const dealResponse = await fetch(`${BASE_URL}/api/v1/deal/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
      },
    });

    if (!dealResponse.ok) {
      throw new Error("Failed to fetch updated deal");
    }

    const dealDataResult = await dealResponse.json();
    console.log("✅ Full updated deal data:", dealDataResult); 
    
    return dealDataResult.data;
  } catch (error) {
    console.error("❌ Error updating deal:", error);
    throw error;
  }
};

const fetchDealsAPI = async () => {
  try {
    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
    
    if (!BASE_URL || !token) throw new Error("Missing API configuration");

    const response = await fetch(`${BASE_URL}/api/v1/deal`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to fetch deals");

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching deals:", error);
    throw error;
  }
};


const transformDeal = (deal: any) => {
  let leadName = "";
  let associatedLeadId = "";

  if (deal.lead) {
    leadName =
      deal.lead.name ||
      `${deal.lead.firstName || ""} ${deal.lead.lastName || ""}`.trim() ||
      deal.lead.leadName ||
      "";
    associatedLeadId = String(deal.lead.id);
  } else if (deal.associatedLead) {
    leadName =
      deal.associatedLead.name ||
      `${deal.associatedLead.firstName || ""} ${deal.associatedLead.lastName || ""}`.trim() ||
      deal.associatedLead.leadName ||
      "";
    associatedLeadId = String(deal.associatedLead.id);
  } else if (deal.leadName) {
    leadName = deal.leadName;
    associatedLeadId = deal.leadId ? String(deal.leadId) : "";
  }

  return {
    id: deal.id,
    name: deal.dealName || deal.name || "",
    stage: deal.dealStage || deal.stage || "",
    closeDate: deal.closeDate || "",
    amount: deal.amount || "",
    priority: deal.priority || "",
    createdDate: deal.createdAt || deal.createdDate || new Date().toISOString(),
    description: deal.description || "",
    accountName: deal.accountName || "",
    owner: deal.dealOwner
      ? Array.isArray(deal.dealOwner)
        ? deal.dealOwner.map((u: any) =>
            u
              ? `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                u.name ||
                u.email ||
                `User ${u.id}`
              : "Unknown"
          )
        : []
      : deal.owner || [],
    ownerIds: Array.isArray(deal.dealOwner)
      ? deal.dealOwner.map((u: any) => u.id)
      : deal.ownerIds || [],
    associatedLead: associatedLeadId,
    lead: deal.lead || deal.associatedLead || null,
    leadName: leadName,
    associatedLeadName: leadName,
  };
};

export default function DealDetailPage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const { items: notes, loading: notesLoading } = useAppSelector((s) => s.notes);
  const { items: calls, loading: callsLoading } = useAppSelector((s) => s.calls);
  const { items: tasks, loading: tasksLoading } = useAppSelector((s) => s.tasks);
  const { items: emails, loading: emailsLoading } = useAppSelector((s) => s.emails);
  const { items: attachmentsFromStore, loading: attachmentsLoading } = useAppSelector((s) => s.attachments);
  const { items: meetings, loading: meetingsLoading, error: meetingsError } = useAppSelector((s) => s.meetings);

  const [deal, setDeal] = useState<any>(null);
  const [userOptions, setUserOptions] = useState<Array<{ label: string; value: string; id?: number }>>([]);
  const [editableDeal, setEditableDeal] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<ActivityType | "activity">("activity");
  const [showModal, setShowModal] = useState<Record<ActivityType, boolean>>({
    note: false,
    call: false,
    task: false,
    email: false,
    meeting: false,
  });
  const [cardKey, setCardKey] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [showCallPopup, setShowCallPopup] = useState(false);
  const [isInitiatingCall, setIsInitiatingCall] = useState(false);

  
  const getConnectedPerson = (): string | null => {
    if (!deal) return null;
    if (deal.lead?.name) return deal.lead.name;
    if (deal.leadName && deal.leadName.trim()) return deal.leadName.trim();
    return deal.name || deal.dealName || null;
  };

  
  const getConnectedPersonForEmail = (): string | null => {
    if (!deal) return null;
    if (deal.lead?.email) return `email:${deal.lead.email}`;
    if (deal.lead?.id) return `lead:${deal.lead.id}`;
    if (deal.leadName && deal.leadName.trim()) {
      try {
        const leads = JSON.parse(localStorage.getItem("leads") || "[]");
        const lead = leads.find((l: any) => 
          (l.leadName || l.name) && (l.leadName || l.name).trim() === deal.leadName.trim()
        );
        if (lead?.id) return `lead:${lead.id}`;
      } catch (error) {
        console.error("Error finding lead:", error);
      }
      return deal.leadName.trim();
    }
    return deal.id ? `deal:${deal.id}` : null;
  };

  const getCallTargetName = (backendTargetName?: string | null): string => {
    if (!deal) return backendTargetName || "Deal";
    if (deal.lead?.name) return deal.lead.name;
    if (deal.leadName && deal.leadName.trim()) return deal.leadName.trim();
    if (backendTargetName) {
      const dealName = deal.name || deal.dealName || "";
      if (backendTargetName !== dealName) return backendTargetName;
    }
    return deal.name || deal.dealName || "Deal";
  };

  const currentUserName = getCurrentUserName();

  const formatTaskDueDateTime = (dueDate: string | null | undefined, dueTime: string | null | undefined): string => {
    const date = dueDate ? new Date(dueDate) : null;
    const time = dueTime || "";
    if (date && time) return `${formatActivityDate(date)} ${time}`;
    if (date) return formatActivityDate(date);
    return "No due date";
  };

 
  useEffect(() => {
    if (!id) return;
    dispatch(
      fetchNotes({
        type: "deal",
        linkedTo: Number(id),
        page: 1,
        size: 50,
      })
    );
  }, [dispatch, id]);


  useEffect(() => {
    if (!id) return;
    dispatch(
      fetchEmails({
        type: "deal",
        linkedTo: Number(id),
        page: 1,
        size: 50,
      })
    );
  }, [dispatch, id]);

  useEffect(() => {
    if (!id) return;
    dispatch(
      fetchTasks({
        linkedModule: "deal",
        linkedModuleId: String(id),
        page: 1,
        size: 50,
      })
    );
  }, [dispatch, id]);

  useEffect(() => {
    if (!id) return;
    dispatch(
      fetchAttachments({
        linkedType: "deal",
        linkedId: String(id),
      })
    );
  }, [dispatch, id]);

 
  useEffect(() => {
    if (!id) return;
    
    dispatch(
      fetchMeetings({
        linkedModule: "deal" as const,
        linkedModuleId: Number(id),
        page: 1,
        size: 50,
      })
    );
  }, [dispatch, id]);


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
        const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
        if (!BASE_URL || !token) return;

        const headers: HeadersInit = {
          "Content-Type": "application/json",
          Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
        };

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
    if (meetingsError) {
      notify(meetingsError, "error");
    }
  }, [meetingsError]);


  useEffect(() => {
    if (!notes) return;
    const uniqueNotes = Array.from(
      new Map(notes.map((n) => [n.id, n])).values()
    );
    const mapped = uniqueNotes.map((n) => ({
      id: `note-${n.id}`,
      type: "note" as ActivityType,
      title: `Note${n.owner?.name ? ` by ${n.owner.name}` : ""}`,
      author: n.owner?.name || currentUserName,
      date: formatActivityDate(n.createdAt ? new Date(n.createdAt) : new Date()),
      description: n.content,
      content: n.content,
      extra: {},
      isTicket: false,
    }));
    setActivities((prev) => {
      const nonNote = prev.filter((a) => a.type !== "note");
      const noteMap = new Map<string, Activity>();
      
      prev.filter((a) => a.type === "note").forEach((note) => {
        noteMap.set(note.id, note);
      });
      
      mapped.forEach((m) => {
        noteMap.set(m.id, m);
      });
      
      return [...Array.from(noteMap.values()), ...nonNote];
    });
  }, [notes, currentUserName]);

 
  useEffect(() => {
    if (!calls || !id) return;
    
    const dealCalls = calls.filter((call) => {
      return call.target?.type === "deal" && String(call.target.id) === String(id);
    });

    const uniqueCalls = Array.from(
      new Map(dealCalls.map((call) => [call.callId, call])).values()
    );

    const mapped = uniqueCalls.map((call) => {
      const callTargetName = getCallTargetName(call.target?.name);

      return {
        id: `call-${call.callId}`,
        type: "call" as ActivityType,
        title: `Call to ${callTargetName}`,
        author: call.user?.name || currentUserName,
        date: formatActivityDate(call.startedAt ? new Date(call.startedAt) : new Date()),
        description: `Call ${call.result === "successful" ? "successful" : "unsuccessful"}`,
        content: `Call ${call.result === "successful" ? "completed successfully" : "was unsuccessful"}`,
        extra: {
          outcome: call.result,
          duration: call.durationSeconds,
          phoneNumber: call.target?.phoneNumber,
        },
        isTicket: false,
      };
    });

    setActivities((prev) => {
      const nonCall = prev.filter((a) => a.type !== "call");
      const callMap = new Map<string, Activity>();
      
      mapped.forEach((m) => {
        callMap.set(m.id, m);
      });
      
      const optimisticCalls = prev.filter(
        (a) => a.type === "call" && a.id.startsWith("temp-call-")
      );
      const backendCallIds = new Set(mapped.map((c) => c.id));
      const unmatchedOptimistic = optimisticCalls.filter(
        (opt) => !backendCallIds.has(opt.id)
      );
      
      unmatchedOptimistic.forEach((opt) => {
        callMap.set(opt.id, opt);
      });
      
      return [...nonCall, ...Array.from(callMap.values())];
    });
  }, [calls, id, deal, currentUserName]);

  useEffect(() => {
    if (!tasks || !id) return;

    console.log("📝 Mapping tasks to activities:", tasks); 

    const dealTasks = tasks.filter((task) => {
      const matches = task.linkedModule === "deal" && String(task.linkedModuleId) === String(id);
      console.log(`Task ${task.id} linked to deal ${id}:`, matches); 
      return matches;
    });

    console.log("📝 Deal tasks after filtering:", dealTasks); 

    const mapped = dealTasks.map((task) => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      const dueDateTime = formatTaskDueDateTime(task.dueDate, task.dueTime);

      const taskActivity: Activity = {
        id: `task-${task.id}`,
        type: "task" as ActivityType,
        title: task.taskName || `Task assigned to ${task.assignedTo?.name || currentUserName || "Unknown"}`,
        author: task.assignedTo?.name || currentUserName,
        date: formatActivityDate(task.createdAt ? new Date(task.createdAt) : new Date()),
        dueDate: dueDateTime,
        description: task.note || `Task: ${task.taskName}`,
        content: task.note || `Task: ${task.taskName}`,
        overdue: dueDate ? dueDate < new Date() && task.status !== "completed" : false,
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
              const result: any = await dispatch(completeTask({ 
                taskId: task.id 
              }));
              
              if (result?.meta?.requestStatus === "fulfilled") {
                notify("Task completed successfully", "success");
                
                setActivities(prev => 
                  prev.map(activity => 
                    activity.id === `task-${task.id}` && activity.type === "task"
                      ? {
                          ...activity,
                          extra: {
                            ...activity.extra,
                            status: "completed"
                          }
                        }
                      : activity
                  )
                );

                setTimeout(() => {
                  dispatch(fetchTasks({ 
                    linkedModule: "deal", 
                    linkedModuleId: String(id),
                    page: 1,
                    size: 50,
                  }));
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

      console.log("📝 Mapped task activity:", taskActivity);
      return taskActivity;
    });

    console.log("📝 All mapped task activities:", mapped); 

    setActivities((prev) => {
      const nonTask = prev.filter((a) => a.type !== "task");
      const optimisticTasks = prev.filter(
        (a) => a.type === "task" && a.id.startsWith("temp-task-")
      );
      const backendTaskIds = new Set(mapped.map((t) => t.id));
      const unmatchedOptimistic = optimisticTasks.filter(
        (opt) => !backendTaskIds.has(opt.id)
      );
      
      const preservedTasks = mapped.map(newTask => {
        if (newTask.extra?.status === "completed") {
          return newTask;
        }
        const existing = prev.find(
          a => a.id === newTask.id && a.type === "task" && a.extra?.status === "completed"
        );
        if (existing && existing.extra?.status === "completed") {
          return {
            ...newTask,
            extra: {
              ...newTask.extra,
              status: "completed"
            }
          };
        }
        return newTask;
      });
      
      const result = [...nonTask, ...preservedTasks, ...unmatchedOptimistic];
      console.log("📝 Final activities after task update:", result.filter(a => a.type === "task")); 
      return result;
    });
  }, [tasks, id, currentUserName, dispatch]);

 
  useEffect(() => {
    if (!emails || !id) return;

    const dealEmails = emails.filter((email) => {
      return email.linkedTo?.type === "deal" && String(email.linkedTo.id) === String(id);
    });

    const uniqueEmails = Array.from(
      new Map(dealEmails.map((e) => [e.id, e])).values()
    );

    const mapped = uniqueEmails.map((email) => {
      const recipients = Array.isArray(email.recipients) ? email.recipients : [];
      const recipientsStr =
        recipients.length > 0
          ? recipients.join(", ")
          : email.owner?.email || "Unknown recipient";
      const authorName = email.owner?.name || currentUserName || "Unknown";
      const subject = (email.subject || "No Subject").trim();

      return {
        id: `email-${email.id}`,
        type: "email" as ActivityType,
        title: `Logged Email – ${subject} by ${authorName}`,
        author: authorName,
        date: formatActivityDate(
          email.sentAt
            ? new Date(email.sentAt)
            : new Date(email.createdAt || new Date())
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

    setActivities((prev) => {
      const nonEmail = prev.filter((a) => a.type !== "email");
      const emailMap = new Map<string, Activity>();
      
      prev.filter((a) => a.type === "email").forEach((email) => {
        emailMap.set(email.id, email);
      });
      
      mapped.forEach((m) => {
        emailMap.set(m.id, m);
      });
      
      return [...Array.from(emailMap.values()), ...nonEmail];
    });
  }, [emails, id, currentUserName]);

  useEffect(() => {
    if (!meetings || !id) return;

    const mapped = meetings.map((meeting: ReduxMeeting) => {
      const currentUser = getCurrentUserName() || "User";
      const dealName = deal?.name || deal?.dealName || "Deal";

      const customTitle = `Meeting ${currentUser} and ${dealName}`;
      const organizerName = meeting.organizers
        ?.map((org) => `${org.firstName} ${org.lastName}`)
        .join(", ") || "Unknown Organizer";

      const attendeeNames = meeting.attendees
        ?.map((att) => `${att.firstName} ${att.lastName}`)
        .join(", ") || "";

      return {
        id: `meeting-${meeting.id}`,
        type: "meeting" as ActivityType,
        title: customTitle,
        author: organizerName,
        date: formatActivityDate(
          new Date(`${meeting.startDate} ${meeting.startTime}`)
        ),
        description: meeting.note || `Meeting scheduled for ${meeting.startDate} at ${meeting.startTime}`,
        content: meeting.note || `Meeting scheduled for ${meeting.startDate} at ${meeting.startTime}`,
        extra: {
          duration: meeting.duration,
          location: meeting.location,
          attendees: meeting.totalcount,
          organizer: organizerName,
          originalTitle: meeting.title,
          attendeeNames: attendeeNames,
        },
        isTicket: false,
      };
    });

    setActivities((prev) => {
      const nonMeeting = prev.filter((a) => a.type !== "meeting");
      const meetingMap = new Map<string, Activity>();
      
      mapped.forEach((m) => {
        meetingMap.set(m.id, m);
      });
      
      const optimisticMeetings = prev.filter(
        (a) => a.type === "meeting" && a.id.startsWith("temp-meeting-")
      );
      const backendMeetingIds = new Set(mapped.map((m) => m.id));
      const unmatchedOptimistic = optimisticMeetings.filter(
        (opt) => !backendMeetingIds.has(opt.id)
      );
      
      unmatchedOptimistic.forEach((opt) => {
        meetingMap.set(opt.id, opt);
      });
      
      return [...nonMeeting, ...Array.from(meetingMap.values())];
    });
  }, [meetings, id, deal, currentUserName]);

  
  useEffect(() => {
    const loadDeal = async () => {
      if (!id) return;
      
      try {
        
        const storedDeals = localStorage.getItem("deals");
        if (storedDeals) {
          const deals = JSON.parse(storedDeals);
          const found = deals.find((d: any) => String(d.id) === String(id));
          if (found) {
            const editableData = {
              ...found,
              owner: Array.isArray(found.owner) ? found.owner : [found.owner].filter(Boolean),
            };
            setDeal(found);
            setEditableDeal(editableData);
            return;
          }
        }

       
        const dealData = await fetchDealByIdAPI(String(id));
        const transformedDeal = transformDeal(dealData);
        const normalized = {
          ...transformedDeal,
          owner: Array.isArray(transformedDeal.owner) ? transformedDeal.owner : [],
          leadName: transformedDeal.lead?.name || transformedDeal.leadName || "",
          lead: transformedDeal.lead ? { ...transformedDeal.lead } : null,
        };
        
        setDeal(normalized);
        setEditableDeal(normalized);
      } catch (error) {
        console.error("Error loading deal:", error);
        notify("Failed to load deal", "error");
      }
    };

    loadDeal();
  }, [id]);

 
  useEffect(() => {
    if (deal?.stage) {
      setCardKey((prev) => prev + 1);
      try {
        const key = `crm_deals_${deal.id}`;
        const existing = localStorage.getItem(key);
        const data = existing ? JSON.parse(existing) : {};
        if (data.stage !== deal.stage) {
          data.stage = deal.stage;
          localStorage.setItem(key, JSON.stringify(data));
        }
      } catch {}
    }
  }, [deal?.stage]);

 
  const deduplicatedActivities = useMemo(() => {
    const seen = new Set<string>();
    const result: Activity[] = [];
    
    activities.forEach((activity) => {
      const key = `${activity.type}-${activity.id}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        result.push(activity);
      }
    });
    
    return result;
  }, [activities]);

  
  const handleCreateMeeting = async (meetingData: any): Promise<boolean> => {
    try {
      if (!deal?.id) {
        notify("No deal selected", "error");
        return false;
      }

      const authUserRaw = localStorage.getItem("auth_user");
      const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
      const currentUserId = authUser?.id || authUser?.userId || authUser?.userID;

      if (!currentUserId) {
        notify("User not found. Please log in again.", "error");
        return false;
      }

      const attendeeIds: number[] = [];
      if (meetingData.attendees && Array.isArray(meetingData.attendees)) {
        for (const attendee of meetingData.attendees) {
          if (typeof attendee === 'object' && attendee.id) {
            attendeeIds.push(attendee.id);
          } else {
            const user = userOptions.find(
              opt => opt.value === attendee || opt.label === attendee
            );
            if (user?.id) {
              attendeeIds.push(user.id);
            }
          }
        }
      }

      const createData: CreateMeetingPayload = {
        title: meetingData.title,
        startDate: meetingData.startDate,
        startTime: meetingData.startTime,
        endTime: meetingData.endTime,
        location: meetingData.location,
        reminder: meetingData.reminder || "15 minutes",
        note: meetingData.note || "",
        organizerIds: [Number(currentUserId)],
        attendeeIds,
        linkedModule: "deal" as const,
        linkedModuleId: deal.id,
      };

      const result = await dispatch(createMeeting(createData)).unwrap();

      notify("Meeting created successfully", "success");
      toggleModal("meeting", false);

      dispatch(fetchMeetings({
        linkedModule: "deal",
        linkedModuleId: deal.id,
        page: 1,
        size: 50,
      }));

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
      
      dispatch(fetchMeetings({
        linkedModule: "deal",
        linkedModuleId: Number(id),
        page: 1,
        size: 50,
      }));
    } catch (error) {
      console.error("Failed to delete meeting:", error);
      notify("Failed to delete meeting", "error");
    }
  };

  const simpleActivities: ActivityItem[] = useMemo(() => {
  const now = new Date();
  const dealCreatedDate = deal?.createdDate
    ? new Date(deal.createdDate)
    : now;

  const allActivities = [
    {
      id: "deal-activity-1",
      type: "deal" as const,
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
      description: `${currentUserName} moved deal to ${deal?.stage || "New"} stage`,
    },
    {
      id: "deal-creation-2",
      type: "deal" as const,
      title: "",
      author: currentUserName,
      date: dealCreatedDate.toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      description: `The deal was created by ${currentUserName}`,
    },
    ...deduplicatedActivities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      author: activity.author,
      date: activity.date,
      description: activity.description || activity.content || "",
      dueDate: activity.dueDate,
      content: activity.content,
      extra: activity.extra,
      overdue: activity.overdue,
    })),
  ];

  return allActivities.sort((a, b) => {
    if (a.id === "deal-activity-1" && b.id === "deal-creation-2") return -1;
    if (a.id === "deal-creation-2" && b.id === "deal-activity-1") return 1;

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
}, [currentUserName, deal?.stage, deal?.createdDate, deduplicatedActivities]);

  const priorityOptions = ["Low", "Medium", "High", "Critical"];
  const stageOptions = ["Presentation Scheduled", "Qualified to Buy", "Contract Sent", "Closed Won", "Appointment Scheduled", "Decision Maker Bought In", "Closed Lost", "Negotiation"];

  const ownerOptions = userOptions.map((opt) => opt.value || opt.label);

  const toggleModal = (type: ActivityType, open: boolean) => {
    setShowModal((prev) => ({ ...prev, [type]: open }));
  };

 
  const handleInitiateCall = async () => {
    if (!deal?.id) {
      notify("Deal not loaded", "error");
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

      const callerPhone = authUser?.phoneNumber || authUser?.phone || prompt("Enter your phone number (e.g., +15551234567):");

      if (!callerPhone) {
        notify("Phone number is required to make a call", "error");
        setIsInitiatingCall(false);
        return;
      }

      const result = await dispatch(
        initiateCall({
          userId: Number(userId),
          targetType: "deal",
          targetId: String(deal.id),
          callerPhone: String(callerPhone),
        })
      ).unwrap();

      notify("Call initiated successfully", "success");
      setShowCallPopup(false);
      
      const callTargetName = getCallTargetName(result.target?.name);

      const newCallActivity: Activity = {
        id: `temp-call-${Date.now()}`,
        type: "call" as ActivityType,
        title: `Call to ${callTargetName}`,
        author: result.user?.name || currentUserName,
        date: formatActivityDate(result.startedAt ? new Date(result.startedAt) : new Date()),
        description: `Call ${result.result === "successful" ? "successful" : "unsuccessful"}`,
        content: `Call ${result.result === "successful" ? "completed successfully" : "was unsuccessful"}`,
        extra: {
          outcome: result.result,
          duration: result.durationSeconds || null,
          phoneNumber: result.target?.phoneNumber || null,
        },
        isTicket: false,
      };

      setActivities((prev) => {
        const nonCall = prev.filter((a) => a.type !== "call" || a.id !== newCallActivity.id);
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

  const handleSaveActivity = (type: ActivityType, data: any): boolean => {
    let title = "";
    let content = "";
    let extra: Record<string, any> = {};

    switch (type) {
      case "note":
        title = `Note by ${currentUserName}`;
        content = data;
        try {
          const authUserRaw = localStorage.getItem("auth_user");
          const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
          const currentUserId =
            authUser?.id || authUser?.userId || authUser?.userID || undefined;
          if (deal?.id && content) {
            dispatch(
              createNoteThunk({
                content: String(content),
                userId: currentUserId,
                linkedTo: { type: "deal", id: Number(deal.id) },
              })
            ).then(() =>
              dispatch(
                fetchNotes({
                  type: "deal",
                  linkedTo: Number(deal.id),
                  page: 1,
                  size: 50,
                })
              )
            );
          }
        } catch {}
        break;

      case "email":
        title = `Logged Email – ${data?.subject || "No Subject"} by ${currentUserName}`;
        content = data?.body || "Email sent successfully";
        try {
          const authUserRaw = localStorage.getItem("auth_user");
          const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
          const currentUserId =
            authUser?.id || authUser?.userId || authUser?.userID || undefined;

          if (!currentUserId) {
            notify("User ID not found. Please log in again.", "error");
            return false;
          }

          if (deal?.id && data?.to && data?.subject) {
            const recipients = Array.isArray(data.to)
              ? data.to
              : data.to.split(/[,\s;]+/).map((s: string) => s.trim()).filter(Boolean);

            const cc = data.cc
              ? (Array.isArray(data.cc)
                  ? data.cc
                  : data.cc.split(/[,\s;]+/).map((s: string) => s.trim()).filter(Boolean))
              : undefined;

            const bcc = data.bcc
              ? (Array.isArray(data.bcc)
                  ? data.bcc
                  : data.bcc.split(/[,\s;]+/).map((s: string) => s.trim()).filter(Boolean))
              : undefined;

            const attachmentIds = data.attachments
              ? data.attachments.map((att: any) => att.id).filter((id: any) => id)
              : undefined;

            dispatch(
              createEmailThunk({
                subject: data.subject,
                body: data.body || "",
                userId: Number(currentUserId),
                recipients: recipients,
                cc: cc,
                bcc: bcc,
                linkedTo: { type: "deal", id: Number(deal.id) },
                attachmentIds: attachmentIds,
              })
            )
              .unwrap()
              .then(() => {
                notify("Email sent successfully", "success");
                dispatch(
                  fetchEmails({
                    type: "deal",
                    linkedTo: Number(deal.id),
                    page: 1,
                    size: 50,
                  })
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
        break;

      case "call":
        title = `Call from ${currentUserName}`;
        content = data?.note || data?.summary;
        break;

      case "task":
        try {
          const authUserRaw = localStorage.getItem("auth_user");
          const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
          const currentUserId = authUser?.id || authUser?.userId || authUser?.userID;

          let assignedToId: number | null = null;

          if (typeof data?.assignedTo === "string") {
            const selectedUser = userOptions.find(
              opt => opt.value === data.assignedTo || opt.label === data.assignedTo
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
                opt => opt.value === data.assignedTo.value || opt.label === data.assignedTo.value
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

          const assignedUser = userOptions.find((u) => u.id === assignedToId);

          if (deal?.id) {
            const assignedUserName = assignedUser?.label || currentUserName || "Unknown";
            const dueDate = data?.dueDate ? new Date(data.dueDate) : null;
            const dueDateTime = formatTaskDueDateTime(data?.dueDate, data?.time);

            const tempActivity: Activity = {
              id: `temp-task-${Date.now()}`,
              type: "task" as ActivityType,
              title: data?.name || `Task assigned to ${assignedUserName}`,
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
            toggleModal(type, false);
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
                linkedModule: "deal",
                linkedModuleId: String(deal.id),
              })
            ).then((result) => {
              if (createTaskThunk.fulfilled.match(result)) {
                const createdTask = result.payload;
                
                setActivities((prev) => {
                  return prev.map((activity) => {
                    if (activity.id === tempActivity.id && activity.type === "task") {
                      return {
                        ...activity,
                        id: `task-${createdTask?.id}` || activity.id,
                      };
                    }
                    return activity;
                  });
                });
              }

              dispatch(
                fetchTasks({
                  linkedModule: "deal",
                  linkedModuleId: String(deal.id),
                  page: 1,
                  size: 50,
                })
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

      case "meeting":
        return handleCreateMeeting(data);
    }

    if (type === "note" || type === "email") {
      setActiveTab("activity");
      toggleModal(type, false);
      return true;
    }

    const newActivity: Activity = {
      id: `temp-${type}-${Date.now()}`,
      type,
      title,
      author: currentUserName,
      date: formatActivityDate(new Date()),
      dueDate: formatActivityDate(new Date()),
      description: content,
      content,
      extra,
      isTicket: false,
    };

    setActivities((prev) => {
      const filtered = prev.filter((a) => a.id !== newActivity.id);
      return [newActivity, ...filtered];
    });
    setActiveTab("activity");
    toggleModal(type, false);
    notify(
      `${type.charAt(0).toUpperCase() + type.slice(1)} added successfully`,
      "success"
    );
    return true;
  };

  
  const mapOwnerNamesToUserIds = async (ownerNames: string[]): Promise<number[]> => {
    if (!ownerNames || ownerNames.length === 0) return [];

    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!BASE_URL) return [];

      const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
      if (!token) return [];

      const headers = {
        "Content-Type": "application/json",
        Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
      };

      const res = await fetch(`${BASE_URL}/api/auth/users`, { headers });

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
      }
    } catch (error) {
      console.error("Error mapping owner names to user IDs:", error);
    }

    return [];
  };

 
const handleSaveDeal = async () => {
  if (!editableDeal || !id) {
    notify("No deal data to save", "error");
    return;
  }

  try {
    const ownerNames = Array.isArray(editableDeal.owner)
      ? editableDeal.owner
      : editableDeal.owner
      ? [editableDeal.owner]
      : [];

    const ownerIds = ownerNames.length > 0
      ? await mapOwnerNamesToUserIds(ownerNames)
      : [];

   
    const updateData: any = {
      description: editableDeal.description || "",
      priority: editableDeal.priority || "",
      dealStage: editableDeal.stage || "",
      amount: editableDeal.amount || 0,
    };

    if (ownerIds.length > 0) {
      updateData.ownerIds = ownerIds;
    }

    console.log("🔄 Saving deal with data:", updateData);

    const updatedDealData = await updateDealAPI(String(id), updateData);
    const transformedDeal = transformDeal(updatedDealData);
    
    setDeal(transformedDeal);
    setEditableDeal(transformedDeal);

    setIsEditing(false);
    notify("Deal details updated successfully", "success");
  } catch (error: any) {
    console.error("Failed to update deal:", error);
    notify("Failed to save changes: " + (error.message || "Unknown error"), "error");
  }
};

 
const handleStatusUpdate = async (field: string, value: string) => {
  if (field === "status") {
    try {
      console.log("🔄 handleStatusUpdate called with:", field, value);
      
     
      const updateData = {
        dealStage: value 
      };

      const updatedDealData = await updateDealAPI(String(id), updateData);
      console.log("✅ Updated deal data received:", updatedDealData);
      
      const transformedDeal = transformDeal(updatedDealData);
      console.log("✅ Transformed deal:", transformedDeal);
      
      setDeal(transformedDeal);
      setEditableDeal(transformedDeal);

     
      setCardKey(prev => prev + 1);
      
      notify("Deal stage updated successfully", "success");
    } catch (error: any) {
      console.error("❌ Failed to update deal stage:", error);
      notify("Failed to update stage: " + (error.message || "Unknown error"), "error");
    }
  }
};

 
  const mappedAttachments = useMemo(() => {
    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    
    return attachmentsFromStore.map((attachment) => {
      let fileUrl = attachment.frontendUrl || attachment.fileUrl;
      
      if (!fileUrl) {
        return {
          id: attachment.id,
          name: attachment.filename,
          uploadedAt: attachment.createdAt
            ? formatDisplayDateTime(attachment.createdAt)
            : new Date().toLocaleString(),
          previewUrl: "",
          type: attachment.filename.split(".").pop() || "",
        };
      }
      
      const isAbsoluteUrl = fileUrl.startsWith("http://") || fileUrl.startsWith("https://");
      
      if (isAbsoluteUrl) {
        fileUrl = fileUrl;
      } else if (fileUrl.startsWith("/") && BASE_URL) {
        const cleanPath = fileUrl.substring(1);
        const baseUrl = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
        fileUrl = `${baseUrl}/${cleanPath}`;
      } else if (BASE_URL) {
        const baseUrl = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
        fileUrl = `${baseUrl}/${fileUrl}`;
      } else {
        console.warn("NEXT_PUBLIC_API_BASE_URL is not set. Cannot construct file URL for:", fileUrl);
        fileUrl = "";
      }
      
      return {
        id: attachment.id,
        name: attachment.filename,
        uploadedAt: attachment.createdAt
          ? formatDisplayDateTime(attachment.createdAt)
          : new Date().toLocaleString(),
        previewUrl: fileUrl,
        type: attachment.filename.split(".").pop() || "",
      };
    });
  }, [attachmentsFromStore]);

  const getFilteredActivities = (type: ActivityType) => {
    const filtered = deduplicatedActivities.filter((a) => a.type === type);
    return filtered;
  };

  const handleAddAttachment = async (file: File, previewUrl?: string) => {
    if (!deal?.id) {
      notify("Deal not loaded", "error");
      return;
    }

    if (attachmentsFromStore.some((a) => a.filename === file.name)) {
      notify(`${file.name} already exists in attachments`, "info");
      return;
    }

    try {
      const authUserRaw = localStorage.getItem("auth_user");
      const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
      const uploadedById = authUser?.id || authUser?.userId || authUser?.userID;

      if (!uploadedById) {
        notify("User not found. Please log in again.", "error");
        return;
      }

      const result = await dispatch(
        createAttachments({
          files: [file],
          uploadedById: Number(uploadedById),
          linkedType: "deal",
          linkedId: String(deal.id),
        })
      ).unwrap();

      if (result && result.length > 0) {
        notify("File uploaded successfully", "success");
        dispatch(
          fetchAttachments({
            linkedType: "deal",
            linkedId: String(deal.id),
          })
        );
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      notify(error || "Failed to upload file", "error");
    }
  };

 
  const handleRemoveAttachment = async (id: number) => {
    try {
      await dispatch(deleteAttachment(id)).unwrap();
      notify("Attachment deleted successfully", "success");
      if (deal?.id) {
        dispatch(
          fetchAttachments({
            linkedType: "deal",
            linkedId: String(deal.id),
          })
        );
      }
    } catch (error: any) {
      console.error("Error deleting attachment:", error);
      notify(error || "Failed to delete attachment", "error");
    }
  };

 
  if (!deal)
    return (
      <div className="p-8 text-center text-gray-600">
        <p>Deal details loading...</p>
      </div>
    );

 
  const aboutFields = [
    {
      label: "Deal Owner",
      value: editableDeal?.owner,
      isEditable: true,
      options: ownerOptions,
      variant: "multiselect" as const,
      onChange: (val: string | string[]) =>
        setEditableDeal((p: any) => ({ ...p, owner: val })),
    },
    {
      label: "Priority",
      value: editableDeal?.priority,
      isEditable: true,
      options: priorityOptions,
      onChange: (val: string | string[]) =>
        setEditableDeal((p: any) => ({ ...p, priority: val })),
    },
    {
      label: "Created Date",
      value: editableDeal?.createdDate
        ? formatDisplayDate(editableDeal.createdDate)
        : "-",
      isEditable: false,
    },
  ];

  return (
    <div className="bg-white rounded-md min-h-screen flex flex-col xl:flex-row overflow-hidden">
      <div className="w-full xl:w-[300px] min-w-[300px] flex-shrink-0 space-y-4 mt-1">
        <InfoCard
          key={`deal-card-${deal.id}-${cardKey}`}
          module="deals"
          title={deal.name}
          subtitle={`${deal.description} • Created: ${formatDisplayDateTime(deal.createdDate)}`}
          status={deal.stage}
          id={deal.id}
          onUpdate={handleStatusUpdate} 
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
          onCancel={() => {
            setEditableDeal(deal);
            setIsEditing(false);
          }}
        />
      </div>

      <div className="flex-1 bg-white">
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
                onDelete={tab === "meeting" ? handleDeleteMeeting : undefined}
                loading={
                  tab === "note" ? notesLoading :
                  tab === "call" ? callsLoading :
                  tab === "email" ? emailsLoading :
                  tab === "task" ? tasksLoading : 
                  tab === "meeting" ? meetingsLoading :
                  false
                }
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
                {isInitiatingCall || callsLoading
                  ? "Initiating call..."
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
                  onClick={handleInitiateCall}
                  disabled={isInitiatingCall || callsLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isInitiatingCall || callsLoading ? "Connecting..." : "Connect"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-[280px] space-y-3 mt-5 mr-4">
        <AISummaryCard
          type="deal"
          message={"There are no activities associated with this lead and further details are needed to provide a comprehensive summary. "}
          className="border border-indigo-700"
        />

        <AttachmentView
          attachments={mappedAttachments}
          onAdd={handleAddAttachment}
          onRemove={handleRemoveAttachment}
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
        connectedPerson={getConnectedPersonForEmail() || undefined}
        recordAttachments={mappedAttachments.map((a) => ({
          id: a.id,
          name: a.name,
          url: a.previewUrl,
        }))}
        onAttachToRecord={async (file) => {
          notify(`${file.name} attached to email`, "info");
        }}
      />
      <CallModal
        isOpen={showModal.call}
        onClose={() => toggleModal("call", false)}
        onSave={(data) => handleSaveActivity("call", data)}
        connectedPerson={getConnectedPerson() || undefined}
      />
      <TaskModal
        isOpen={showModal.task}
        onClose={() => toggleModal("task", false)}
        userOptions={userOptions}
        onSave={(data: any): boolean => handleSaveActivity("task", data)}
      />
     <MeetingModal
             isOpen={showModal.meeting}
             onClose={() => toggleModal("meeting", false)}
             onSave={handleCreateMeeting}
             linkedModule="deal"
             linkedModuleId={deal.id}
           />
    </div>
  );
}