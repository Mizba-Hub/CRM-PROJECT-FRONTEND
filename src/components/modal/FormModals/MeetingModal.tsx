"use client";

import React, { useRef, useState, useEffect } from "react";
import ModalWrapper from "../ModalWrapper";
import { notify } from "@/components/ui/toast/Notify";
import { Inputs } from "@/components/ui/Inputs";
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  PhotoIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { ListOrdered as ListOrderedIcon } from "lucide-react";

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
  const [showAttendees, setShowAttendees] = useState(false);

  const availableAttendees = ["Maria Johnson", "Jane Cooper", "Robert Fox", "Jenny Wilson"];
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

  const attendeesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (attendeesRef.current && !attendeesRef.current.contains(e.target as Node)) {
        setShowAttendees(false);
      }
    };
    if (showAttendees) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAttendees]);

  
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    ul: false,
    ol: false,
  });
  const [blockType, setBlockType] = useState("p");
  const [errors, setErrors] = useState<Record<string, string>>({});

  
  const calculateDuration = (start: string, end: string): string => {
    if (!start || !end) return "-";
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const diff = eh * 60 + em - (sh * 60 + sm);
    if (diff <= 0) return "-";
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    return hrs > 0
      ? `${hrs} hr${hrs > 1 ? "s" : ""}${mins > 0 ? ` ${mins} mins` : ""}`
      : `${mins} mins`;
  };

  
  const getAttendeeCount = (arr: string[]) => arr?.length || 0;

  const format = (command: string, value?: string) => {
    if (editorRef.current) editorRef.current.focus();
    document.execCommand(command, false, value);
    updateFormatState();
  };

  const updateFormatState = () => {
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      ul: document.queryCommandState("insertUnorderedList"),
      ol: document.queryCommandState("insertOrderedList"),
    });
  };

  const handleInput = () => {
    const content = editorRef.current?.innerText.trim() || "";
    setIsEmpty(content.length === 0);
    updateFormatState();
  };

 
  const validate = () => {
    const noteContent = editorRef.current?.innerHTML || "";
    const plainNote = editorRef.current?.innerText.trim() || "";

    const newErrors: Record<string, string> = {};
    if (!title) newErrors.title = "Title is required";
    if (!startDate) newErrors.startDate = "Start date is required";
    if (!startTime) newErrors.startTime = "Start time is required";
    if (!endTime) newErrors.endTime = "End time is required";
    if (attendees.length === 0) newErrors.attendees = "Select at least one attendee";
    if (!location) newErrors.location = "Location is required";
    if (!reminder) newErrors.reminder = "Reminder is required";
    if (!plainNote) newErrors.note = "Note is required";

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
      note: noteContent,
      duration: calculateDuration(startTime, endTime),
      attendeeCount: getAttendeeCount(attendees),
    };

    const isValid = onSave(newMeeting);
    if (!isValid) return false;
    return true;
  };

  useEffect(() => {
    if (isOpen && editorRef.current) {
      setTitle("");
      setStartDate("");
      setStartTime("");
      setEndTime("");
      setAttendees([]);
      setLocation("");
      setReminder("");
      editorRef.current.innerHTML = "";
      setErrors({});
      setIsEmpty(true);
      setShowAttendees(false);
    }
  }, [isOpen]);

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={() => {
        setErrors({});
        setShowAttendees(false);
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
        {errors.startDate && <p className="text-red-500 text-xs">{errors.startDate}</p>}
      </div>

      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Time <span className="text-red-500">*</span>
          </label>
          <Inputs
            variant="input"
            type="time"
            name="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={errors.startTime ? "border-red-500" : ""}
          />
          {errors.startTime && <p className="text-red-500 text-xs">{errors.startTime}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Time <span className="text-red-500">*</span>
          </label>
          <Inputs
            variant="input"
            type="time"
            name="endTime"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={errors.endTime ? "border-red-500" : ""}
          />
          {errors.endTime && <p className="text-red-500 text-xs">{errors.endTime}</p>}
        </div>
      </div>

      
      <div className="mb-3 relative" ref={attendeesRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Attendees <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={() => setShowAttendees((prev) => !prev)}
          className={`w-full border rounded px-3 py-2 text-left flex justify-between items-center ${
            errors.attendees ? "border-red-500" : "border-gray-300"
          }`}
        >
          <span className={attendees.length ? "text-black" : "text-gray-400"}>
            {attendees.length ? attendees.join(", ") : "Choose"}
          </span>
          <ChevronDownIcon className="w-3 h-3 text-gray-400" strokeWidth={3.5} />
        </button>

        {showAttendees && (
          <div className="absolute mt-1 w-full border border-gray-300 rounded bg-white shadow-md z-10 max-h-40 overflow-y-auto">
            {availableAttendees.map((person) => (
              <label
                key={person}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <input
                  type="checkbox"
                  value={person}
                  checked={attendees.includes(person)}
                  onChange={() =>
                    setAttendees((prev) =>
                      prev.includes(person)
                        ? prev.filter((p) => p !== person)
                        : [...prev, person]
                    )
                  }
                  className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{person}</span>
              </label>
            ))}
          </div>
        )}
        {errors.attendees && <p className="text-red-500 text-xs">{errors.attendees}</p>}
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
        {errors.location && <p className="text-red-500 text-xs">{errors.location}</p>}
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
        {errors.reminder && <p className="text-red-500 text-xs">{errors.reminder}</p>}
      </div>

      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Note <span className="text-red-500">*</span>
        </label>
        <div
          className={`w-full border rounded ${
            errors.note
              ? "border-red-500 focus-within:ring-2 focus-within:ring-red-400"
              : "border-gray-300 focus-within:ring-2 focus-within:ring-indigo-600"
          }`}
        >
          
          <div className="flex items-center gap-0 border-b border-gray-300 px-2 py-1 bg-white rounded-t">
            <div className="relative">
              <select
                value={blockType}
                onChange={(e) => {
                  format("formatBlock", e.target.value);
                  setBlockType(e.target.value);
                }}
                className="text-xs rounded px-2 py-1 pr-6 focus:outline-none appearance-none bg-white text-gray-700"
              >
                <option value="p">Normal text</option>
                <option value="h1">Heading 1</option>
                <option value="h2">Heading 2</option>
                <option value="h3">Heading 3</option>
              </select>
              <ChevronDownIcon className="w-3 h-3 absolute right-2.5 top-1.5 pointer-events-none text-gray-700" />
            </div>
            <button onClick={() => format("bold")} type="button" className={`p-2 rounded ${activeFormats.bold ? "bg-purple-200" : "hover:bg-gray-200"}`}>
              <BoldIcon className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={() => format("italic")} type="button" className={`p-2 rounded ${activeFormats.italic ? "bg-purple-200" : "hover:bg-gray-200"}`}>
              <ItalicIcon className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={() => format("underline")} type="button" className={`p-2 rounded ${activeFormats.underline ? "bg-purple-200" : "hover:bg-gray-200"}`}>
              <UnderlineIcon className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={() => format("insertUnorderedList")} type="button" className={`p-2 rounded ${activeFormats.ul ? "bg-purple-200" : "hover:bg-gray-200"}`}>
              <ListBulletIcon className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={() => format("insertOrderedList")} type="button" className={`p-2 rounded ${activeFormats.ol ? "bg-purple-200" : "hover:bg-gray-200"}`}>
              <ListOrderedIcon className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => {
                const url = prompt("Enter image URL:");
                if (url) format("insertImage", url);
              }}
              type="button"
              className="p-2 hover:bg-gray-200 rounded"
            >
              <PhotoIcon className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          
          <div className="relative">
            {isEmpty && !isFocused && (
              <span className="absolute left-3 top-2 text-gray-400 pointer-events-none text-sm">
                Enter
              </span>
            )}
            <div
              ref={editorRef}
              contentEditable
              style={{ whiteSpace: "pre-wrap" }}
              onInput={handleInput}
              onFocus={() => {
                setIsFocused(true);
                updateFormatState();
              }}
              onBlur={() => {
                const plain = editorRef.current?.innerText.trim() || "";
                setIsFocused(false);
                setIsEmpty(!plain);
              }}
              className="px-3 py-2 min-h-[120px] text-sm text-black focus:outline-none"
              suppressContentEditableWarning
            />
          </div>
        </div>
        {errors.note && <p className="text-red-500 text-xs mt-1">{errors.note}</p>}
      </div>
    </ModalWrapper>
  );
}
