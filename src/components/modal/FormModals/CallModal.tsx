"use client";

import React, { useState, useEffect } from "react";
import ModalWrapper from "../ModalWrapper";
import { notify } from "@/components/ui/toast/Notify";
import { Inputs } from "@/components/ui/Inputs";
import RichTextEditor from "@/components/ui/RichTextEditor";

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (call: Call) => boolean;
  connectedPerson?: string;
}

export type Call = {
  id: number;
  connected: string;
  outcome: string;
  date: string;
  time: string;
  note: string;
  extra?: Record<string, any>;
};

export default function CallModal({
  isOpen,
  onClose,
  onSave,
  connectedPerson,
}: CallModalProps) {
  const [connected, setConnected] = useState(connectedPerson || "");
  const [outcome, setOutcome] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const plainText = note.replace(/<[^>]*>/g, "").trim();
    const newErrors: Record<string, string> = {};

    if (!connected) newErrors.connected = "Connected field is required.";
    if (!outcome) newErrors.outcome = "Call Outcome is required.";
    if (!date) newErrors.date = "Date is required.";
    if (!time) newErrors.time = "Time is required.";
    if (!plainText) newErrors.note = "Note is required.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return false;

    const newCall: Call = {
      id: Date.now(),
      connected,
      outcome,
      date,
      time,
      note,
      extra: { outcome },
    };

    const isValid = onSave(newCall);
    if (!isValid) {
      notify("Failed to log call", "error");
      return false;
    }

    notify("Call logged successfully", "success");
    return true;
  };

  useEffect(() => {
    if (isOpen) {
      setConnected(connectedPerson || "");
      setOutcome("");
      setDate("");
      setTime("");
      setNote("");
      setErrors({});
    }
  }, [isOpen, connectedPerson]);

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={() => {
        setErrors({});
        onClose();
      }}
      title="Log Call"
      onSave={validate}
    >
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Connected <span className="text-red-500">*</span>
        </label>
        <Inputs
          variant="input"
          type="text"
          name="connected"
          value={connected}
          disabled
          className="bg-gray-100 text-gray-700"
        />
        {errors.connected && (
          <p className="text-red-500 text-sm mt-1">{errors.connected}</p>
        )}
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Call Outcome <span className="text-red-500">*</span>
        </label>
        <Inputs
          variant="select"
          name="outcome"
          placeholder="Choose"
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          options={[
            { label: "Successful", value: "successful" },
            { label: "Unsuccessful", value: "unsuccessful" },
          ]}
          className={errors.outcome ? "border-red-500" : ""}
        />
        {errors.outcome && (
          <p className="text-red-500 text-sm mt-1">{errors.outcome}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date <span className="text-red-500">*</span>
          </label>
          <Inputs
            variant="input"
            type="date"
            name="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={errors.date ? "border-red-500" : ""}
          />
          {errors.date && (
            <p className="text-red-500 text-sm mt-1">{errors.date}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time <span className="text-red-500">*</span>
          </label>
          <Inputs
            variant="input"
            type="time"
            name="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={errors.time ? "border-red-500" : ""}
          />
          {errors.time && (
            <p className="text-red-500 text-sm mt-1">{errors.time}</p>
          )}
        </div>
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
