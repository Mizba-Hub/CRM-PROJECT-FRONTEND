"use client";

import React, { useState, useEffect } from "react";
import ModalWrapper from "../ModalWrapper";
import { notify } from "@/components/ui/toast/Notify";
import { Inputs } from "@/components/ui/Inputs";
import RichTextEditor from "@/components/ui/RichTextEditor";

export type Meeting = {
  id: number;
  title: string;
  startDate: string;
  startTime: string;
  endTime: string;
  attendees: { id: number; firstName: string; lastName: string }[];
  location: string;
  reminder: string;
  note: string;
  duration?: string;
  totalcount?: number;
  linkedModule?: string;
  linkedModuleId?: string | number;
  organizerIds?: number[];
  attendeeIds?: number[];
};

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meeting: Meeting) => Promise<boolean>;
  linkedModule?: string;
  linkedModuleId?: string | number;
}

export default function MeetingModal({
  isOpen,
  onClose,
  onSave,
  linkedModule = "company",
  linkedModuleId,
}: MeetingModalProps) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [selectedAttendees, setSelectedAttendees] = useState<
    { id: number; firstName: string; lastName: string }[]
  >([]);
  const [location, setLocation] = useState("");
  const [reminder, setReminder] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableAttendees, setAvailableAttendees] = useState<any[]>([]);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);

  const currentUser = {
    id: 1,
    firstName: "Current",
    lastName: "User",
    email: "user@company.com",
  };
  const locationOptions = [
    { label: "Conference Room A", value: "Conference Room A" },
    { label: "Conference Room B", value: "Conference Room B" },
    { label: "Zoom Meeting", value: "Zoom Meeting" },
    { label: "Google Meet", value: "Google Meet" },
    { label: "MS Teams", value: "MS Teams" },
  ];

  const reminderOptions = [
    { label: "10 minutes before", value: "10m" },
    { label: "30 minutes before", value: "30m" },
    { label: "1 hour before", value: "1h" },
    { label: "1 day before", value: "1d" },
  ];

  const fetchAvailableAttendees = async (): Promise<any[]> => {
    try {
      setIsLoadingAttendees(true);
      const BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) throw new Error("Authentication required");

      const response = await fetch(`${BASE_URL}/api/auth/users`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token.startsWith("Bearer ")
            ? token
            : `Bearer ${token}`,
        },
      });
      const data = await response.json();
      const users = Array.isArray(data) ? data : data.data || data.users || [];
      return users;
    } catch (err) {
      console.error("Error fetching users:", err);
      notify("Failed to load users list", "error");
      return [];
    } finally {
      setIsLoadingAttendees(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setStartDate("");
      setStartTime("");
      setEndTime("");
      setSelectedAttendees([]);
      setLocation("");
      setReminder("");
      setNote("");
      setErrors({});
      fetchAvailableAttendees().then((users) => setAvailableAttendees(users));
    }
  }, [isOpen]);

  const attendeeOptions = availableAttendees.map((user) => {
    const name =
      `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
    return {
      label: name,
      value: String(user.id),
      user,
    };
  });

  const validate = async () => {
    const plainNote = note.replace(/<[^>]*>/g, "").trim();
    const newErrors: Record<string, string> = {};
    if (!title) newErrors.title = "Title is required";
    if (!startDate) newErrors.startDate = "Start date is required";
    if (!startTime) newErrors.startTime = "Start time is required";
    if (!endTime) newErrors.endTime = "End time is required";
    if (selectedAttendees.length === 0)
      newErrors.attendees = "Select at least one attendee";
    if (!location) newErrors.location = "Location is required";
    if (!reminder) newErrors.reminder = "Reminder is required";
    if (!plainNote) newErrors.note = "Note is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      notify("⚠️ Please fill all required fields", "error");
      return false;
    }

    const attendeeIds = selectedAttendees.map((u) => u.id);

    const meeting: Meeting = {
      id: Date.now(),
      title,
      startDate,
      startTime,
      endTime,
      attendees: selectedAttendees,
      location,
      reminder,
      note,
      linkedModule,
      linkedModuleId,
      organizerIds: [currentUser.id],
      attendeeIds,
    };

    try {
      const ok = await onSave(meeting);
      if (!ok) return false;
      notify("Meeting scheduled successfully", "success");
      return true;
    } catch (e) {
      console.error("Error saving meeting:", e);
      notify("Failed to save meeting", "error");
      return false;
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={() => {
        setErrors({});
        onClose();
      }}
      title="Schedule Meeting"
      onSave={validate}
    >
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <Inputs
          variant="input"
          type="text"
          name="title"
          placeholder="Enter"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTitle(e.target.value)
          }
          className={errors.title ? "border-red-500" : ""}
          suppressHydrationWarning
        />
        {errors.title && <p className="text-red-500 text-xs">{errors.title}</p>}
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Start Date <span className="text-red-500">*</span>
        </label>
        <Inputs
          variant="date"
          name="startDate"
          placeholder="Choose"
          value={startDate}
          onChange={(v: string) => setStartDate(v)}
          className={errors.startDate ? "border-red-500" : ""}
          showCalendarIcon
          suppressHydrationWarning
        />
        {errors.startDate && (
          <p className="text-red-500 text-xs">{errors.startDate}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Time <span className="text-red-500">*</span>
          </label>
          <Inputs
            variant="time"
            name="startTime"
            placeholder="Choose"
            value={startTime}
            onChange={(v: string) => setStartTime(v)}
            className={errors.startTime ? "border-red-500" : ""}
            suppressHydrationWarning
          />
          {errors.startTime && (
            <p className="text-red-500 text-xs">{errors.startTime}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Time <span className="text-red-500">*</span>
          </label>
          <Inputs
            variant="time"
            name="endTime"
            placeholder="Choose"
            value={endTime}
            onChange={(v: string) => setEndTime(v)}
            className={errors.endTime ? "border-red-500" : ""}
            suppressHydrationWarning
          />
          {errors.endTime && (
            <p className="text-red-500 text-xs">{errors.endTime}</p>
          )}
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Attendees <span className="text-red-500">*</span>
        </label>

        <Inputs
          variant="multiselect"
          name="Attendees"
          placeholder="Choose"
          options={attendeeOptions}
          value={selectedAttendees.map((u) => String(u.id))}
          onChange={(vals: string[]) => {
            const selectedUsers = availableAttendees.filter((user) =>
              vals.includes(String(user.id))
            );
            setSelectedAttendees(selectedUsers);
          }}
          className={errors.attendees ? "border-red-500" : ""}
          suppressHydrationWarning
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location <span className="text-red-500">*</span>
        </label>
        <Inputs
          variant="select"
          name="location"
          placeholder="Choose"
          options={locationOptions}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={errors.location ? "border-red-500" : ""}
          suppressHydrationWarning
        />
        {errors.location && (
          <p className="text-red-500 text-xs">{errors.location}</p>
        )}
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Reminder <span className="text-red-500">*</span>
        </label>
        <Inputs
          variant="select"
          name="reminder"
          placeholder="Choose"
          options={reminderOptions}
          value={reminder}
          onChange={(e) => setReminder(e.target.value)}
          className={errors.reminder ? "border-red-500" : ""}
          suppressHydrationWarning
        />
        {errors.reminder && (
          <p className="text-red-500 text-xs">{errors.reminder}</p>
        )}
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Note <span className="text-red-500">*</span>
        </label>
        <RichTextEditor
          value={note}
          placeholder="Choose"
          onChange={(html) => setNote(html)}
          className={errors.note ? "ring-2 ring-red-400 border-red-400" : ""}
        />
        {errors.note && (
          <p className="text-red-500 text-xs mt-1">{errors.note}</p>
        )}
      </div>
    </ModalWrapper>
  );
}
