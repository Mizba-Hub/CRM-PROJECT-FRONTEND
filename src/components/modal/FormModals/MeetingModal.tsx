"use client";

import React, { useState, useEffect } from "react";
import ModalWrapper from "../ModalWrapper";
import { notify } from "@/components/ui/toast/Notify";
import { Inputs } from "@/components/ui/Inputs";
import { calculateDuration, getAttendeeCount } from "@/app/lib/utils";
import RichTextEditor from "@/components/ui/RichTextEditor";

export type Meeting = {
  id: number;
  title: string;
  startDate: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  location: string;
  reminder: string;
  note: string;
  duration?: string;
  attendeeCount?: number;
};

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meeting: Meeting) => boolean;
}

export default function MeetingModal({
  isOpen,
  onClose,
  onSave,
}: MeetingModalProps) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [attendees, setAttendees] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [reminder, setReminder] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableAttendees = [
    "Maria Johnson",
    "Shifa",
    "Greeshma",
    "Sabira",
    "Sahimah",
    "Mizba",
  ];

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

  const validate = () => {
    const plainText = note.replace(/<[^>]*>/g, "").trim();

    const newErrors: Record<string, string> = {};
    if (!title) newErrors.title = "Title is required";
    if (!startDate) newErrors.startDate = "Start date is required";
    if (!startTime) newErrors.startTime = "Start time is required";
    if (!endTime) newErrors.endTime = "End time is required";
    if (attendees.length === 0)
      newErrors.attendees = "Select at least one attendee";
    if (!location) newErrors.location = "Location is required";
    if (!reminder) newErrors.reminder = "Reminder is required";
    if (!plainText) newErrors.note = "Note is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      notify("⚠️ Please fill all required fields", "error");
      return false;
    }

    const newMeeting: Meeting = {
      id: Date.now(),
      title,
      startDate,
      startTime,
      endTime,
      attendees,
      location,
      reminder,
      note,
      duration: calculateDuration(startTime, endTime),
      attendeeCount: getAttendeeCount(attendees),
    };

    const isValid = onSave(newMeeting);
    if (!isValid) return false;

    notify("Meeting scheduled successfully", "success");
    return true;
  };

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setStartDate("");
      setStartTime("");
      setEndTime("");
      setAttendees([]);
      setLocation("");
      setReminder("");
      setNote("");
      setErrors({});
    }
  }, [isOpen]);

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
          onChange={(e) => setTitle(e.target.value)}
          className={errors.title ? "border-red-500" : ""}
        />
        {errors.title && <p className="text-red-500 text-xs">{errors.title}</p>}
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Start Date <span className="text-red-500">*</span>
        </label>
        <Inputs
          variant="input"
          type="date"
          name="startDate"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className={errors.startDate ? "border-red-500" : ""}
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
            variant="input"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={errors.startTime ? "border-red-500" : ""}
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
            variant="input"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={errors.endTime ? "border-red-500" : ""}
          />
          {errors.endTime && (
            <p className="text-red-500 text-xs">{errors.endTime}</p>
          )}
        </div>
      </div>

      <div className="mb-3">
        <Inputs
          variant="multiselect"
          label={
            <>
              Attendees <span className="text-red-500">*</span>
            </>
          }
          placeholder="Choose"
          options={availableAttendees.map((a) => ({ label: a, value: a }))}
          value={attendees}
          onChange={setAttendees}
          className={errors.attendees ? "border-red-500" : ""}
        />
        {errors.attendees && (
          <p className="text-red-500 text-xs">{errors.attendees}</p>
        )}
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
