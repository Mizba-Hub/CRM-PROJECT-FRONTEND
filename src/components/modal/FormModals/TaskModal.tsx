
"use client";

import React, { useState, useEffect } from "react";
import ModalWrapper from "../ModalWrapper";
import { notify } from "@/components/ui/toast/Notify";
import { Inputs } from "@/components/ui/Inputs";
import RichTextEditor from "@/components/ui/RichTextEditor";

export type Task = {
  id: number;
  name: string;
  dueDate: string;
  time: string;
  type: string;
  priority: string;
  assignedTo: string;
  note: string;
};

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => boolean;
  userOptions?: Array<{ label: string; value: string; id?: number }>;
}

export default function TaskModal({ isOpen, onClose, onSave, userOptions = [] }: TaskModalProps) {
  const [taskName, setTaskName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [time, setTime] = useState("");
  const [taskType, setTaskType] = useState("");
  const [priority, setPriority] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [note, setNote] = useState(""); // ✅ note content from RichTextEditor

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const plainText = note.replace(/<[^>]*>/g, "").trim();

    const newErrors: Record<string, string> = {};
    if (!taskName) newErrors.taskName = "Task Name is required.";
    if (!dueDate) newErrors.dueDate = "Due Date is required.";
    if (!time) newErrors.time = "Time is required.";
    if (!taskType) newErrors.taskType = "Task Type is required.";
    if (!priority) newErrors.priority = "Priority is required.";
    if (!assignedTo) newErrors.assignedTo = "Assigned To is required.";
    if (!plainText) newErrors.note = "Note is required.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return false;

    const newTask: Task = {
      id: Date.now(),
      name: taskName,
      dueDate,
      time,
      type: taskType,
      priority,
      assignedTo,
      note, // ✅ HTML from RichTextEditor
    };

    const isValid = onSave(newTask);
    if (!isValid) {
      notify("Failed to save task", "error");
      return false;
    }

    notify("Task saved successfully", "success");
    return true;
  };

  useEffect(() => {
    if (isOpen) {
      setTaskName("");
      setDueDate("");
      setTime("");
      setTaskType("");
      setPriority("");
      setAssignedTo("");
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
      title="Create Task"
      onSave={validate}
    >
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Task Name <span className="text-red-500">*</span>
        </label>
        <Inputs
          variant="input"
          name="taskName"
          placeholder="Enter"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          className={errors.taskName ? "border-red-500" : ""}
        />
        {errors.taskName && (
          <p className="text-red-500 text-sm">{errors.taskName}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Due Date <span className="text-red-500">*</span>
          </label>
          <Inputs
            variant="date"
            name="dueDate"
            placeholder="Choose"
            value={dueDate}
            onChange={(v) => setDueDate(v)}
            className={errors.dueDate ? "border-red-500" : ""}
            inputMode="numeric"
            pattern="\d{4}-\d{2}-\d{2}"
            showCalendarIcon
          />
          {errors.dueDate && (
            <p className="text-red-500 text-sm">{errors.dueDate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time <span className="text-red-500">*</span>
          </label>
          <Inputs
            variant="time"
            name="time"
            placeholder="Choose"
            value={time}
            onChange={(v) => setTime(v)}
            className={errors.time ? "border-red-500" : ""}
            inputMode="numeric"
            pattern="\d{2}:\d{2}"
          />
          {errors.time && <p className="text-red-500 text-sm">{errors.time}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Task Type <span className="text-red-500">*</span>
          </label>
          <Inputs
            variant="select"
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            placeholder="Choose"
            options={[
              { label: "To-Do", value: "to do" },
              { label: "Call", value: "call" },
              { label: "Meeting", value: "meeting" },
              { label: "Email", value: "email" },
            ]}
            className={errors.taskType ? "border-red-500" : ""}
          />
          {errors.taskType && (
            <p className="text-red-500 text-sm">{errors.taskType}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority <span className="text-red-500">*</span>
          </label>
          <Inputs
            variant="select"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            placeholder="Choose"
            options={[
              { label: "High", value: "high" },
              { label: "Medium", value: "medium" },
              { label: "Low", value: "low" },
            ]}
            className={errors.priority ? "border-red-500" : ""}
          />
          {errors.priority && (
            <p className="text-red-500 text-sm">{errors.priority}</p>
          )}
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Assigned To <span className="text-red-500">*</span>
        </label>
        <Inputs
          variant="select"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          placeholder="Choose"
          options={userOptions || []}
          className={errors.assignedTo ? "border-red-500" : ""}
        />
        {errors.assignedTo && (
          <p className="text-red-500 text-sm">{errors.assignedTo}</p>
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
          <p className="text-red-500 text-sm mt-1">{errors.note}</p>
        )}
      </div>
    </ModalWrapper>
  );
}

