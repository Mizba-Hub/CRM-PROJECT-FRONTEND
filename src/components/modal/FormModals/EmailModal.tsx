"use client";

import React, { useState } from "react";
import {
  XMarkIcon,
  PaperClipIcon,
  FaceSmileIcon,
  LinkIcon,
  ChevronDownIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { PhotoIcon, TrashIcon } from "@heroicons/react/24/solid";
import { Inputs } from "@/components/ui/Inputs";
import { notify } from "@/components/ui/toast/Notify";

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
    scheduledFor?: string;
    attachments?: string[];
  }) => void;
}

export default function EmailModal({
  isOpen,
  onClose,
  onSend,
}: EmailModalProps) {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);

  if (!isOpen) return null;

  const resetForm = () => {
    setTo("");
    setCc("");
    setBcc("");
    setSubject("");
    setBody("");
    setAttachments([]);
    setError("");
    setSuccess("");
    setShowCcBcc(false);
  };

  const handleSend = () => {
    if (!to.trim()) {
      setError("Recipient is required");
      setSuccess("");
      return;
    }
    setError("");
    setSuccess("Email sent successfully");

    onSend({ to, cc, bcc, subject, body, attachments });

    setTimeout(() => {
      resetForm();
      onClose();
    }, 1200);
  };

  const handleScheduleSend = (time: string) => {
    onSend({ to, cc, bcc, subject, body, scheduledFor: time, attachments });
    setShowSchedule(false);
    resetForm();
    onClose();
  };

  const handleAttachment = () => {
    const fakeFile = `File-${attachments.length + 1}.pdf`;
    setAttachments((prev) => [...prev, fakeFile]);
    notify(`Attached ${fakeFile}`, "info");
  };

  return (
    <div
      className="fixed inset-0 flex justify-end z-50"
      style={{
        backdropFilter: "blur(4px) brightness(0.8)",
        backgroundColor: "rgba(153, 154, 156, 0.3)",
      }}
    >
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-md shadow-lg w-[600px] flex flex-col">
          <div className="bg-indigo-600 text-white flex justify-between items-center px-4 py-2 rounded-t-md">
            <h2 className="text-sm font-medium">New Email</h2>
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="hover:text-gray-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="p-0 flex-1 flex flex-col">
            <div className="flex justify-between items-center px-4 py-2 border-b">
              <Inputs
                variant="input"
                type="email"
                name="to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Recipients"
                className="w-full outline-none text-sm text-gray-700 placeholder-gray-400 border-0 focus:ring-0"
              />
              <button
                className="text-xs text-gray-600 flex items-center gap-1"
                onClick={() => setShowCcBcc((s) => !s)}
              >
                <span>Cc</span> <span>Bcc</span>
              </button>
            </div>
            {error && <p className="text-red-500 text-xs px-4">{error}</p>}
            {success && (
              <p className="text-green-600 text-xs px-4">{success}</p>
            )}

            {showCcBcc && (
              <div className="flex border-b px-4 py-2 gap-2">
                <Inputs
                  variant="input"
                  type="text"
                  name="cc"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="Cc"
                  className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none border-0 focus:ring-0"
                />
                <Inputs
                  variant="input"
                  type="text"
                  name="bcc"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="Bcc"
                  className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none border-0 focus:ring-0"
                />
              </div>
            )}

            <div className="border-b px-4 py-2">
              <Inputs
                variant="input"
                type="text"
                name="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="w-full outline-none text-sm text-gray-700 placeholder-gray-400 border-0 focus:ring-0"
              />
            </div>

            <div className="flex-1 px-4 py-2">
              <Inputs
                variant="textarea"
                name="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Body Text"
                className="w-full outline-none text-sm text-black resize-none min-h-[200px] border-0 focus:ring-0 placeholder-gray-400"
              />
            </div>

            {attachments.length > 0 && (
              <div className="px-4 py-2 text-xs text-gray-600 border-t">
                <p>Attachments:</p>
                <ul className="list-disc list-inside">
                  {attachments.map((file, idx) => (
                    <li key={idx}>{file}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center px-4 py-2 border-t bg-gray-50 rounded-b-md relative">
            <div className="flex items-center gap-2 relative">
              <div className="flex border rounded overflow-hidden">
                <button
                  onClick={handleSend}
                  className="bg-indigo-600 text-white px-4 py-1.5 text-sm hover:bg-indigo-700"
                >
                  Send
                </button>
                <button
                  className="px-2 bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center"
                  onClick={() => setShowSchedule(!showSchedule)}
                >
                  <ChevronDownIcon className="w-4 h-4" />
                </button>
              </div>

              {showSchedule && (
                <div className="absolute top-10 left-0 bg-white border rounded shadow-lg w-64 text-sm text-black z-50 p-3">
                  <button
                    onClick={() =>
                      handleScheduleSend("Tomorrow morning at 8:00 AM")
                    }
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
                  >
                    <ClockIcon className="w-4 h-4 text-gray-500" />
                    Tomorrow morning (8:00 AM)
                  </button>
                  <button
                    onClick={() =>
                      handleScheduleSend("Tomorrow afternoon at 1:00 PM")
                    }
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
                  >
                    <ClockIcon className="w-4 h-4 text-gray-500" />
                    Tomorrow afternoon (1:00 PM)
                  </button>
                  <button
                    onClick={() =>
                      handleScheduleSend("Next week Monday 8:00 AM")
                    }
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
                  >
                    <ClockIcon className="w-4 h-4 text-gray-500" />
                    Next week (Mon 8:00 AM)
                  </button>

                  <div className="mt-2 border-t pt-2">
                    <label className="block text-xs text-gray-600 mb-1">
                      Pick date & time:
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full border rounded px-2 py-1 text-sm"
                      onChange={(e) => {
                        const customDate = e.target.value;
                        if (customDate) {
                          handleScheduleSend(
                            new Date(customDate).toLocaleString()
                          );
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                id="photo-upload"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const fileName = e.target.files[0].name;
                    setAttachments((prev) => [...prev, fileName]);
                    notify(`Added ${fileName}`, "info");
                  }
                }}
              />

              <div className="flex items-center gap-3 text-gray-600 ml-3">
                <PaperClipIcon
                  className="w-5 h-5 cursor-pointer hover:text-indigo-600"
                  onClick={handleAttachment}
                />
                <LinkIcon
                  className="w-5 h-5 cursor-pointer hover:text-indigo-600"
                  onClick={() => {
                    const url = prompt("Enter link URL:");
                    if (url) setBody((prev) => prev + " " + url);
                  }}
                />
                <FaceSmileIcon
                  className="w-5 h-5 cursor-pointer hover:text-indigo-600"
                  onClick={() => setBody((prev) => prev + " 🙂")}
                />
                <label htmlFor="photo-upload">
                  <PhotoIcon className="w-5 h-5 cursor-pointer hover:text-indigo-600" />
                </label>
              </div>
            </div>

            <TrashIcon
              className="w-5 h-5 cursor-pointer text-gray-500 hover:text-black"
              onClick={() => {
                resetForm();
                onClose();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
