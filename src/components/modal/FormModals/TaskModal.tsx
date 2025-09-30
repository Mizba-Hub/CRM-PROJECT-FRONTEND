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

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => boolean;
}

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

export default function TaskModal({ isOpen, onClose, onSave }: TaskModalProps) {
  const [taskName, setTaskName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [time, setTime] = useState("");
  const [taskType, setTaskType] = useState("");
  const [priority, setPriority] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    ul: false,
    ol: false,
  });
  const [blockType, setBlockType] = useState("p");

  
  const format = (command: string, value?: string) => {
    if (editorRef.current) editorRef.current.focus();
    document.execCommand(command, false, value);
    updateFormatState();
  };

  const updateFormatState = () => {
    const sel = window.getSelection();
    let parentTag = "";

    if (sel && sel.anchorNode) {
      let parentEl: HTMLElement | null =
        sel.anchorNode.nodeType === 3
          ? (sel.anchorNode.parentElement as HTMLElement)
          : (sel.anchorNode as HTMLElement);

      while (parentEl && parentEl !== editorRef.current) {
        const tag = parentEl.tagName.toLowerCase();
        if (["ul", "ol", "h1", "h2", "h3", "p"].includes(tag)) {
          parentTag = tag;
          break;
        }
        parentEl = parentEl.parentElement;
      }
    }

    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      ul: parentTag === "ul",
      ol: parentTag === "ol",
    });

    if (["h1", "h2", "h3", "p"].includes(parentTag)) {
      setBlockType(parentTag);
    }
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
    if (!taskName) newErrors.taskName = "Task Name is required.";
    if (!dueDate) newErrors.dueDate = "Due Date is required.";
    if (!time) newErrors.time = "Time is required.";
    if (!taskType) newErrors.taskType = "Task Type is required.";
    if (!priority) newErrors.priority = "Priority is required.";
    if (!assignedTo) newErrors.assignedTo = "Assigned To is required.";
    if (!plainNote) newErrors.note = "Note is required.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
     
      return false;
    }

    const newTask: Task = {
      id: Date.now(),
      name: taskName,
      dueDate,
      time,
      type: taskType,
      priority,
      assignedTo,
      note: noteContent,
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
    if (isOpen && editorRef.current) {
      setTaskName("");
      setDueDate("");
      setTime("");
      setTaskType("");
      setPriority("");
      setAssignedTo("");
      editorRef.current.innerHTML = "";
      setIsEmpty(true);
      setErrors({});
      setActiveFormats({ bold: false, italic: false, underline: false, ul: false, ol: false });
      setBlockType("p");
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
        {errors.taskName && <p className="text-red-500 text-sm">{errors.taskName}</p>}
      </div>

      
      <div className="grid grid-cols-2 gap-3 mb-3">
        
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Due Date <span className="text-red-500">*</span>
          </label>
          <Inputs
            variant="input"
            type="date"
            name="dueDate"
            value={dueDate}
            onFocus={(e) => e.target.classList.add("placeholder-transparent")}
            onBlur={(e) => {
              if (!e.target.value) e.target.classList.remove("placeholder-transparent");
            }}
            onChange={(e) => setDueDate(e.target.value)}
            placeholder="Choose"
            className={`pr-10 ${errors.dueDate ? "border-red-500" : ""}`}
          />
          {errors.dueDate && <p className="text-red-500 text-sm">{errors.dueDate}</p>}
        </div>

        {/* Time */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time <span className="text-red-500">*</span>
          </label>
          <Inputs
            variant="input"
            type="time"
            name="time"
            value={time}
            onFocus={(e) => e.target.classList.add("placeholder-transparent")}
            onBlur={(e) => {
              if (!e.target.value) e.target.classList.remove("placeholder-transparent");
            }}
            onChange={(e) => setTime(e.target.value)}
            placeholder="Choose"
            className={`pr-10 ${errors.time ? "border-red-500" : ""}`}
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
            name="taskType"
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            placeholder="Choose"
            options={[
              { label: "To-Do", value: "To-Do" },
              { label: "Call", value: "Call" },
              { label: "Meeting", value: "Meeting" },
              { label: "Email", value: "Email" },
            ]}
            className={errors.taskType ? "border-red-500" : ""}
          />
          {errors.taskType && <p className="text-red-500 text-sm">{errors.taskType}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority <span className="text-red-500">*</span>
          </label>
          <Inputs
            variant="select"
            name="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            placeholder="Choose"
            options={[
              { label: "High", value: "High" },
              { label: "Medium", value: "Medium" },
              { label: "Low", value: "Low" },
            ]}
            className={errors.priority ? "border-red-500" : ""}
          />
          {errors.priority && <p className="text-red-500 text-sm">{errors.priority}</p>}
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Assigned To <span className="text-red-500">*</span>
        </label>
        <Inputs
          variant="select"
          name="assignedTo"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          placeholder="Choose"
          options={[
            { label: "Maria Johnson", value: "Maria Johnson" },
            { label: "John Doe", value: "John Doe" },
            { label: "Jane Smith", value: "Jane Smith" },
          ]}
          className={errors.assignedTo ? "border-red-500" : ""}
        />
        {errors.assignedTo && <p className="text-red-500 text-sm">{errors.assignedTo}</p>}
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
                {[
                  { label: "Normal text", tag: "p" },
                  { label: "Heading 1", tag: "h1" },
                  { label: "Heading 2", tag: "h2" },
                  { label: "Heading 3", tag: "h3" },
                ].map((opt) => (
                  <option key={opt.tag} value={opt.tag}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="w-3 h-3 absolute right-2.5 top-1.5 pointer-events-none text-gray-700" />
            </div>

            <button
              onClick={() => format("bold")}
              type="button"
              title="Bold"
              className={`p-2 rounded ${activeFormats.bold ? "bg-purple-200" : "hover:bg-gray-200"}`}
            >
              <BoldIcon className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => format("italic")}
              type="button"
              title="Italic"
              className={`p-2 rounded ${activeFormats.italic ? "bg-purple-200" : "hover:bg-gray-200"}`}
            >
              <ItalicIcon className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => format("underline")}
              type="button"
              title="Underline"
              className={`p-2 rounded ${activeFormats.underline ? "bg-purple-200" : "hover:bg-gray-200"}`}
            >
              <UnderlineIcon className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => format("insertUnorderedList")}
              type="button"
              title="Bullet List"
              className={`p-2 rounded ${activeFormats.ul ? "bg-purple-200" : "hover:bg-gray-200"}`}
            >
              <ListBulletIcon className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => format("insertOrderedList")}
              type="button"
              title="Numbered List"
              className={`p-2 rounded ${activeFormats.ol ? "bg-purple-200" : "hover:bg-gray-200"}`}
            >
              <ListOrderedIcon className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => {
                const url = prompt("Enter image URL:");
                if (url) format("insertImage", url);
              }}
              type="button"
              title="Insert Image"
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
                const content = editorRef.current?.innerText.trim() || "";
                setIsFocused(false);
                setIsEmpty(content.length === 0);
              }}
              className="px-3 py-2 min-h-[120px] text-sm text-black focus:outline-none"
              suppressContentEditableWarning
            />
          </div>
        </div>
        {errors.note && <p className="text-red-500 text-sm mt-1">{errors.note}</p>}
      </div>
    </ModalWrapper>
  );
}