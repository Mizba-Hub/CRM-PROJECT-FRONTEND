"use client";

import React, { useState, useEffect } from "react";
import ModalWrapper from "../ModalWrapper";
import { notify } from "@/components/ui/toast/Notify";
import RichTextEditor from "@/components/ui/RichTextEditor";

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteContent: string) => boolean;
}

export default function NoteModal({ isOpen, onClose, onSave }: NoteModalProps) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  
  useEffect(() => {
    if (isOpen) {
      setNote("");
      setError("");
    }
  }, [isOpen]);

  
  const validate = () => {
    const plainText = note.replace(/<[^>]*>/g, "").trim(); 
    if (!plainText) {
      setError("Note is required.");
      return false;
    }

    const isValid = onSave(note);
    if (!isValid) {
      notify("Failed to save note", "error");
      return false;
    }

    notify("Note saved successfully", "success");
    setError("");
    return true;
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={() => {
        setError("");
        onClose();
      }}
      title="Create Note"
      onSave={validate}
    >
     
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Note <span className="text-red-500">*</span>
      </label>

      <RichTextEditor
        value={note}
        onChange={setNote}
        placeholder="Enter"
        className={error ? "border-red-500 ring-red-300" : ""}
      />

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </ModalWrapper>
  );
}
