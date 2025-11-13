"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  PhotoIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { ListOrdered as ListOrderedIcon } from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";

type BlockType = "p" | "h1" | "h2" | "h3";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const ExtendedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      src: { default: null },
      alt: { default: null },
      filename: { default: null },
      style: {
        default: null,
        parseHTML: (el) => el.getAttribute("style"),
        renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
      },
    };
  },
});

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter",
  className = "",
}: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [blockType, setBlockType] = useState<BlockType>("p");
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [imageMenu, setImageMenu] = useState<{
    x: number;
    y: number;
    nodePos: number;
    attrs: { src?: string; alt?: string; filename?: string };
  } | null>(null);

  const [altPopover, setAltPopover] = useState<{
    show: boolean;
    currentAlt: string;
    nodePos: number;
  } | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      ExtendedImage.configure({ allowBase64: true }),
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[120px] px-3 py-2 text-gray-900 focus:outline-none",
        dir: "ltr",
        style: "direction: ltr; text-align: left;",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const lvl = editor.getAttributes("heading").level;
      setBlockType(
        lvl === 1 ? "h1" : lvl === 2 ? "h2" : lvl === 3 ? "h3" : "p"
      );
    },
  });

  const applyFormat = (cmd: string, value?: BlockType) => {
    if (!editor) return;
    const c = editor.chain().focus();

    switch (cmd) {
      case "bold":
        c.toggleBold().run();
        break;
      case "italic":
        c.toggleItalic().run();
        break;
      case "underline":
        c.toggleUnderline().run();
        break;
      case "bullet":
        c.toggleBulletList().run();
        break;
      case "ordered":
        c.toggleOrderedList().run();
        break;
      case "header": {
        if (!value || value === "p") {
          c.setParagraph().run();
          setBlockType("p");
        } else {
          const level: 1 | 2 | 3 = value === "h1" ? 1 : value === "h2" ? 2 : 3;
          c.toggleHeading({ level }).run();
          setBlockType(value);
        }
        break;
      }
    }
  };

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "<p></p>");
    }
  }, [value, editor]);

  const isEmpty = !value || value.replace(/<[^>]*>/g, "").trim().length === 0;

  useEffect(() => {
    if (!editor) return;

    const handleImageClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      if (target.closest(".image-popover")) return;

      if (target.tagName === "IMG" && target.closest(".ProseMirror")) {
        event.preventDefault();

        const rect = target.getBoundingClientRect();
        const doc = editor.state.doc;
        const pos = editor.view.posAtDOM(target, 0);
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
          attrs: imageNode.attrs as any,
        });
      } else {
        setImageMenu(null);
      }
    };

    document.addEventListener("mousedown", handleImageClick, true);
    return () =>
      document.removeEventListener("mousedown", handleImageClick, true);
  }, [editor]);

  return (
    <div
      className={`rounded-md transition-all duration-150 ${
        isFocused
          ? "border border-blue-500 ring-2 ring-blue-500"
          : "border border-gray-300"
      } bg-white ${className}`}
    >
      <div className="flex items-center gap-0 border-b border-gray-200 px-2 py-1 bg-white rounded-t-md">
        <div className="relative inline-block text-left mr-2" ref={menuRef}>
          <button
            onClick={() => setShowMenu((p) => !p)}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-white hover:bg-gray-50"
          >
            <span
              className={
                blockType === "h1"
                  ? "text-lg font-bold text-gray-900"
                  : blockType === "h2"
                  ? "text-base font-semibold text-gray-800"
                  : blockType === "h3"
                  ? "text-sm font-semibold text-gray-700"
                  : "text-sm text-gray-700"
              }
            >
              {blockType === "p"
                ? "Normal text"
                : blockType === "h1"
                ? "Heading 1"
                : blockType === "h2"
                ? "Heading 2"
                : "Heading 3"}
            </span>
            <ChevronDownIcon className="w-3 h-3 text-gray-600" />
          </button>

          {showMenu && (
            <div className="absolute mt-1 bg-white shadow rounded border w-36 z-10">
              {["p", "h1", "h2", "h3"].map((t) => (
                <div
                  key={t}
                  onClick={() => {
                    applyFormat("header", t as BlockType);
                    setBlockType(t as BlockType);
                    setShowMenu(false);
                  }}
                  className={`px-3 py-1 cursor-pointer hover:bg-gray-100 ${
                    t === "h1"
                      ? "text-lg font-bold text-gray-900"
                      : t === "h2"
                      ? "text-base font-semibold text-gray-800"
                      : t === "h3"
                      ? "text-sm font-semibold text-gray-700"
                      : "text-sm text-gray-700"
                  }`}
                >
                  {t === "p"
                    ? "Normal text"
                    : t === "h1"
                    ? "Heading 1"
                    : t === "h2"
                    ? "Heading 2"
                    : "Heading 3"}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          className={`p-2 rounded transition-colors ${
            editor?.isActive("bold")
              ? "bg-blue-100 text-blue-600"
              : "hover:bg-gray-200 text-gray-600"
          }`}
          onClick={() => applyFormat("bold")}
          title="Bold (⌘B)"
        >
          <BoldIcon className="w-4 h-4" />
        </button>

        <button
          className={`p-2 rounded transition-colors ${
            editor?.isActive("italic")
              ? "bg-blue-100 text-blue-600"
              : "hover:bg-gray-200 text-gray-600"
          }`}
          onClick={() => applyFormat("italic")}
          title="Italic (⌘I)"
        >
          <ItalicIcon className="w-4 h-4" />
        </button>

        <button
          className={`p-2 rounded transition-colors ${
            editor?.isActive("underline")
              ? "bg-blue-100 text-blue-600"
              : "hover:bg-gray-200 text-gray-600"
          }`}
          onClick={() => applyFormat("underline")}
          title="Underline (⌘U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <button
          className={`p-2 rounded transition-colors ${
            editor?.isActive("bulletList")
              ? "bg-blue-100 text-blue-600"
              : "hover:bg-gray-200 text-gray-600"
          }`}
          onClick={() => applyFormat("bullet")}
          title="Bullet List"
        >
          <ListBulletIcon className="w-4 h-4" />
        </button>

        <button
          className={`p-2 rounded transition-colors ${
            editor?.isActive("orderedList")
              ? "bg-blue-100 text-blue-600"
              : "hover:bg-gray-200 text-gray-600"
          }`}
          onClick={() => applyFormat("ordered")}
          title="Numbered List"
        >
          <ListOrderedIcon className="w-4 h-4" />
        </button>

        <label
          className="p-2 hover:bg-gray-200 rounded cursor-pointer text-gray-600"
          title="Insert Image"
        >
          <PhotoIcon className="w-4 h-4" />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file || !editor) return;

              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                editor
                  .chain()
                  .focus()
                  .setImage({
                    src: result,
                    alt: file.name.replace(/\.[^/.]+$/, ""),
                    filename: file.name,
                  } as any)
                  .run();
              };
              reader.readAsDataURL(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <div className="relative">
        {isEmpty && !isFocused && (
          <div className="absolute left-3 top-2 text-gray-400 text-sm pointer-events-none">
            {placeholder}
          </div>
        )}
        {editor && (
          <EditorContent
            editor={editor}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        )}

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

              const currentNode = editor.state.doc.nodeAt(imageMenu.nodePos);
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
    </div>
  );
}
