"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import { fetchLeadById, updateLeadAPI } from "@/store/slices/leadSlice";
import { fetchNotes, createNote } from "@/store/slices/activity/notesSlice";
import {
  fetchTasks,
  createTask,
  completeTask,
} from "@/store/slices/activity/taskSlice";
import {
  fetchAttachments,
  createAttachments,
  deleteAttachment,
} from "@/store/slices/activity/attachmentSlice";

import { notify } from "@/components/ui/toast/Notify";

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
import {
  fetchMeetings,
  createMeeting,
  deleteMeeting,
  Meeting as ReduxMeeting,
  CreateMeetingPayload,
} from "@/store/slices/activity/meetingSlice";

import { formatActivityDate, formatDisplayDate } from "@/app/lib/date";
import { AISummaryCard } from "@/components/ai/AISummaryCard";
import { toUiStatus } from "@/store/slices/leadSlice";
import { useRouter } from "next/navigation";

type ActivityType = "activity" | "note" | "call" | "task" | "email" | "meeting";

type Activity = {
  id: number;
  type: ActivityType;
  title: string;
  author: string;
  date: string;
  content?: string;
  preview?: string;
  overdue?: boolean;
  extra?: Record<string, any>;
};

export default function LeadDetailPage() {
  const { id } = useParams();
  const leadId = Array.isArray(id) ? id[0] : id;
  const dispatch = useAppDispatch();

  const token = useAppSelector((s) => s.auth.token);

  const lead = useAppSelector((s) => s.leads.currentLead);
  const notes = useAppSelector((s) => s.notes.items);
  const notesLoading = useAppSelector((s) => s.notes.loading);
  const tasks = useAppSelector((s) => s.tasks.items);
  const taskLoading = useAppSelector((s) => s.tasks.loading);

  const [emails, setEmails] = useState([]);

  const [callStatus, setCallStatus] = useState("connecting");

  const {
    items: meetings,
    loading: meetingsLoading,
    error: meetingsError,
  } = useAppSelector((s) => s.meetings);

  const [editableLead, setEditableLead] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const attachments = useAppSelector((s) => s.attachments.items);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<ActivityType | "activity">(
    "activity"
  );
  const [showCallPopup, setShowCallPopup] = useState(false);
  const [userOptions, setUserOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [infoCardKey, setInfoCardKey] = useState(0);

  const [loggedUser, setLoggedUser] = useState<any>(null);
  const [loggedUserName, setLoggedUserName] = useState("");

  const loadEmails = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/emails?linkedTo=${leadId}&type=lead`
    );

    const data = await res.json();
    if (data.success) setEmails(data.data);
  };

  const [showModal, setShowModal] = useState<Record<ActivityType, boolean>>({
    activity: false,
    note: false,
    call: false,
    task: false,
    email: false,
    meeting: false,
  });

  const [searchValue, setSearchValue] = useState("");

  const toggleModal = (type: ActivityType, open: boolean) => {
    setShowModal((prev) => ({ ...prev, [type]: open }));
  };

  useEffect(() => {
    if (!id) return;
    const leadId = Array.isArray(id) ? id[0] : id;
    dispatch(fetchLeadById(leadId));
  }, [id, dispatch]);

  useEffect(() => {
    if (lead?.id) {
      dispatch(fetchNotes({ linkedTo: lead.id, type: "lead" }));
    }
  }, [lead?.id, dispatch]);

  useEffect(() => {
    if (lead?.id) {
      dispatch(
        fetchTasks({
          linkedModule: "lead",
          linkedModuleId: lead.id,
        })
      );
    }
  }, [lead?.id, dispatch]);

  useEffect(() => {
    if (lead) setEditableLead(lead);
  }, [lead]);

  useEffect(() => {
    if (lead?.id) {
      dispatch(
        fetchAttachments({
          linkedType: "lead",
          linkedId: lead.id,
        })
      );
    }
  }, [lead?.id, dispatch]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/users`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) return;

        const data = await res.json();

        const formatted = data.map((u: any) => ({
          label: `${u.firstName} ${u.lastName}`,
          value: String(u.id),
        }));

        setUserOptions(formatted);
      } catch (e) {
        console.error("User fetch failed:", e);
      }
    };

    if (token) loadUsers();
  }, [token]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setLoggedUser(user);
      setLoggedUserName(
        `${user.firstName || ""} ${user.lastName || ""}`.trim()
      );
    }
  }, []);

  useEffect(() => {
    if (lead?.id) {
      dispatch(
        fetchMeetings({
          linkedModule: "lead",
          linkedModuleId: lead.id,
        })
      );
    }
  }, [lead?.id, dispatch]);

  useEffect(() => {
    loadEmails();
  }, []);

  const meetingActivities: Activity[] = useMemo(() => {
    if (!Array.isArray(meetings)) return [];

    return meetings.map((meeting: ReduxMeeting) => {
      const organizerName =
        meeting.organizers
          ?.map((o) => `${o.firstName} ${o.lastName}`)
          .join(", ") || "Unknown Organizer";

      const currentUser = loggedUserName || "User";

      return {
        id: 500000 + meeting.id,
        type: "meeting",
        title: `Meeting ${currentUser} and ${lead?.firstName ?? ""} ${
          lead?.lastName ?? ""
        }`,
        author: organizerName,
        date: formatActivityDate(
          new Date(`${meeting.startDate} ${meeting.startTime}`)
        ),
        content:
          meeting.note ||
          `Meeting scheduled for ${meeting.startDate} at ${meeting.startTime}`,
        extra: {
          subtitle: meeting.note?.trim()
            ? meeting.note.slice(0, 80)
            : `Meeting at ${meeting.startTime}`,
          duration: meeting.duration,
          location: meeting.location,
          attendees: meeting.totalcount,
          organizer: organizerName,
          originalTitle: meeting.title,
          meetingId: meeting.id,
        },
      };
    });
  }, [meetings, lead, loggedUserName]);

  useEffect(() => {
    let allActivities: Activity[] = [];

    if (Array.isArray(notes) && !notesLoading) {
      const mappedNotes = notes.map((n) => ({
        id: n.id,
        type: "note" as ActivityType,
        title: `Note by ${n.owner?.name || "User"}`,
        author: n.owner?.name || "User",
        date: n.createdAt
          ? formatActivityDate(new Date(n.createdAt))
          : formatActivityDate(new Date()),
        content: n.content,
        extra: { linkedTo: n.linkedTo },
      }));
      allActivities.push(...mappedNotes);
    }

    if (Array.isArray(tasks) && !taskLoading) {
      const mappedTasks = tasks.map((t) => ({
        id: t.id,
        type: "task" as ActivityType,
        title: t.taskName,
        author: t.assignedTo?.name || "You",
        date: t.createdAt
          ? formatActivityDate(new Date(t.createdAt))
          : formatActivityDate(new Date()),
        content: t.note || "",
        overdue:
          t.status === "pending" && t.dueDate
            ? new Date(t.dueDate) < new Date()
            : false,
        extra: {
          priority: t.priority,
          taskName: t.taskName,
          taskType: t.taskType,
          status: t.status,
          dueDate: t.dueDate,
          assignedTo: t.assignedTo,
          completedAt: t.completedAt,

          onComplete: async () => {
            try {
              const result: any = await dispatch(
                completeTask({
                  taskId: t.id,
                })
              );

              if (result?.meta?.requestStatus === "fulfilled") {
                notify("Task completed successfully", "success");

                const updatedTasks = tasks.map((task) =>
                  task.id === t.id
                    ? {
                        ...task,
                        status: "completed" as any,
                        completedAt: new Date().toISOString(),
                      }
                    : task
                );

                setActivities((prev) =>
                  prev.map((activity) =>
                    activity.id === t.id && activity.type === "task"
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
                      linkedModule: "lead",
                      linkedModuleId: lead.id,
                    })
                  );
                }, 1000);
              } else {
                const errorMsg = result?.payload || "Failed to complete task";
                console.error("Complete task error:", errorMsg);
                notify(String(errorMsg), "error");
              }
            } catch (error: any) {
              console.error("Complete task exception:", error);
              notify(error?.message || "Failed to complete task", "error");
            }
          },
        },
      }));
      allActivities.push(...mappedTasks);
    }

    if (Array.isArray(emails) && emails.length > 0) {
      const loggedUser = JSON.parse(localStorage.getItem("user") || "{}");

      const mappedEmails = (emails as any[]).map((e: any) => {
        const loggedUser = JSON.parse(localStorage.getItem("user") || "{}");

        const authorName =
          e.owner && loggedUser?.id === e.owner?.id
            ? `${loggedUser.firstName} ${loggedUser.lastName}`
            : e.owner
            ? `${e.owner.firstName} ${e.owner.lastName}`
            : "Unknown";

        return {
          id: e.id,
          type: "email" as ActivityType,
          title: `Logged Email – ${e.subject} – by ${authorName}`,
          author: authorName,
          date: e.sentAt
            ? formatActivityDate(new Date(e.sentAt))
            : formatActivityDate(new Date()),
          content: e.body,
          extra: {
            recipients: e.recipients,
            attachments: e.attachments,
          },
        };
      });

      allActivities.push(...mappedEmails);
    }
    allActivities.push(...meetingActivities);

    setActivities(allActivities);
  }, [
    notes,
    tasks,
    emails,
    meetings,
    meetingActivities,
    notesLoading,
    taskLoading,
    dispatch,
    lead?.id,
  ]);

  const handleCreateNote = async (content: string) => {
    try {
      if (!lead) {
        notify("Lead not loaded", "error");
        return false;
      }

      const payload: any = {
        content,
        linkedTo: { type: "lead", id: Number(lead.id) },
      };

      try {
        const storedUser =
          typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem("user") || "null")
            : null;
        if (storedUser?.id) payload.userId = Number(storedUser.id);
      } catch (err) {}

      const res: any = await dispatch(createNote(payload));

      if (res?.meta?.requestStatus === "fulfilled") {
        notify("Note added successfully", "success");
        toggleModal("note", false);
        dispatch(fetchNotes({ linkedTo: lead.id, type: "lead" }));
        return true;
      } else {
        const errMsg =
          res?.payload || res?.error?.message || "Failed to add note";
        notify(String(errMsg), "error");
        return false;
      }
    } catch (err: any) {
      console.error("handleCreateNote error:", err);
      notify(err?.message || "Failed to add note", "error");
      return false;
    }
  };

  const handleCreateMeeting = async (meetingData: any): Promise<boolean> => {
    try {
      const authUserRaw =
        localStorage.getItem("auth_user") || localStorage.getItem("user");
      const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
      const currentUserId =
        authUser?.id || authUser?.userId || authUser?.userID;

      if (!currentUserId) {
        notify("User not found. Please log in again.", "error");
        return false;
      }

      const attendeeIds = meetingData.attendees.map((a: any) => a.id);

      const payload: CreateMeetingPayload = {
        title: meetingData.title,
        startDate: meetingData.startDate,
        startTime: meetingData.startTime,
        endTime: meetingData.endTime,
        location: meetingData.location,
        reminder: meetingData.reminder,
        note: meetingData.note,
        organizerIds: [Number(currentUserId)],
        attendeeIds,
        linkedModule: "lead",
        linkedModuleId: Number(lead.id),
      };

      await dispatch(createMeeting(payload)).unwrap();

      notify("Meeting created successfully", "success");
      toggleModal("meeting", false);

      dispatch(
        fetchMeetings({ linkedModule: "lead", linkedModuleId: lead.id })
      );

      return true;
    } catch (error) {
      notify("Failed to create meeting", "error");
      return false;
    }
  };

  const handleSaveLead = async () => {
    if (!lead || !editableLead) return;

    const payload = {
      id: lead.id,
      updates: {
        email: editableLead.email,
        firstName: editableLead.firstName,
        lastName: editableLead.lastName,
        phoneNumber: editableLead.phone,
        city: editableLead.city,
        jobTitle: editableLead.jobTitle,
        leadStatus: editableLead.status,
      },
    };

    try {
      const res: any = await dispatch(updateLeadAPI(payload));

      if (res?.meta?.requestStatus === "fulfilled") {
        notify("Lead updated successfully", "success");

        setEditableLead((prev: any) => ({
          ...prev,
          email: res.payload.updates.email ?? prev.email,
          firstName: res.payload.updates.firstName ?? prev.firstName,
          lastName: res.payload.updates.lastName ?? prev.lastName,
          phone: res.payload.updates.phoneNumber ?? prev.phone,
          city: res.payload.updates.city ?? prev.city,
          jobTitle: res.payload.updates.jobTitle ?? prev.jobTitle,
          status: toUiStatus(
            res.payload.updates.leadStatus || res.payload.updates.status
          ),
        }));

        setIsEditing(false);

        setInfoCardKey((k) => k + 1);

        dispatch(fetchLeadById(lead.id));

        setInfoCardKey((k) => k + 1);
      } else {
        notify("Failed to update lead", "error");
      }
    } catch (error) {
      notify("Failed to update lead", "error");
    }
  };

  const statusOptions = [
    "Open",
    "New",
    "In Progress",
    "Qualified",
    "Closed",
    "Converted",
  ];

  const aboutFields = [
    {
      label: "Email",
      value: editableLead?.email,
      isEditable: true,
      onChange: (val: any) =>
        setEditableLead((p: any) => ({ ...p, email: val })),
    },
    {
      label: "First Name",
      value: editableLead?.firstName,
      isEditable: true,
      onChange: (val: any) =>
        setEditableLead((p: any) => ({ ...p, firstName: val })),
    },
    {
      label: "Last Name",
      value: editableLead?.lastName,
      isEditable: true,
      onChange: (val: any) =>
        setEditableLead((p: any) => ({ ...p, lastName: val })),
    },
    {
      label: "Phone Number",
      value: editableLead?.phone,
      isEditable: true,
      onChange: (val: any) =>
        setEditableLead((p: any) => ({ ...p, phone: val })),
    },
    {
      label: "Lead Status",
      value: editableLead?.status || "New",
      isEditable: true,
      options: statusOptions,
      onChange: (val: any) =>
        setEditableLead((p: any) => ({ ...p, status: val })),
    },
    {
      label: "Job Title",
      value: editableLead?.jobTitle,
      isEditable: true,
      onChange: (val: any) =>
        setEditableLead((p: any) => ({ ...p, jobTitle: val })),
    },
    {
      label: "Created Date",
      value: formatDisplayDate(editableLead?.createdDate),
      isEditable: false,
    },
  ];

  if (!lead || notesLoading || taskLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-md min-h-screen flex flex-col xl:flex-row overflow-hidden">
      <div className="w-full xl:w-[300px] min-w-[300px] flex-shrink-0 space-y-4 mt-1">
        <InfoCard
          module="leads"
          title={`${lead.firstName} ${lead.lastName}`}
          subtitle={lead.jobTitle}
          email={lead.email}
          onNoteClick={() => toggleModal("note", true)}
          onEmailClick={() => {
            localStorage.setItem(
              "leads",
              JSON.stringify([
                {
                  id: lead.id,
                  email: lead.email,
                  firstName: lead.firstName,
                  lastName: lead.lastName,
                },
              ])
            );

            toggleModal("email", true);
          }}
          onCallClick={() => toggleModal("call", true)}
          onTaskClick={() => toggleModal("task", true)}
          onMeetingClick={() => toggleModal("meeting", true)}
        />

        <EntityInfoCard
          key={infoCardKey}
          title="About this Lead"
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
            if (!lead) return;

            localStorage.setItem(
              "convertLead",
              JSON.stringify({
                id: lead.id,
                firstName: lead.firstName,
                lastName: lead.lastName,
                email: lead.email,
              })
            );

            window.location.href = `/dashboard/modules/deals?openModal=true`;
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
                <ActivityDetailView
                  sectionTitle="Upcoming"
                  activities={activities as any}
                  onCreate={() => toggleModal("note", true)}
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
                activities={activities.filter((a) => a.type === tab) as any}
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
                {callStatus === "connecting" && "Connecting to Agent..."}
                {callStatus === "initiated" && "Call Initiated..."}
              </p>

              <div className="flex justify-center gap-3 mt-5">
                <button
                  onClick={() => {
                    setCallStatus("initiated");

                    setTimeout(() => {
                      setShowCallPopup(false);
                      toggleModal("call", true);
                    }, 1500);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Connect
                </button>

                <button
                  onClick={() => setShowCallPopup(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-full xl:w-[300px] flex-shrink-0 space-y-4 mt-[3px] xl:mr-2">
        <AISummaryCard type="lead" className="border border-indigo-700" />

        <AttachmentView
          attachments={attachments.map((a) => ({
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
              const user = JSON.parse(localStorage.getItem("user") || "{}");

              const result = await dispatch(
                createAttachments({
                  files: [file],
                  uploadedById: Number(user.id),
                  linkedType: "lead",
                  linkedId: lead.id,
                })
              );

              if (result?.meta?.requestStatus === "fulfilled") {
                notify("File uploaded successfully", "success");

                dispatch(
                  fetchAttachments({
                    linkedType: "lead",
                    linkedId: lead.id,
                  })
                );
              } else {
                const errorMsg = result?.payload || "Failed to upload file";
                notify(String(errorMsg), "error");
              }
            } catch (err: any) {
              console.error("Upload error:", err);
              notify(err.message || "Failed to upload file", "error");
            }
          }}
          onRemove={async (attachmentId) => {
            try {
              const result = await dispatch(deleteAttachment(attachmentId));

              if (result?.meta?.requestStatus === "fulfilled") {
                notify("Attachment deleted successfully", "success");

                dispatch(
                  fetchAttachments({
                    linkedType: "lead",
                    linkedId: lead.id,
                  })
                );
              } else {
                notify("Failed to delete attachment", "error");
              }
            } catch (err: any) {
              notify(err.message || "Failed to delete attachment", "error");
            }
          }}
        />
      </div>

      <NoteModal
        isOpen={showModal.note}
        onClose={() => toggleModal("note", false)}
        onSave={handleCreateNote}
      />

      <EmailModal
        isOpen={showModal.email}
        onClose={() => toggleModal("email", false)}
        connectedPerson={`lead:${lead.id}`}
        recordAttachments={attachments.map((a) => ({
          id: a.id,
          name: a.filename,
          url: a.frontendUrl || a.fileUrl,
        }))}
        onAttachToRecord={() => {
          notify("This file is already in the attachments list.", "info");
        }}
        onSend={async (emailData) => {
          try {
            const formData = new FormData();

            formData.append(
              "data",
              JSON.stringify({
                subject: emailData.subject,
                body: emailData.body,
                userId: JSON.parse(localStorage.getItem("user") || "{}")?.id,
                recipients: emailData.to.split(",").map((e) => e.trim()),
                cc: emailData.cc
                  ? emailData.cc.split(",").map((e) => e.trim())
                  : [],
                bcc: emailData.bcc
                  ? emailData.bcc.split(",").map((e) => e.trim())
                  : [],
                linkedTo: { type: "lead", id: lead.id },
                attachmentIds: attachments.map((a) => a.id),
              })
            );

            for (const file of emailData.attachments || []) {
              const blob = await fetch(file.url).then((r) => r.blob());
              const realFile = new File([blob], file.name);
              formData.append("attachments", realFile);
            }

            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/emails`,
              {
                method: "POST",
                body: formData,
              }
            );

            const result = await res.json();

            if (!result.success) return false;

            await loadEmails();
            toggleModal("email", false);

            return true;
          } catch (err) {
            notify("Error sending email", "error");
            return false;
          }
        }}
      />

      <CallModal
        isOpen={showModal.call}
        onClose={() => toggleModal("call", false)}
        onSave={(data) => {
          const user = JSON.parse(localStorage.getItem("user") || "{}");

          const body = {
            userId: Number(user.id),
            targetType: "lead",
            targetId: lead.id,
            callerPhone: lead.phoneNumber || lead.phone || "",
            outcome: data.outcome,
            note: data.note,
            date: data.date,
            time: data.time,
          };

          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/calls`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          })
            .then(async (res) => {
              const backendCall = await res.json();

              if (!res.ok) {
                notify(backendCall?.message || "Failed to log call", "error");
                return;
              }

              setActivities((prev) => [
                {
                  id: backendCall.callId,
                  type: "call",
                  title: `Call from ${backendCall.user?.name || "User"}`,
                  author: backendCall.user?.name || "User",
                  date: formatActivityDate(new Date(backendCall.startedAt)),
                  content: data.note,
                  extra: {
                    outcome: data.outcome,
                    duration: backendCall.durationSeconds,
                    target: backendCall.target,
                    startedAt: backendCall.startedAt,
                    endedAt: backendCall.endedAt,
                  },
                },
                ...prev,
              ]);

              notify("Call logged successfully", "success");
              toggleModal("call", false);
            })
            .catch((err) => {
              console.error("Call log error:", err);
              notify("Something went wrong", "error");
            });

          return true;
        }}
        connectedPerson={`${lead.firstName} ${lead.lastName}`}
      />

      <TaskModal
        isOpen={showModal.task}
        onClose={() => toggleModal("task", false)}
        userOptions={userOptions}
        onSave={(data: any): boolean => {
          if (!lead?.id) {
            notify("Lead not found", "error");
            return false;
          }

          let assignedToId: number | null = null;

          if (typeof data.assignedTo === "string") {
            assignedToId = Number(data.assignedTo);
          } else if (data.assignedTo && typeof data.assignedTo === "object") {
            assignedToId = Number(data.assignedTo.value || data.assignedTo.id);
          }

          if (!assignedToId || isNaN(assignedToId)) {
            notify("Please select a valid user", "error");
            return false;
          }

          const payload = {
            taskName: String(data.name || "Untitled Task"),
            taskType: String(data.type || "to do"),
            priority: String(data.priority || "medium"),
            assignedToId,
            note: String(data.note || ""),
            dueDate: data.dueDate || null,
            dueTime: data.time || null,
            linkedModule: "lead",
            linkedModuleId: Number(lead.id),
          } satisfies any;

          dispatch(createTask(payload as any))
            .then((result: any) => {
              if (result?.meta?.requestStatus === "fulfilled") {
                notify("Task created successfully", "success");
                dispatch(
                  fetchTasks({ linkedModule: "lead", linkedModuleId: lead.id })
                );
                toggleModal("task", false);
              } else {
                notify("Task creation failed", "error");
              }
            })
            .catch((err) =>
              notify(err?.message || "Task creation failed", "error")
            );

          return true;
        }}
      />

      <MeetingModal
        isOpen={showModal.meeting}
        onClose={() => toggleModal("meeting", false)}
        onSave={handleCreateMeeting}
        linkedModule="lead"
        linkedModuleId={lead.id}
      />
    </div>
  );
}
