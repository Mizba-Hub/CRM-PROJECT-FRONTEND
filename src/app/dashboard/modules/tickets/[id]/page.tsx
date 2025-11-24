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
import { ActivityItem } from "@/components/crm/ActivitySummaryView";
import { getCurrentUserName } from "@/app/lib/auth";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchNotes,
  createNote as createNoteThunk,
} from "@/store/slices/activity/notesSlice";
import {
  initiateCall,
  fetchCallsByUser,
} from "@/store/slices/activity/callSlice";
import {
  fetchTasks,
  createTask as createTaskThunk,
  completeTask,
} from "@/store/slices/activity/taskSlice";
import {
  fetchEmails,
  createEmail as createEmailThunk,
} from "@/store/slices/activity/emailSlice";
import {
  fetchTicketById,
  updateTicket,
  fetchTickets,
  type Ticket as ReduxTicket,
} from "@/store/slices/ticketsSlice";
import {
  fetchAttachments,
  createAttachments,
  deleteAttachment,
} from "@/store/slices/activity/attachmentSlice";
import { formatDurationFromSeconds } from "@/app/lib/utils";

import {
  fetchMeetings,
  createMeeting,
  deleteMeeting,
  Meeting as ReduxMeeting,
  CreateMeetingPayload,
} from "@/store/slices/activity/meetingSlice";

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
  const dispatch = useAppDispatch();
  const { items: notes, loading: notesLoading } = useAppSelector(
    (s) => s.notes
  );
  const { items: calls, loading: callsLoading } = useAppSelector(
    (s) => s.calls
  );
  const { items: tasks } = useAppSelector((s) => s.tasks);
  const { items: emails, loading: emailsLoading } = useAppSelector(
    (s) => s.emails
  );
  const { items: attachmentsFromStore, loading: attachmentsLoading } =
    useAppSelector((s) => s.attachments);

  const {
    items: meetings,
    loading: meetingsLoading,
    error: meetingsError,
  } = useAppSelector((s) => s.meetings);

  const [ticket, setTicket] = useState<any>(null);
  const [userOptions, setUserOptions] = useState<
    Array<{ label: string; value: string; id?: number }>
  >([]);
  const [editableTicket, setEditableTicket] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
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
  const [showCallPopup, setShowCallPopup] = useState(false);
  const [isInitiatingCall, setIsInitiatingCall] = useState(false);

  const currentUserName = getCurrentUserName();

  const formatTaskDueDateTime = (
    dueDate: string | null | undefined,
    dueTime: string | null | undefined
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

  useEffect(() => {
    if (!id) return;

    dispatch(
      fetchMeetings({
        linkedModule: "ticket",
        linkedModuleId: Number(id),
        page: 1,
        size: 50,
      })
    );
  }, [dispatch, id]);

  useEffect(() => {
    if (!id) return;
    dispatch(
      fetchNotes({
        type: "ticket",
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
        type: "ticket",
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
        linkedModule: "ticket",
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
        linkedType: "ticket",
        linkedId: String(id),
      })
    );
  }, [dispatch, id]);

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

  const getConnectedPerson = (): string | null => {
    if (!ticket) return null;

    if (ticket.company?.name) {
      return ticket.company.name;
    }
    if (ticket.companyName && ticket.companyName.trim()) {
      return ticket.companyName.trim();
    }

    if (ticket.deal?.name) {
      return ticket.deal.name;
    }
    if (ticket.dealName && ticket.dealName.trim()) {
      return ticket.dealName.trim();
    }

    return ticket.name || ticket.TicketName || null;
  };

  const getConnectedPersonForEmail = (): string | null => {
    if (!ticket) return null;

    if (ticket.company?.email) {
      return `email:${ticket.company.email}`;
    }
    if (ticket.deal?.email) {
      return `email:${ticket.deal.email}`;
    }

    if (ticket.company?.id) {
      return `company:${ticket.company.id}`;
    }
    if (ticket.companyName && ticket.companyName.trim()) {
      return ticket.companyName.trim();
    }

    if (ticket.deal?.id) {
      return `deal:${ticket.deal.id}`;
    }
    if (ticket.dealName && ticket.dealName.trim()) {
      return ticket.dealName.trim();
    }

    if (ticket.associatedLeadId) {
      return `lead:${ticket.associatedLeadId}`;
    }

    return ticket.id ? `ticket:${ticket.id}` : null;
  };

  useEffect(() => {
    if (!notes) return;
    const uniqueNotes = Array.from(
      new Map(notes.map((n) => [n.id, n])).values()
    );
    const mapped = uniqueNotes.map((n) => ({
      id: n.id,
      type: "note" as ActivityType,
      title: `Note${n.owner?.name ? ` by ${n.owner.name}` : ""}`,
      author: n.owner?.name || currentUserName,
      date: formatActivityDate(
        n.createdAt ? new Date(n.createdAt) : new Date()
      ),
      description: n.content,
      content: n.content,
      extra: {},
    }));
    setActivities((prev) => {
      const nonNote = prev.filter((a) => a.type !== "note");
      const noteMap = new Map<number, Activity>();

      prev
        .filter((a) => a.type === "note")
        .forEach((note) => {
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

    const ticketCalls = calls.filter((call) => {
      return (
        call.target?.type === "ticket" && String(call.target.id) === String(id)
      );
    });

    const uniqueCalls = Array.from(
      new Map(ticketCalls.map((call) => [call.callId, call])).values()
    );

    const mapped = uniqueCalls.map((call) => {
      const callTargetName = getConnectedPerson();

      return {
        id: call.callId,
        type: "call" as ActivityType,
        title: `Call to ${callTargetName}`,
        author: call.user?.name || currentUserName,
        date: formatActivityDate(
          call.startedAt ? new Date(call.startedAt) : new Date()
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
      };
    });

    setActivities((prev) => {
      const nonCall = prev.filter((a) => a.type !== "call");
      const callMap = new Map<number, Activity>();

      mapped.forEach((m) => {
        callMap.set(m.id, m);
      });

      const optimisticCalls = prev.filter(
        (a) => a.type === "call" && a.id > 1000000000000
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
  }, [calls, id, ticket, currentUserName]);

  useEffect(() => {
    if (!tasks || !id) return;

    const ticketTasks = tasks.filter((task) => {
      return (
        task.linkedModule === "ticket" &&
        String(task.linkedModuleId) === String(id)
      );
    });

    const mapped = ticketTasks.map((task) => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      const dueDateTime = formatTaskDueDateTime(task.dueDate, task.dueTime);

      return {
        id: task.id,
        type: "task" as ActivityType,
        title: `Task assigned to ${
          task.assignedTo?.name || currentUserName || "Unknown"
        }`,
        author: task.assignedTo?.name || currentUserName,
        date: formatActivityDate(
          task.createdAt ? new Date(task.createdAt) : new Date()
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
                })
              );

              if (result?.meta?.requestStatus === "fulfilled") {
                notify("Task completed successfully", "success");

                setActivities((prev) =>
                  prev.map((activity) =>
                    activity.id === task.id && activity.type === "task"
                      ? {
                          ...activity,
                          extra: {
                            ...activity.extra,
                            status: "completed",
                          },
                        }
                      : activity
                  )
                );

                setTimeout(() => {
                  dispatch(
                    fetchTasks({
                      linkedModule: "ticket",
                      linkedModuleId: String(id),
                      page: 1,
                      size: 50,
                    })
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
      };
    });

    setActivities((prev) => {
      const nonTask = prev.filter((a) => a.type !== "task");

      const taskMap = new Map<number, Activity>();

      mapped.forEach((newTask) => {
        taskMap.set(newTask.id, newTask);
      });

      const optimisticTasks = prev.filter(
        (a) => a.type === "task" && a.id > 1000000000000
      );

      optimisticTasks.forEach((opt) => {
        if (!taskMap.has(opt.id)) {
          taskMap.set(opt.id, opt);
        }
      });

      return [...nonTask, ...Array.from(taskMap.values())];
    });
  }, [tasks, id, currentUserName, dispatch]);

  useEffect(() => {
    if (!emails || !id) return;

    const ticketEmails = emails.filter((email) => {
      return (
        email.linkedTo?.type === "ticket" &&
        String(email.linkedTo.id) === String(id)
      );
    });

    const uniqueEmails = Array.from(
      new Map(ticketEmails.map((e) => [e.id, e])).values()
    );

    const mapped = uniqueEmails.map((email) => {
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
        id: email.id,
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
      };
    });

    setActivities((prev) => {
      const nonEmail = prev.filter((a) => a.type !== "email");
      const emailMap = new Map<number, Activity>();

      prev
        .filter((a) => a.type === "email")
        .forEach((email) => {
          emailMap.set(email.id, email);
        });

      mapped.forEach((m) => {
        emailMap.set(m.id, m);
      });

      return [...Array.from(emailMap.values()), ...nonEmail];
    });
  }, [emails, id, currentUserName]);

  const meetingActivities: Activity[] = useMemo(() => {
    return meetings.map((meeting: ReduxMeeting) => {
      const currentUser = getCurrentUserName() || "User";

      const connectedPerson = getConnectedPerson();
      const customTitle = connectedPerson
        ? `Meeting ${currentUser} and ${connectedPerson}`
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
          new Date(`${meeting.startDate} ${meeting.startTime}`)
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
      };
    });
  }, [meetings, ticket]);

  const allActivities = useMemo(() => {
    return [...activities, ...meetingActivities];
  }, [activities, meetingActivities]);

  const getFilteredActivities = (type: ActivityType) => {
    const filtered = allActivities.filter((a) => a.type === type);
    return filtered;
  };

  const handleCreateMeeting = async (meetingData: any): Promise<boolean> => {
    try {
      if (!ticket) {
        notify("No ticket selected", "error");
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

      const attendeeIds = meetingData.attendeeIds || [];

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
        linkedModule: "ticket" as const,
        linkedModuleId: ticket.id,
      };

      console.log("📤 [MEETING CREATE] Final create data:", createData);

      const result = await dispatch(createMeeting(createData)).unwrap();

      console.log("✅ [MEETING CREATE] Success! Result:", result);
      notify("Meeting created successfully", "success");
      toggleModal("meeting", false);

      // Refresh meetings list
      dispatch(
        fetchMeetings({
          linkedModule: "ticket",
          linkedModuleId: ticket.id,
          page: 1,
          size: 50,
        })
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
          linkedModule: "ticket",
          linkedModuleId: Number(id),
          page: 1,
          size: 50,
        })
      );
    } catch (error) {
      console.error("Failed to delete meeting:", error);
      notify("Failed to delete meeting", "error");
    }
  };

  useEffect(() => {
    const load = async () => {
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

          try {
            const key = `crm_tickets_${found.id}`;
            const existing = localStorage.getItem(key);
            const data = existing ? JSON.parse(existing) : {};
            if (data.status !== found.status) {
              data.status = found.status;
              localStorage.setItem(key, JSON.stringify(data));
            }
          } catch {}
          return;
        }
      }

      try {
        const result = await dispatch(fetchTicketById(String(id)));
        if (fetchTicketById.fulfilled.match(result)) {
          const t = result.payload as ReduxTicket;
          const normalized = {
            ...t,
            name: t.name || t.TicketName,
            owner: Array.isArray(t.owner)
              ? t.owner
              : t.owners?.map((o) => o.name) || [],
            companyName: t.company?.name || t.companyName || "",
            dealName: t.deal?.name || t.dealName || "",
            company: t.company
              ? {
                  ...t.company,
                  email:
                    (t.company as any).email ||
                    (t.company as any).Lead?.email ||
                    (t.company as any).associatedLead?.email ||
                    null,
                  lead:
                    (t.company as any).lead || (t.company as any).Lead || null,
                  Lead: (t.company as any).Lead || null,
                }
              : null,
            deal: t.deal
              ? {
                  ...t.deal,
                  associatedLead: (t.deal as any).associatedLead || null,
                  email:
                    (t.deal as any).email ||
                    (t.deal as any).associatedLead?.email ||
                    null,
                  lead:
                    (t.deal as any).lead ||
                    (t.deal as any).associatedLead ||
                    null,
                }
              : null,
          } as any;
          setTicket(normalized);
          setEditableTicket(normalized);
        }
      } catch {}
    };
    load();
  }, [id, dispatch]);

  useEffect(() => {
    if (ticket?.status) {
      setCardKey((prev) => prev + 1);

      try {
        const key = `crm_tickets_${ticket.id}`;
        const existing = localStorage.getItem(key);
        const data = existing ? JSON.parse(existing) : {};
        if (data.status !== ticket.status) {
          data.status = ticket.status;
          localStorage.setItem(key, JSON.stringify(data));
        }
      } catch {}
    }
  }, [ticket?.status]);

  const simpleActivities: ActivityItem[] = useMemo(() => {
    const now = new Date();
    const ticketCreatedDate = ticket?.createdDate
      ? new Date(ticket.createdDate)
      : now;

    const activityItems: ActivityItem[] = allActivities.map(
      (activity, index) =>
        ({
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
        } as ActivityItem)
    );

    const systemActivities: ActivityItem[] = [
      {
        id: -1,
        type: "ticket",
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
        description:
          currentUserName +
          " moved ticket to " +
          (ticket?.status || "New") +
          " status",
        dueDate: undefined,
        content: "",
        extra: {},
        overdue: false,
      },
      {
        id: -2,
        type: "ticket",
        title: "",
        author: currentUserName,
        date: ticketCreatedDate.toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        description: "The ticket was created by " + currentUserName,
        dueDate: undefined,
        content: "",
        extra: {},
        overdue: false,
      },
    ];

    const allItems = [...systemActivities, ...activityItems];

    return allItems.sort((a, b) => {
      if (a.id === -1 && b.id === -2) return -1;
      if (a.id === -2 && b.id === -1) return 1;

      const parseDate = (dateStr: string): number => {
        if (!dateStr || dateStr === "No Date") return 0;
        const parsed = new Date(dateStr);
        return !isNaN(parsed.getTime()) ? parsed.getTime() : 0;
      };

      return parseDate(b.date || "") - parseDate(a.date || "");
    });
  }, [
    currentUserName,
    ticket?.status,
    ticket?.createdDate,
    allActivities,
    ticket?.id,
  ]);

  const priorityOptions = ["Low", "Medium", "High", "Critical"];

  const ownerOptions = userOptions.map((opt) => opt.value || opt.label);

  const toggleModal = (type: ActivityType, open: boolean) => {
    setShowModal((prev) => ({ ...prev, [type]: open }));
  };

  const handleInitiateCall = async () => {
    if (!ticket?.id) {
      notify("Ticket not loaded", "error");
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
          targetType: "ticket",
          targetId: String(ticket.id),
          callerPhone: String(callerPhone),
        })
      ).unwrap();

      notify("Call initiated successfully", "success");
      setShowCallPopup(false);

      const callTargetName = getConnectedPerson();

      const newCallActivity: Activity = {
        id: result.callId || Date.now(),
        type: "call" as ActivityType,
        title: `Call to ${callTargetName}`,
        author: result.user?.name || currentUserName,
        date: formatActivityDate(
          result.startedAt ? new Date(result.startedAt) : new Date()
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
      };

      setActivities((prev) => {
        const nonCall = prev.filter(
          (a) => a.type !== "call" || a.id !== newCallActivity.id
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
          if (ticket?.id && content) {
            dispatch(
              createNoteThunk({
                content: String(content),
                userId: currentUserId,
                linkedTo: { type: "ticket", id: Number(ticket.id) },
              })
            ).then(() =>
              dispatch(
                fetchNotes({
                  type: "ticket",
                  linkedTo: Number(ticket.id),
                  page: 1,
                  size: 50,
                })
              )
            );
          }
        } catch {}
        break;

      case "email":
        title = `Logged Email – ${
          data?.subject || "No Subject"
        } by ${currentUserName}`;
        content = data?.body || "Email sent successfully";
        // Create email via email slice and refresh list
        try {
          const authUserRaw = localStorage.getItem("auth_user");
          const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
          const currentUserId =
            authUser?.id || authUser?.userId || authUser?.userID || undefined;

          if (!currentUserId) {
            notify("User ID not found. Please log in again.", "error");
            return false;
          }

          if (ticket?.id && data?.to && data?.subject) {
            const recipients = Array.isArray(data.to)
              ? data.to
              : data.to
                  .split(/[,\s;]+/)
                  .map((s: string) => s.trim())
                  .filter(Boolean);

            const cc = data.cc
              ? Array.isArray(data.cc)
                ? data.cc
                : data.cc
                    .split(/[,\s;]+/)
                    .map((s: string) => s.trim())
                    .filter(Boolean)
              : undefined;

            const bcc = data.bcc
              ? Array.isArray(data.bcc)
                ? data.bcc
                : data.bcc
                    .split(/[,\s;]+/)
                    .map((s: string) => s.trim())
                    .filter(Boolean)
              : undefined;

            // Handle attachments if provided
            const attachmentIds = data.attachments
              ? data.attachments
                  .map((att: any) => att.id)
                  .filter((id: any) => id)
              : undefined;

            dispatch(
              createEmailThunk({
                subject: data.subject,
                body: data.body || "",
                userId: Number(currentUserId),
                recipients: recipients,
                cc: cc,
                bcc: bcc,
                linkedTo: { type: "ticket", id: Number(ticket.id) },
                attachmentIds: attachmentIds,
              })
            )
              .unwrap()
              .then(() => {
                notify("Email sent successfully", "success");
                // Refresh emails list
                dispatch(
                  fetchEmails({
                    type: "ticket",
                    linkedTo: Number(ticket.id),
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

      case "call":
        title = `Call from ${currentUserName}`;
        content = data?.summary || "Call logged";
        extra = {
          outcome: data?.outcome || "completed",
          duration: data?.outcome === "successful" ? "2 min" : null,
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
              (opt) =>
                opt.value === data.assignedTo || opt.label === data.assignedTo
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
                (opt) =>
                  opt.value === data.assignedTo.value ||
                  opt.label === data.assignedTo.value
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

          if (ticket?.id) {
            const assignedUserName =
              assignedUser?.label || currentUserName || "Unknown";
            const dueDate = data?.dueDate ? new Date(data.dueDate) : null;
            const dueDateTime = formatTaskDueDateTime(
              data?.dueDate,
              data?.time
            );

            const tempActivity: Activity = {
              id: Date.now(),
              type: "task" as ActivityType,
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
                linkedModule: "ticket",
                linkedModuleId: String(ticket.id),
              })
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
                  linkedModule: "ticket",
                  linkedModuleId: String(ticket.id),
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
        console.warn(
          "Meeting creation should use handleCreateMeeting function"
        );
        return false;
    }

    if (type === "note" || type === "email") {
      setActiveTab("activity");
      toggleModal(type, false);
      return true;
    }

    if (type === "call") {
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
    }

    return true;
  };

  const mapOwnerNamesToUserIds = async (
    ownerNames: string[]
  ): Promise<number[]> => {
    if (!ownerNames || ownerNames.length === 0) return [];

    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!BASE_URL) return [];

      const token =
        localStorage.getItem("token") || localStorage.getItem("auth_token");
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

  const handleSaveTicket = async () => {
    if (!editableTicket || !id) {
      notify("No ticket data to save", "error");
      return;
    }

    try {
      const ownerNames = Array.isArray(editableTicket.owner)
        ? editableTicket.owner
        : editableTicket.owner
        ? [editableTicket.owner]
        : [];

      const ownerIds =
        ownerNames.length > 0 ? await mapOwnerNamesToUserIds(ownerNames) : [];

      const updateData: any = {
        description: editableTicket.description || "",
        priority: editableTicket.priority || "",
      };

      if (ownerIds.length > 0) {
        updateData.userIds = ownerIds;
      }

      const result = await dispatch(
        updateTicket({
          id: String(id),
          ticketData: updateData,
        })
      );

      if (updateTicket.fulfilled.match(result)) {
        const updatedTicketData = result.payload;
        setTicket(updatedTicketData);
        setEditableTicket(updatedTicketData);

        await dispatch(fetchTickets({}));

        setIsEditing(false);
        notify("Ticket details updated successfully", "success");
      } else {
        const errorMsg = result.payload || "Failed to update ticket";
        notify(
          typeof errorMsg === "string" ? errorMsg : "Failed to update ticket",
          "error"
        );
      }
    } catch (error: any) {
      console.error("Failed to update ticket:", error);
      notify(
        "Failed to save changes: " + (error.message || "Unknown error"),
        "error"
      );
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

      const isAbsoluteUrl =
        fileUrl.startsWith("http://") || fileUrl.startsWith("https://");

      if (isAbsoluteUrl) {
        fileUrl = fileUrl;
      } else if (fileUrl.startsWith("/") && BASE_URL) {
        const cleanPath = fileUrl.substring(1);
        const baseUrl = BASE_URL.endsWith("/")
          ? BASE_URL.slice(0, -1)
          : BASE_URL;
        fileUrl = `${baseUrl}/${cleanPath}`;
      } else if (BASE_URL) {
        const baseUrl = BASE_URL.endsWith("/")
          ? BASE_URL.slice(0, -1)
          : BASE_URL;
        fileUrl = `${baseUrl}/${fileUrl}`;
      } else {
        console.warn(
          "NEXT_PUBLIC_API_BASE_URL is not set. Cannot construct file URL for:",
          fileUrl
        );
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

  const handleAddAttachment = async (file: File, previewUrl?: string) => {
    if (!ticket?.id) {
      notify("Ticket not loaded", "error");
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
          linkedType: "ticket",
          linkedId: String(ticket.id),
        })
      ).unwrap();

      if (result && result.length > 0) {
        notify("File uploaded successfully", "success");

        dispatch(
          fetchAttachments({
            linkedType: "ticket",
            linkedId: String(ticket.id),
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

      if (ticket?.id) {
        dispatch(
          fetchAttachments({
            linkedType: "ticket",
            linkedId: String(ticket.id),
          })
        );
      }
    } catch (error: any) {
      console.error("Error deleting attachment:", error);
      notify(error || "Failed to delete attachment", "error");
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
      label: "Description",
      value: editableTicket?.description,
      isEditable: true,
      onChange: (val: string | string[]) =>
        setEditableTicket((p: any) => ({ ...p, description: val })),
    },
    {
      label: "Ticket Owner",
      value: editableTicket?.owner,
      isEditable: true,
      options: ownerOptions,
      variant: "multiselect" as const,
      onChange: (val: string | string[]) =>
        setEditableTicket((p: any) => ({ ...p, owner: val })),
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
      label: "Created Date",
      value: editableTicket?.createdDate
        ? formatDisplayDate(editableTicket.createdDate)
        : "-",
      isEditable: false,
    },
  ];

  return (
    <div className="p-0 bg-white rounded-md min-h-screen overflow-y-auto flex gap-6">
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
          onUpdate={async (field, value) => {
            if (field === "status") {
              try {
                const result = await dispatch(
                  updateTicket({
                    id: String(id),
                    ticketData: {
                      TicketStatus: value as string,
                    },
                  })
                );

                if (updateTicket.fulfilled.match(result)) {
                  const updatedTicketData = result.payload;
                  setTicket(updatedTicketData);
                  setEditableTicket(updatedTicketData);

                  await dispatch(fetchTickets({}));

                  notify("Ticket status updated successfully", "success");
                } else {
                  const errorMsg =
                    result.payload || "Failed to update ticket status";
                  notify(
                    typeof errorMsg === "string"
                      ? errorMsg
                      : "Failed to update ticket status",
                    "error"
                  );
                }
              } catch (error: any) {
                console.error("Failed to update ticket status:", error);
                notify(
                  "Failed to update status: " +
                    (error.message || "Unknown error"),
                  "error"
                );
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

      <div className="flex-1 bg-white  ">
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

      <div className="w-[280px] space-y-3 mt-5 mr-4">
        <AISummaryCard type="ticket" className="border border-indigo-700" />

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
        linkedModule="ticket"
        linkedModuleId={ticket.id}
      />
    </div>
  );
}
