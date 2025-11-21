"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  XMarkIcon,
  PaperClipIcon,
  FaceSmileIcon,
  LinkIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { ChevronDown } from "lucide-react";
import { ListOrdered as ListOrderedIcon } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { PhotoIcon, TrashIcon } from "@heroicons/react/24/solid";
import { notify } from "@/components/ui/toast/Notify";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getEntityEmail } from "@/app/lib/utils";

import "@tiptap/extension-image";

declare module "@tiptap/extension-image" {
  interface SetImageOptions {
    filename?: string;
  }
}

const FormatIcon = ({
  className = "",
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  className?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className={className}
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    <path d="M4 20h16" strokeLinecap="round" />
    <path d="M6 20l6-16 6 16" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.5 16h7" strokeLinecap="round" />
  </svg>
);

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
    attachments?: { name: string; url: string }[];
  }) => void;
  connectedPerson?: string;

  recordAttachments?: { id: number; name: string; url?: string }[];
  onAttachToRecord?: (file: {
    name: string;
    url: string;
    type?: string;
  }) => void;
}

const EMAIL_SPLIT = /[,\s;]+/;
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const normalizeList = (input: string) =>
  input
    .split(EMAIL_SPLIT)
    .map((s) => s.trim())
    .filter(Boolean);

type ChipInputProps = {
  placeholder?: string;
  values: string[];
  onChange: (next: string[]) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  showLabel?: boolean;
  labelText?: string;
  lockedValues?: string[];
};

const ChipInput: React.FC<ChipInputProps> = ({
  placeholder,
  values,
  onChange,
  onFocus,
  onBlur,
  showLabel = false,
  labelText = "To:",
  lockedValues = [],
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [text, setText] = React.useState("");
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        if (focused) {
          commit();
          setFocused(false);
          onBlur?.();
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [focused, text, values]);

  const commit = () => {
    if (!text.trim()) return;
    const parts = normalizeList(text);
    const next = [...values];
    parts.forEach((p) => {
      if (isValidEmail(p) && !next.includes(p)) next.push(p);
    });
    onChange(next);
    setText("");
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (["Enter", ",", ";"].includes(e.key)) {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !text && values.length) {
      onChange(values.slice(0, -1));
    }
  };

  const handlePaste: React.ClipboardEventHandler<HTMLInputElement> = (e) => {
    const data = e.clipboardData.getData("text");
    if (EMAIL_SPLIT.test(data)) {
      e.preventDefault();
      const parts = normalizeList(data);
      const next = [...values];
      parts.forEach((p) => {
        if (isValidEmail(p) && !next.includes(p)) next.push(p);
      });
      onChange(next);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="flex flex-wrap items-center gap-1 w-full min-h-[28px] cursor-text"
      onClick={() => {
        setFocused(true);
        inputRef.current?.focus();
        onFocus?.();
      }}
    >
      {focused && showLabel && (
        <span className="text-sm text-gray-600 select-none mr-1">
          {labelText || "To:"}
        </span>
      )}

      {focused ? (
        <>
          {values.map((v) => {
            const isLocked = lockedValues?.includes(v);
            return (
              <span
                key={v}
                className={`flex items-center gap-1 ${
                  isLocked
                    ? "bg-gray-100 text-gray-600 border border-gray-200"
                    : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                } rounded-full px-2 py-0.5 text-xs`}
              >
                {v}
                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => onChange(values.filter((x) => x !== v))}
                    className="text-indigo-400 hover:text-red-500"
                  >
                    ×
                  </button>
                )}
              </span>
            );
          })}
        </>
      ) : (
        values.length > 0 && (
          <span className="text-sm text-gray-800">{values.join(", ")}</span>
        )
      )}

      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={values.length === 0 && !text ? placeholder : ""}
        onFocus={() => {
          if (!focused) setFocused(true);
          onFocus?.();
        }}
        onBlur={(e) => {
          if (!wrapperRef.current?.contains(e.relatedTarget as Node)) {
            commit();
            setFocused(false);
            onBlur?.();
          }
        }}
        className={`flex-1 min-w-[140px] outline-none text-sm placeholder-gray-400 ${
          focused || values.length === 0 ? "visible" : "invisible w-0"
        }`}
      />
    </div>
  );
};

export default function EmailModal({
  isOpen,
  onClose,
  onSend,
  connectedPerson,
  recordAttachments,
  onAttachToRecord,
}: EmailModalProps) {
  const [toList, setToList] = useState<string[]>([]);
  const [ccList, setCcList] = useState<string[]>([]);
  const [bccList, setBccList] = useState<string[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [showSendMenu, setShowSendMenu] = useState(false);
  const [showSchedulePopover, setShowSchedulePopover] = useState(false);
  const [subject, setSubject] = useState("");
  const [attachments, setAttachments] = useState<
    { name: string; url: string }[]
  >([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [showFormat, setShowFormat] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [isToFocused, setIsToFocused] = useState(false);
  const [altPopover, setAltPopover] = useState<{
    show: boolean;
    currentAlt: string;
    nodePos: number;
  } | null>(null);

  const [linkMenu, setLinkMenu] = useState<{
    x: number;
    y: number;
    href: string;
  } | null>(null);
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const [fmtActive, setFmtActive] = useState({
    bold: false,
    italic: false,
    underline: false,
    bullet: false,
    ordered: false,
  });
  const [imageMenu, setImageMenu] = useState<{
    x: number;
    y: number;
    nodePos: number;
    attrs: { src?: string; alt?: string };
  } | null>(null);

  const attachInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const linkInputRef = useRef<HTMLInputElement | null>(null);
  const linkTextInputRef = useRef<HTMLInputElement | null>(null);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(new Date());

  const [showFileSource, setShowFileSource] = useState(false);
  const [showRecordPicker, setShowRecordPicker] = useState(false);

  const closeAllPopovers = () => {
    setShowFileSource(false);
    setShowEmoji(false);
    setShowFormat(false);
    setShowLinkPopover(false);
    setLinkMenu(null);
    setImageMenu(null);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target.closest(".file-popover")) return;

      if (target.closest(".paperclip-btn")) return;

      setShowFileSource(false);
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const ExtendedImage = Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        src: { default: null },
        alt: { default: null },
        filename: { default: null },
        style: {
          default: null,
          parseHTML: (element) => element.getAttribute("style"),
          renderHTML: (attributes) =>
            attributes.style ? { style: attributes.style } : {},
        },
      };
    },
  });

  const collapseCcBcc = () => {
    if (showCc || showBcc) {
      setShowCc(false);
      setShowBcc(false);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      ExtendedImage.configure({ allowBase64: true }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class:
            "text-indigo-600 underline cursor-pointer hover:text-indigo-800 transition-colors",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Placeholder.configure({
        placeholder: "Body Text",
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-gray-400 before:absolute before:pointer-events-none",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[220px] text-sm relative",
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (
        target.closest(".popover") ||
        target.closest(".image-popover") ||
        target.closest(".gmail-link-popover") ||
        target.closest(".file-popover") ||
        target.closest(".paperclip-btn") ||
        target.closest(".send-dropdown-button") ||
        target.closest(".send-dropdown-menu") ||
        target.closest(".schedule-popover")
      ) {
        return;
      }

      setShowEmoji(false);
      setShowLinkPopover(false);
      setShowFormat(false);
      setLinkMenu(null);
      setShowSendMenu(false);
      setShowSchedulePopover(false);
      setShowFileSource(false);
      setImageMenu(null);
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (!connectedPerson) return;

    if (connectedPerson.startsWith("email:")) {
      const directEmail = connectedPerson.slice("email:".length).trim();
      if (directEmail) {
        setToList([directEmail]);
      }
      return;
    }

    const [type, id] = connectedPerson.includes(":")
      ? connectedPerson.split(":")
      : [connectedPerson, ""];
    const email = getEntityEmail(type, id);
    if (email) {
      setToList([email]);
    }
  }, [isOpen, connectedPerson]);

  useEffect(() => {
    if (!editor) return;
    const refresh = () => {
      setFmtActive({
        bold: editor.isActive("bold"),
        italic: editor.isActive("italic"),
        underline: editor.isActive("underline"),
        bullet: editor.isActive("bulletList"),
        ordered: editor.isActive("orderedList"),
      });
    };
    refresh();
    editor.on("selectionUpdate", refresh);
    editor.on("transaction", refresh);
    editor.on("update", refresh);
    return () => {
      editor.off("selectionUpdate", refresh);
      editor.off("transaction", refresh);
      editor.off("update", refresh);
    };
  }, [editor]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (
        target.closest(".send-dropdown-button") ||
        target.closest(".schedule-popover") ||
        target.closest(".send-dropdown-menu")
      ) {
        return;
      }

      setShowSendMenu(false);
      setShowSchedulePopover(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!editor) return;
    let running = false;
    const handler = () => {
      if (running) return;
      const state = editor.state;
      const { from, to } = state.selection;
      const hasLink = state.doc.rangeHasMark(from, to, state.schema.marks.link);
      if (!hasLink && editor.isActive("link")) {
        running = true;
        editor.chain().unsetMark("link").run();
        running = false;
      }
    };
    editor.on("transaction", handler);
    return () => {
      editor.off("transaction", handler);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const handleImageClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      if (target.closest(".image-popover") || target.closest(".popover"))
        return;

      if (target.tagName === "IMG" && target.closest(".ProseMirror")) {
        event.preventDefault();

        const rect = target.getBoundingClientRect();
        const pos = editor.view.posAtDOM(target, 0);
        const doc = editor.state.doc;

        if (pos < 0 || pos > doc.content.size) {
          console.warn("Invalid image position detected:", pos);
          setImageMenu(null);
          return;
        }

        const $pos = doc.resolve(pos);

        const childAfter = $pos.parent.childAfter($pos.parentOffset);
        const childBefore = $pos.parent.childBefore($pos.parentOffset);

        let imageNode = null;
        let nodePos = 0;

        if (childAfter.node && childAfter.node.type.name === "image") {
          imageNode = childAfter.node;
          nodePos = $pos.start() + childAfter.offset;
        } else if (childBefore.node && childBefore.node.type.name === "image") {
          imageNode = childBefore.node;
          nodePos = $pos.start() + childBefore.offset;
        }

        if (!imageNode) {
          setImageMenu(null);
          return;
        }

        setImageMenu({
          x: rect.left + rect.width / 2,
          y: rect.bottom + window.scrollY + 6,
          nodePos,
          attrs: imageNode.attrs as { src?: string; alt?: string },
          nodeSize: imageNode.nodeSize,
        } as any);
      } else {
        setImageMenu(null);
      }
    };

    document.addEventListener("mousedown", handleImageClick, true);
    return () =>
      document.removeEventListener("mousedown", handleImageClick, true);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest(".gmail-link-popover") || target.closest(".popover"))
        return;
      if (target.tagName === "A" && target.closest(".ProseMirror")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const href = (target as HTMLAnchorElement).getAttribute("href") || "";
        const rect = target.getBoundingClientRect();
        const pos = editor.view.posAtDOM(target, 0);
        const { schema } = editor.state;
        const $pos = editor.state.doc.resolve(pos);
        let start = pos,
          end = pos;
        $pos.parent.nodesBetween(
          0,
          $pos.parent.content.size,
          (node, offset) => {
            if (node.marks.some((m) => m.type === schema.marks.link)) {
              start = $pos.start() + offset;
              end = $pos.start() + offset + node.nodeSize;
            }
          }
        );
        editor.chain().setTextSelection({ from: start, to: end }).focus().run();
        setLinkMenu({
          x: rect.left + rect.width / 2,
          y: rect.bottom + window.scrollY + 6,
          href,
        });
      } else {
        setLinkMenu(null);
      }
    };
    document.addEventListener("mousedown", handleLinkClick, true);
    return () =>
      document.removeEventListener("mousedown", handleLinkClick, true);
  }, [editor]);

  if (!isOpen) return null;

  const resetForm = () => {
    setToList([]);
    setCcList([]);
    setBccList([]);
    setSubject("");
    setAttachments([]);
    setShowEmoji(false);
    setShowLinkPopover(false);
    setShowFormat(false);
    setLinkMenu(null);
    setShowCc(false);
    setShowBcc(false);
    editor?.commands.clearContent();
  };

  const handleSend = () => {
    if (toList.length === 0)
      return notify("Add at least one recipient", "error");

    const subjectEmpty = !subject.trim();
    const bodyEmpty = !editor?.getText().trim();

    if (subjectEmpty || bodyEmpty) {
      const confirmSend = window.confirm(
        "Send this message without a subject or text in the body?"
      );
      if (!confirmSend) return;
    }

    onSend({
      to: toList.join(", "),
      cc: ccList.length ? ccList.join(", ") : undefined,
      bcc: bccList.length ? bccList.join(", ") : undefined,
      subject,
      body: editor?.getHTML() || "",
      attachments,
    });

    notify("Email Sent Successfully", "success");
    resetForm();
    onClose();
  };

  const handleAttachment = (files: FileList | null) => {
    if (!files?.length) return;
    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const fileUrl = URL.createObjectURL(file);

      setAttachments((prev) => [...prev, { name: file.name, url: fileUrl }]);
      onAttachToRecord?.({
        name: file.name,
        url: fileUrl,
        type: file.type,
      });
      notify(`Attached ${file.name}`, "info");
    });
  };

  const applyLink = () => {
    if (!editor) return;

    const href = linkUrl.trim();
    const text = linkText.trim();

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(href);
    const isValidUrl =
      /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})([\/\w .-]*)*\/?$/.test(href);

    if (!isEmail && !isValidUrl) {
      notify("Enter a valid URL or email address", "error");
      return;
    }

    const finalHref = isEmail
      ? `mailto:${href}`
      : href.startsWith("http")
      ? href
      : `https://${href}`;

    if (!showLinkPopover && href && !text) {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${finalHref}" target="_blank">${href}</a> `)
        .run();
      notify("Link added", "success");
      setLinkUrl("");
      setLinkText("");
      return;
    }

    if (text && href) {
      const saved = (editor as any).__savedSelection;
      if (saved && saved.from !== saved.to) {
        editor
          .chain()
          .setTextSelection({ from: saved.from, to: saved.to })
          .focus()
          .extendMarkRange("link")
          .setLink({ href: finalHref })
          .run();
      } else {
        editor
          .chain()
          .focus()
          .insertContent(`<a href="${finalHref}" target="_blank">${text}</a> `)
          .run();
      }
      notify("Link added", "success");
      setShowLinkPopover(false);
      setLinkUrl("");
      setLinkText("");
    }
  };

  return (
    <div
      className="fixed inset-0 flex justify-end z-50"
      style={{
        backdropFilter: "blur(4px) brightness(0.8)",
        backgroundColor: "rgba(153,154,156,0.3)",
      }}
    >
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div
          ref={modalRef}
          className="bg-white rounded-md shadow-lg w-[620px] flex flex-col"
        >
          <div className="bg-indigo-600 text-white flex justify-between items-center px-4 py-2 rounded-t-md">
            <h2 className="text-sm font-medium">New Email</h2>
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4">
            <div className="px-0.5 py-2 border-b border-gray-200">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-[200px]">
                  <ChipInput
                    values={toList}
                    onChange={setToList}
                    placeholder="Recipients"
                    onFocus={() => setIsToFocused(true)}
                    onBlur={() => setIsToFocused(false)}
                    showLabel
                    labelText="To:"
                    lockedValues={[toList[0]]}
                  />
                </div>

                {!showCc && ccList.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setShowCc(true)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Cc Bcc
                  </button>
                )}
              </div>
            </div>

            {(showCc || ccList.length > 0) && (
              <div className="px-0.5 py-2 border-b border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <ChipInput
                      values={ccList}
                      onChange={setCcList}
                      placeholder="Cc"
                    />
                  </div>

                  {!showBcc && bccList.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setShowBcc(true)}
                      className="text-xs text-indigo-600 hover:underline mt-[2px]"
                    >
                      Bcc
                    </button>
                  )}
                </div>
              </div>
            )}

            {(showBcc || bccList.length > 0) && (
              <div className="px-1 py-2 border-b border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <ChipInput
                      values={bccList}
                      onChange={setBccList}
                      placeholder="Bcc"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className=" border-b border-gray-200 ">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onFocus={collapseCcBcc}
                placeholder="Subject"
                className="w-full text-sm px-1 py-2 border-0 focus:ring-0 focus:outline-none"
              />
            </div>

            <div className="flex-1 relative border-b border-gray-200 overflow-visible">
              <EditorContent
                editor={editor}
                aria-placeholder="Body Text"
                className="min-h-[220px] max-h-[300px] overflow-y-auto pl-[2px] prose prose-sm max-w-none focus:outline-none"
                onFocus={collapseCcBcc}
              />

              {editor && imageMenu && (
                <div
                  className="image-popover absolute bg-white border rounded-md shadow-md px-4 py-2 text-xs flex items-center justify-between whitespace-nowrap z-50 space-x-6"
                  style={{
                    top:
                      imageMenu.y -
                      (editor.view.dom.getBoundingClientRect().top || 0) +
                      -6,
                    left:
                      imageMenu.x -
                      (editor.view.dom.getBoundingClientRect().left || 0) +
                      80,
                    transform: "translateX(-50%)",
                    minWidth: "320px",
                  }}
                >
                  {(() => {
                    const updateImage = (attrs: Record<string, any>) => {
                      if (!editor) return;
                      const { state, view } = editor;
                      const { tr, schema } = state;
                      const imgType = schema.nodes.image;
                      const current = state.doc.nodeAt(imageMenu.nodePos);
                      if (!current || current.type.name !== "image") return;
                      tr.setNodeMarkup(imageMenu.nodePos, imgType, {
                        ...current.attrs,
                        ...attrs,
                      });
                      view.dispatch(tr);
                      view.focus();
                    };

                    const currentNode = editor.state.doc.nodeAt(
                      imageMenu.nodePos
                    );
                    const currentStyle = currentNode?.attrs?.style || "";

                    return (
                      <>
                        <button
                          onClick={() => {
                            updateImage({ style: "width:120px; height:auto;" });
                            setImageMenu(null);
                          }}
                          className={`transition-colors ${
                            currentStyle.includes("width:120px")
                              ? "text-black font-medium"
                              : "text-indigo-600 hover:text-black"
                          }`}
                        >
                          Small
                        </button>

                        <button
                          onClick={() => {
                            updateImage({ style: "width:100%; height:auto;" });
                            setImageMenu(null);
                          }}
                          className={`transition-colors ${
                            currentStyle.includes("width:100%")
                              ? "text-black font-medium"
                              : "text-indigo-600 hover:text-black"
                          }`}
                        >
                          Best fit
                        </button>

                        <button
                          onClick={() => {
                            updateImage({ style: "" });
                            setImageMenu(null);
                          }}
                          className={`transition-colors ${
                            currentStyle.trim() === ""
                              ? "text-black font-medium"
                              : "text-indigo-600 hover:text-black"
                          }`}
                        >
                          Original size
                        </button>

                        <button
                          onClick={() => {
                            const { src, alt, filename } = imageMenu.attrs as {
                              src?: string;
                              alt?: string;
                              filename?: string;
                            };
                            let defaultAlt = alt?.trim() || "";
                            if (!defaultAlt) {
                              if (filename) {
                                defaultAlt = filename.replace(/\.[^/.]+$/, "");
                              } else if (src && !src.startsWith("data:image")) {
                                try {
                                  const parts = src.split("/");
                                  defaultAlt = decodeURIComponent(
                                    parts.pop() || "image"
                                  ).replace(/\.[^/.]+$/, "");
                                } catch {
                                  defaultAlt = "image";
                                }
                              } else {
                                defaultAlt = "image";
                              }
                            }
                            setAltPopover({
                              show: true,
                              currentAlt: defaultAlt,
                              nodePos: imageMenu.nodePos,
                            });
                            setImageMenu(null);
                          }}
                          className="text-indigo-600 hover:text-black transition-colors"
                        >
                          Edit alt text
                        </button>

                        <button
                          onClick={() => {
                            const { state, view } = editor;
                            const { tr } = state;
                            const node = state.doc.nodeAt(imageMenu.nodePos);
                            if (!node) return;
                            tr.delete(
                              imageMenu.nodePos,
                              imageMenu.nodePos + node.nodeSize
                            );
                            view.dispatch(tr);
                            view.focus();
                            notify("Image removed", "info");
                            setImageMenu(null);
                          }}
                          className="text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      </>
                    );
                  })()}
                </div>
              )}

              {attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs border border-blue-200"
                    >
                      <a
                        href={file.url}
                        download={file.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline truncate max-w-[140px]"
                      >
                        {file.name}
                      </a>
                      <button
                        onClick={() => {
                          URL.revokeObjectURL(file.url);
                          setAttachments((prev) =>
                            prev.filter((_, i) => i !== idx)
                          );
                          notify(`${file.name} removed`, "info");
                        }}
                        className="text-gray-400 hover:text-red-500 text-[11px]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {hoverLabel &&
                !showFormat &&
                !showEmoji &&
                !showLinkPopover &&
                !linkMenu && (
                  <div className="absolute bottom-0 left-30 bg-gray-200 text-black text-[12px] rounded-md px-2 py-[2px] whitespace-nowrap z-50">
                    {hoverLabel}
                  </div>
                )}

              {editor && linkMenu && (
                <div
                  className="gmail-link-popover absolute bg-white border rounded-md shadow-md px-3 py-2 text-xs flex items-center justify-between whitespace-nowrap z-50 space-x-4"
                  style={{
                    top:
                      linkMenu.y -
                      (editor.view.dom.getBoundingClientRect().top || 0) +
                      8,
                    left:
                      linkMenu.x -
                      (editor.view.dom.getBoundingClientRect().left || 0) +
                      170,
                    transform: "translateX(-50%)",
                    minWidth: "260px",
                  }}
                >
                  <span className="text-gray-600">Go to:</span>
                  <a
                    href={linkMenu.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline truncate max-w-[120px]"
                  >
                    {linkMenu.href}
                  </a>
                  <span className="text-gray-400">|</span>
                  <button
                    onClick={() => {
                      if (!editor || !linkMenu) return;
                      const { from, to } = editor.state.selection;
                      let linkTextValue = "";
                      editor.state.doc.nodesBetween(from, to, (node) => {
                        if (
                          node.isText &&
                          node.marks.some((m) => m.type.name === "link")
                        )
                          linkTextValue += node.text || "";
                      });
                      if (!linkTextValue.trim())
                        linkTextValue =
                          editor.state.doc.textBetween(from, to, " ") ||
                          linkMenu.href ||
                          "";
                      setLinkText(linkTextValue);
                      setLinkUrl(linkMenu.href);
                      setShowLinkPopover(true);
                      setLinkMenu(null);
                    }}
                    className="text-indigo-600 hover:text-black transition-colors"
                  >
                    Change
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    onClick={() => {
                      editor
                        ?.chain()
                        .focus()
                        .extendMarkRange("link")
                        .unsetLink()
                        .run();
                      notify("Link removed", "info");
                      setLinkMenu(null);
                    }}
                    className="text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center px-4 py-2 bg-gray-50 rounded-b-md relative">
            <div className="flex items-center gap-2">
              <div className="relative inline-block">
                <div className="flex rounded-md overflow-hidden shadow-sm">
                  <button
                    onClick={handleSend}
                    className="bg-indigo-600 text-white px-4 py-1.5 text-sm font-medium flex items-center gap-1 transition"
                  >
                    Send
                  </button>

                  <div className="w-[1px] bg-white" />

                  <button
                    onClick={() => {
                      closeAllPopovers();
                      setShowSendMenu((prev) => !prev);
                    }}
                    className="bg-indigo-600 text-white px-2 flex items-center justify-center transition-transform duration-200 send-dropdown-button"
                  >
                    <ChevronDown
                      className={`w-4 h-4 text-white transition-transform duration-200 ${
                        showSendMenu || showSchedulePopover
                          ? "rotate-180"
                          : "rotate-0"
                      }`}
                    />
                  </button>
                </div>

                {showSendMenu && (
                  <div className="absolute left-0 bottom-10 bg-white border rounded-md shadow-lg w-44 z-50 animate-fadeIn send-dropdown-menu">
                    <button
                      onClick={() => {
                        if (toList.length === 0) {
                          notify("Add at least one recipient", "error");
                          setShowSendMenu(false);
                          return;
                        }

                        setShowSendMenu(false);
                        setTimeout(() => setShowSchedulePopover(true), 50);
                      }}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        className="w-4 h-4 text-violet-600"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Schedule send
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 text-gray-600 ml-3 relative">
                <div className="relative">
                  <FormatIcon
                    className="w-5 h-5 cursor-pointer hover:text-indigo-600"
                    onMouseEnter={() => setHoverLabel("Formatting options")}
                    onMouseLeave={() => setHoverLabel(null)}
                    onClick={() => {
                      closeAllPopovers();
                      setShowFormat((v) => !v);
                    }}
                  />

                  {showFormat && (
                    <div className="absolute bottom-8 left-0 bg-white border rounded-md shadow-lg p-1 text-sm z-50 popover w-48">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() =>
                            editor?.chain().focus().toggleBold().run()
                          }
                          className={`p-1 rounded transition-colors ${
                            fmtActive.bold
                              ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          <BoldIcon className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            editor?.chain().focus().toggleItalic().run()
                          }
                          className={`p-1 rounded transition-colors ${
                            fmtActive.italic
                              ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          <ItalicIcon className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            editor?.chain().focus().toggleUnderline().run()
                          }
                          className={`p-1 rounded transition-colors ${
                            fmtActive.underline
                              ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          <UnderlineIcon className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            editor?.chain().focus().toggleBulletList().run()
                          }
                          className={`p-1 rounded transition-colors ${
                            fmtActive.bullet
                              ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          <ListBulletIcon className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            editor?.chain().focus().toggleOrderedList().run()
                          }
                          className={`p-1 rounded transition-colors ${
                            fmtActive.ordered
                              ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          <ListOrderedIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <PaperClipIcon
                  className="w-5 h-5 cursor-pointer hover:text-indigo-600 paperclip-btn"
                  onMouseEnter={() => setHoverLabel("Insert files")}
                  onMouseLeave={() => setHoverLabel(null)}
                  onClick={() => {
                    closeAllPopovers();
                    setShowFileSource((v) => !v);
                  }}
                />
                {showFileSource && (
                  <div className="absolute bottom-12 left-8 bg-white border rounded-md shadow-lg p-2 w-48 z-50 file-popover">
                    <button
                      onClick={() => {
                        attachInputRef.current?.click();
                        setShowFileSource(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      Choose from browser
                    </button>
                    <button
                      onClick={() => {
                        setShowRecordPicker(true);
                        setShowFileSource(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      Choose from record
                    </button>
                  </div>
                )}

                <LinkIcon
                  className="w-5 h-5 cursor-pointer hover:text-indigo-600"
                  onMouseEnter={() => setHoverLabel("Insert link")}
                  onMouseLeave={() => setHoverLabel(null)}
                  onClick={() => {
                    closeAllPopovers();
                    if (!editor) return;

                    const selection = editor.state.selection;
                    (editor as any).__savedSelection = selection;
                    const selectedText =
                      editor.state.doc.textBetween(
                        selection.from,
                        selection.to,
                        " "
                      ) || "";
                    const existingLink =
                      editor.getAttributes("link").href || "";
                    const typedText = selectedText.trim();

                    if (
                      typedText &&
                      (/^(https?:\/\/|www\.)/i.test(typedText) ||
                        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(typedText))
                    ) {
                      setLinkUrl(typedText);
                      setLinkText("");
                      applyLink();
                      return;
                    }

                    setLinkUrl(existingLink);
                    setLinkText(selectedText || existingLink);
                    setShowLinkPopover(true);
                    setShowEmoji(false);
                    setLinkMenu(null);
                  }}
                />

                <FaceSmileIcon
                  className="w-5 h-5 cursor-pointer hover:text-indigo-600"
                  onMouseEnter={() => setHoverLabel("Insert emojis")}
                  onMouseLeave={() => setHoverLabel(null)}
                  onClick={() => {
                    closeAllPopovers();
                    setShowEmoji((v) => !v);
                  }}
                />

                <PhotoIcon
                  className="w-5 h-5 cursor-pointer hover:text-indigo-600"
                  onMouseEnter={() => setHoverLabel("Insert photo")}
                  onMouseLeave={() => setHoverLabel(null)}
                  onClick={() => {
                    closeAllPopovers();
                    photoInputRef.current?.click();
                  }}
                />
              </div>

              {showLinkPopover && (
                <div className="absolute bottom-12 left-28 bg-white border rounded-md shadow-lg p-3 w-64 flex flex-col gap-2 z-50 popover">
                  <label className="text-xs text-gray-600">
                    Text to display
                  </label>
                  <input
                    ref={linkTextInputRef}
                    type="text"
                    placeholder="Example text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    className="border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <label className="text-xs text-gray-600 mt-1">Link URL</label>
                  <input
                    ref={linkInputRef}
                    type="text"
                    placeholder="https://example.com"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="flex justify-between mt-1">
                    <button
                      className={`text-xs px-2 py-0.5 rounded ${
                        linkText.trim() && linkUrl.trim()
                          ? "text-indigo-600 hover:underline"
                          : "text-gray-400"
                      }`}
                      disabled={!linkText.trim() || !linkUrl.trim()}
                      onClick={applyLink}
                    >
                      Apply
                    </button>

                    <button
                      className="text-xs text-gray-500 hover:text-red-500"
                      onClick={() => setShowLinkPopover(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {showEmoji && (
                <div className="absolute bottom-12 left-40 bg-white border rounded-md shadow-lg z-50 popover">
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      editor
                        ?.chain()
                        .focus()
                        .insertContent(emojiData.emoji)
                        .run();
                      setShowEmoji(false);
                    }}
                    theme={Theme.LIGHT}
                    width={300}
                    height={350}
                    searchDisabled={false}
                  />
                </div>
              )}

              <input
                ref={attachInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleAttachment(e.target.files)}
              />
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    editor
                      ?.chain()
                      .focus()
                      .setImage({
                        src: reader.result as string,
                        alt: file.name.replace(/\.[^/.]+$/, ""),
                        filename: file.name,
                      } as any)

                      .run();
                  };
                  reader.readAsDataURL(file);

                  e.target.value = "";
                }}
              />

              {showSchedulePopover && (
                <div className="absolute bottom-16 left-8 bg-white border rounded-md shadow-lg p-3 w-82 z-[999] schedule-popover animate-fadeIn">
                  <h1 className="font-medium text-[20px] mb-2 text-gray-800">
                    Schedule send
                  </h1>

                  <div className="flex flex-col text-sm">
                    {(() => {
                      const now = new Date();

                      const tomorrow = new Date(now);
                      tomorrow.setDate(now.getDate() + 1);

                      const monday = new Date(now);
                      monday.setDate(
                        now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7)
                      );

                      const formatFull = (date: Date) =>
                        date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });

                      const formatTime = (date: Date) =>
                        date.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        });

                      const tomorrowMorning = new Date(tomorrow);
                      tomorrowMorning.setHours(8, 0, 0, 0);

                      const tomorrowAfternoon = new Date(tomorrow);
                      tomorrowAfternoon.setHours(13, 0, 0, 0);

                      const mondayMorning = new Date(monday);
                      mondayMorning.setHours(8, 0, 0, 0);

                      const scheduleOptions = [
                        {
                          label: `Tomorrow morning — ${formatFull(
                            tomorrowMorning
                          )}, ${formatTime(tomorrowMorning)}`,
                          date: tomorrowMorning,
                        },
                        {
                          label: `Tomorrow afternoon — ${formatFull(
                            tomorrowAfternoon
                          )}, ${formatTime(tomorrowAfternoon)}`,
                          date: tomorrowAfternoon,
                        },
                        {
                          label: `Monday morning — ${formatFull(
                            mondayMorning
                          )}, ${formatTime(mondayMorning)}`,
                          date: mondayMorning,
                        },
                      ];

                      return scheduleOptions.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            notify(
                              `Email scheduled for ${opt.label
                                .replace("—", "")
                                .trim()}`,
                              "success"
                            );
                            setShowSchedulePopover(false);
                            resetForm();
                            onClose();
                          }}
                          className="text-left px-3 py-2 rounded hover:bg-indigo-50 text-gray-800"
                        >
                          {opt.label}
                        </button>
                      ));
                    })()}

                    <button
                      onClick={() => {
                        setShowSchedulePopover(false);
                        setShowDateTimePicker(true);
                      }}
                      className="text-left px-3 py-2 rounded hover:bg-gray-100 text-indigo-600"
                    >
                      Pick date & time
                    </button>
                  </div>

                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => setShowSchedulePopover(false)}
                      className="text-xs text-gray-500 hover:text-red-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {showDateTimePicker && (
                <div className="absolute bottom-10 left-8 bg-white border rounded-md shadow-lg p-4 w-[360px] z-[1000]">
                  <h3 className="text-sm font-medium mb-3 text-gray-800">
                    Pick date & time
                  </h3>
                  <div className="max-h-[260px] w-[360px] overflow-y-auto">
                    <ReactDatePicker
                      selected={scheduledDate}
                      onChange={(date) => setScheduledDate(date)}
                      showTimeSelect
                      minDate={new Date()}
                      dateFormat="MMMM d, yyyy h:mm aa"
                      inline
                    />
                  </div>

                  <div className="flex justify-end mt-3 gap-2">
                    <button
                      onClick={() => setShowDateTimePicker(false)}
                      className="text-xs text-gray-500 hover:text-red-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (toList.length === 0) {
                          notify("Add at least one recipient", "error");
                          return;
                        }
                        if (!scheduledDate) {
                          notify("Select a valid date & time", "error");
                          return;
                        }
                        const formatted = scheduledDate.toLocaleString(
                          "en-US",
                          {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }
                        );
                        notify(`Email scheduled for ${formatted}`, "success");
                        setShowDateTimePicker(false);
                        resetForm();
                        onClose();
                      }}
                      className="bg-indigo-600 text-white px-3 py-1.5 rounded text-xs hover:bg-indigo-700"
                    >
                      Schedule
                    </button>
                  </div>
                </div>
              )}
              {showRecordPicker && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <div className="bg-white rounded-lg shadow-lg w-[400px] p-4">
                    <h3 className="text-base font-semibold text-gray-800 mb-3">
                      Choose from Record
                    </h3>

                    {recordAttachments && recordAttachments.length > 0 ? (
                      <div className="max-h-[240px] overflow-y-auto space-y-2">
                        {recordAttachments.map((f) => (
                          <div
                            key={f.id}
                            className="flex justify-between items-center px-3 py-2 border rounded hover:bg-indigo-50"
                          >
                            <span className="text-sm text-gray-700 truncate">
                              {f.name}
                            </span>
                            <button
                              onClick={() => {
                                setAttachments((prev) => [
                                  ...prev,
                                  { name: f.name, url: f.url || "#" },
                                ]);
                                notify(`Attached ${f.name}`, "info");
                                setShowRecordPicker(false);
                              }}
                              className="text-indigo-600 text-sm hover:underline"
                            >
                              Attach
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No attachments in record.
                      </p>
                    )}

                    <div className="flex justify-end mt-3">
                      <button
                        onClick={() => setShowRecordPicker(false)}
                        className="text-sm text-gray-500 hover:text-red-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {altPopover?.show && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <div className="bg-white rounded-lg shadow-2xl p-6 w-[460px] relative">
                    <h3 className="text-base font-semibold text-gray-800 mb-3">
                      Edit Image Description
                    </h3>

                    <label className="text-xs text-gray-600 mb-1 block">
                      Description (Alt Text)
                    </label>
                    <input
                      type="text"
                      value={altPopover.currentAlt}
                      onChange={(e) =>
                        setAltPopover((prev) =>
                          prev ? { ...prev, currentAlt: e.target.value } : prev
                        )
                      }
                      className="border w-full rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none mb-4"
                      placeholder="Describe this image for accessibility"
                    />

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setAltPopover(null)}
                        className="text-sm text-gray-500 hover:text-red-500"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (!editor || !altPopover) return;
                          const { state, view } = editor;
                          const { tr, schema } = state;
                          const imgType = schema.nodes.image;
                          const current = state.doc.nodeAt(altPopover.nodePos);
                          if (!current || current.type.name !== "image") return;

                          tr.setNodeMarkup(altPopover.nodePos, imgType, {
                            ...current.attrs,
                            alt: altPopover.currentAlt,
                          });
                          view.dispatch(tr);
                          view.focus();
                          setAltPopover(null);
                          notify("Alt text updated", "success");
                        }}
                        className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm hover:bg-indigo-700"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
