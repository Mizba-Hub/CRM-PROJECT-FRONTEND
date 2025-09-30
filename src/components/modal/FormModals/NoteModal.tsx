"use client";

import React, { useRef, useState, useEffect } from "react";
import ModalWrapper from "../ModalWrapper";
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  PhotoIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { ListOrdered as ListOrderedIcon } from "lucide-react";

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteContent: string) => boolean;
}

export default function NoteModal({ isOpen, onClose, onSave }: NoteModalProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
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

  
  const format = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
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
    const content = editorRef.current?.innerHTML || "";
    const plainText = editorRef.current?.innerText.trim() || "";

    if (!plainText) {
      setError("note is required.");
      return false;
    }

    const isValid = onSave(content);
    if (!isValid) {
      setError("note is required.");
      return false;
    }

    setError("");
    return true;
  };

  useEffect(() => {
    if (isOpen && editorRef.current) {
      editorRef.current.innerHTML = "";
      setIsEmpty(true);
      setIsFocused(false);
      setError("");
      setActiveFormats({
        bold: false,
        italic: false,
        underline: false,
        ul: false,
        ol: false,
      });
      setBlockType("p");
    }
  }, [isOpen]);

  const blockOptions = [
    { label: "Normal text", tag: "p" },
    { label: "Heading 1", tag: "h1" },
    { label: "Heading 2", tag: "h2" },
    { label: "Heading 3", tag: "h3" },
  ];

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

      
      <div
        className={`w-full border rounded ${
          error
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
              {blockOptions.map((opt) => (
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
            className={`p-2 rounded ${
              activeFormats.bold ? "bg-purple-200" : "hover:bg-gray-200"
            }`}
          >
            <BoldIcon className="w-4 h-4 text-gray-600" />
          </button>

          
          <button
            onClick={() => format("italic")}
            type="button"
            title="Italic"
            className={`p-2 rounded ${
              activeFormats.italic ? "bg-purple-200" : "hover:bg-gray-200"
            }`}
          >
            <ItalicIcon className="w-4 h-4 text-gray-600" />
          </button>

          
          <button
            onClick={() => format("underline")}
            type="button"
            title="Underline"
            className={`p-2 rounded ${
              activeFormats.underline ? "bg-purple-200" : "hover:bg-gray-200"
            }`}
          >
            <UnderlineIcon className="w-4 h-4 text-gray-600" />
          </button>

          
          <button
            onClick={() => format("insertUnorderedList")}
            type="button"
            title="Bullet List"
            className={`p-2 rounded ${
              activeFormats.ul ? "bg-purple-200" : "hover:bg-gray-200"
            }`}
          >
            <ListBulletIcon className="w-4 h-4 text-gray-600" />
          </button>

          
          <button
            onClick={() => format("insertOrderedList")}
            type="button"
            title="Numbered List"
            className={`p-2 rounded ${
              activeFormats.ol ? "bg-purple-200" : "hover:bg-gray-200"
            }`}
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

      
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </ModalWrapper>
  );
}








