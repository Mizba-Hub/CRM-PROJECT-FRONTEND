"use client";

import React, { useState, useEffect } from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import { CalendarIcon } from "@heroicons/react/24/solid";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import Button from "@/components/ui/Button";
import { Inputs } from "@/components/ui/Inputs";

import { formatDurationFromSeconds } from "@/app/lib/utils";



export type ActivityType =
  | "note"
  | "call"
  | "task"
  | "email"
  | "meeting"
  | "deal"
  | "ticket"
  | "company";

interface Activity {
  id: number;
  type: ActivityType;
  title: string;
  author: string;
  date: string;
  content?: string;
  preview?: string;
  overdue?: boolean;
  extra?: Record<string, any>;
}

interface Props {
  sectionTitle?: string;
  buttonLabel?: string;
  activities: Activity[];
  onCreate?: () => void;
}

const ActivityDetailView: React.FC<Props> = ({
  sectionTitle,
  buttonLabel,
  activities,
  onCreate,
}) => {
  const [openId, setOpenId] = useState<number | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState("");

  useEffect(() => {
    if (openId) {
      const open = activities.find((a) => a.id === openId);
      if (open?.type === "call") setSelectedOutcome(open.extra?.outcome || "");
    }
  }, [openId, activities]);

  const taskActivities = activities.filter((a) => a.type === "task");
  const nonTaskActivities = activities.filter((a) => a.type !== "task");

  const byMonth: Record<string, Activity[]> = {};
  nonTaskActivities.forEach((a) => {
    if (!a.date) return;
    const parsed = new Date(a.date.replace(" at ", " "));
    const label = isNaN(parsed.getTime())
      ? "No Date"
      : parsed.toLocaleString("default", { month: "long", year: "numeric" });
    (byMonth[label] ??= []).push(a);
  });

  function getDisplayName(email: string) {
    try {
      const leads = JSON.parse(localStorage.getItem("leads") || "[]");
      const lead = leads.find((l: any) => l.email === email);

      if (lead) {
        const fullName = `${lead.firstName || ""} ${
          lead.lastName || ""
        }`.trim();
        if (fullName.length > 0) return fullName;
      }

      return email.split("@")[0];
    } catch {
      return email.split("@")[0];
    }
  }

  const getPreviewText = (a: Activity) => {
    if (!a.content) return "";

    const plain = a.content
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim();

    if (a.type === "email") {
      const lines = plain
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      const greetingLine = lines.find((l) =>
        /^(Hi|Hello|Hey|Dear|Greetings|Good (morning|afternoon|evening))\b/i.test(
          l
        )
      );

      if (greetingLine) return greetingLine;
      const match = plain.match(/^(.*?[.!?])(\s|$)/);
      return (match ? match[1] : lines[0])?.trim() || "";
    }

    if (["note", "meeting", "call", "task"].includes(a.type)) {
      const match = plain.match(/^(.*?[.!?])(\s|$)/);
      return (match ? match[1] : plain.split(/\r?\n/)[0])?.trim() || "";
    }

    return "";
  };

  const renderActivity = (a: Activity) => {
    const isOpen = openId === a.id;
    const isEmail = a.type === "email";

    let boldPart = "";
    let subjectPart = "";
    let restPart = "";

    if (isEmail) {
      const parts = a.title.split("–");

      boldPart = (parts[0] || "").trim(); 
      subjectPart = (parts[1] || "").trim(); 
      restPart = (parts[2] || "").trim(); 
    } else {
      const words = a.title.split(" ");
      boldPart = words[0];
      restPart = words.slice(1).join(" ");
    }

    const previewText = getPreviewText(a);

    return (
      <div
        key={a.id}
        className="flex flex-col border border-gray-200 rounded-md hover:bg-gray-100 transition pb-2"
      >
        <div
          className="flex justify-between items-start px-2 pt-2 cursor-pointer flex-wrap gap-1 md:gap-2"
          onClick={() => setOpenId(isOpen ? null : a.id)}
        >
          <div className="flex-1 min-w-[250px] flex items-center gap-2 overflow-hidden">
            {isOpen ? (
              <ChevronRightIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            )}

            {isEmail ? (
              <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                <span className="font-bold text-gray-900 flex-shrink-0 whitespace-nowrap">
                  {boldPart} –
                </span>
                <span
                  className="truncate text-gray-900 font-bold min-w-0"
                  title={subjectPart}
                >
                  {subjectPart}
                </span>
                {restPart && (
                  <span className="text-gray-700 flex-shrink-0 whitespace-nowrap ml-1">
                    {restPart}
                  </span>
                )}
              </div>
            ) : a.type === "meeting" ? (
              <p className="font-bold text-gray-900 truncate" title={a.title}>
                {a.title}
              </p>
            ) : a.type === "task" ? (
              <div
                className="flex items-center min-w-0 overflow-hidden"
                title={a.title}
              >
                <span className="font-bold text-gray-900 flex-shrink-0 mr-1">
                  Task assigned to
                </span>

                <span className="truncate text-gray-800">
                  {a.extra?.assignedTo?.name || a.author}
                </span>

                <span className="truncate text-gray-800">{a.extra?.assignedTo?.name || a.author}</span>

              </div>
            ) : (
              <div
                className="flex items-center min-w-0 overflow-hidden"
                title={a.title}
              >
                <span className="font-bold text-gray-900 flex-shrink-0 mr-1">
                  {boldPart}
                </span>
                <span className="truncate text-gray-800">{restPart}</span>
              </div>
            )}
          </div>

          <div className="text-right text-sm text-gray-400 flex items-center gap-1 flex-shrink-0">
            {a.overdue && (
              <span className="flex items-center text-red-500 gap-1">
                <CalendarIcon className="w-4 h-4" /> Overdue:
              </span>
            )}
            <span className="whitespace-nowrap text-gray-600 font-medium">
              {a.date}
            </span>
          </div>
        </div>

        {!isOpen && previewText && (
          <div className="px-2 pl-[1rem] pt-0 text-sm text-gray-600 truncate">
            {a.type === "task" ? (
              <div className="flex items-center gap-2 px-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded-full border-2 border-gray-400 accent-indigo-600 appearance-none checked:bg-indigo-600 cursor-pointer"
                  checked={a.extra?.status === "completed"}
                  onChange={(e) => {
                    if (e.target.checked && a.extra?.onComplete) {
                      a.extra.onComplete();
                    }
                  }}
                />

                <span
                  className={
                    a.extra?.status === "completed"
                      ? "line-through text-gray-500"
                      : ""
                  }
                >

                <span className={a.extra?.status === "completed" ? "line-through text-gray-500" : ""}>

                  {a.extra?.taskName || "Untitled Task"}
                </span>
              </div>
            ) : a.type === "meeting" ? (
              <span className="px-3">
                {a.extra?.meetingTitle || "Untitled Meeting"}
              </span>
            ) : (
              previewText
            )}
          </div>
        )}

        {isOpen && (
          <div className="px-2 pb-1 text-sm text-gray-700">
            <div className="flex-1 min-w-[250px] space-y-2 break-words whitespace-pre-wrap overflow-visible pl-[6px]">
              {a.type === "note" && a.content && (
                <div
                  className="prose prose-sm max-w-none text-gray-800 leading-tight break-words whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: a.content }}
                />
              )}

              {a.type === "email" && (
                <>
                  {a.preview && (
                    <p className="text-base font-bold text-gray-800 mb-1 break-words whitespace-pre-wrap">
                      {a.preview}
                    </p>
                  )}
                  <div>
                    <p className="text-m text-gray-500 mb-1">
                      To{" "}
                      {Array.isArray(a.extra?.recipients)
                        ? getDisplayName(a.extra.recipients[0])
                        : a.author}
                    </p>
                    {a.content && (
                      <div
                        className="prose prose-sm max-w-none text-gray-800 leading-snug break-words whitespace-pre-wrap overflow-visible pl-[1.2rem]"
                        dangerouslySetInnerHTML={{ __html: a.content }}
                      />
                    )}
                  </div>
                </>
              )}

              {a.type === "task" && (
                <>
                  <div className="flex items-center gap-2 mt-0 px-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded-full border-2 border-gray-400 accent-indigo-600 appearance-none checked:bg-indigo-600 cursor-pointer"
                      checked={a.extra?.status === "completed"}
                      onChange={(e) => {
                        if (e.target.checked && a.extra?.onComplete) {
                          a.extra.onComplete();
                        }
                      }}
                    />

                    <span
                      className={
                        a.extra?.status === "completed"
                          ? "line-through text-gray-500"
                          : ""
                      }
                    >

                    <span className={a.extra?.status === "completed" ? "line-through text-gray-500" : ""}>

                      {a.extra?.taskName}
                    </span>
                  </div>
                  <div className="grid grid-cols-[1.7fr_1fr_1fr] gap-4 bg-gray-200 p-3 rounded mb-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Due Date & Time
                      </p>
                      <p className="text-black font-medium">{a.date}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Priority
                      </p>
                      <p className="text-black font-medium">
                        {a.extra?.priority || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Type</p>
                      <p className="text-black font-medium">
                        {a.extra?.taskType || "-"}
                      </p>
                    </div>
                  </div>
                  {a.content && (
                    <span
                      dangerouslySetInnerHTML={{ __html: a.content }}

                      className={
                        a.extra?.status === "completed"
                          ? "line-through text-gray-500"
                          : ""
                      }

                      className={a.extra?.status === "completed" ? "line-through text-gray-500" : ""}

                    ></span>
                  )}
                </>
              )}

              {a.type === "call" && (
                <div className="space-y-2">
                  {a.content && (
                    <div
                      className="mb-1 whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: a.content }}
                    />
                  )}
                  <div className="flex flex-col sm:flex-row gap-1">
                    <div className="sm:w-1/2">
                      <Inputs
                        variant="input"
                        type="text"
                        name="outcome"
                        label={
                          <>
                            Outcome <span className="text-red-500">*</span>
                          </>
                        }
                        value={a.extra?.outcome || ""}
                        disabled
                        className="text-gray-700"
                      />
                    </div>
                    <div className="relative">
                      <Inputs
                        variant="input"
                        type="text"
                        name="duration"
                        label={
                          <>
                            Duration <span className="text-red-500">*</span>
                          </>
                        }
                        value={

                          a.extra?.duration !== null &&
                          a.extra?.duration !== undefined

                          a.extra?.duration !== null && a.extra?.duration !== undefined

                            ? formatDurationFromSeconds(
                                typeof a.extra.duration === "number"
                                  ? a.extra.duration
                                  : parseInt(String(a.extra.duration), 10) || 0
                              )
                            : "-"
                        }
                        disabled
                        className="text-gray-700 bg-gray-100 pr-9"
                      />
                      <ClockIcon className="w-4 h-4 text-gray-500 absolute right-3 top-[70%] -translate-y-1/2 pointer-events-none transition-colors duration-150" />
                    </div>
                  </div>
                </div>
              )}

              {a.type === "meeting" && (
                <div>
                  <p className="text-s text-gray-500 mb-1">
                    Organized by {a.extra?.organizer || a.author}
                  </p>
                  <div className="grid grid-cols-[1.7fr_1fr_1fr] gap-4 bg-gray-200 p-3 rounded mb-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Date & Time
                      </p>
                      <p className="text-black font-medium">{a.date}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Duration
                      </p>
                      <p className="text-black font-medium">
                        {a.extra?.duration || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Attendees
                      </p>
                      <p className="text-black font-medium">
                        {a.extra?.attendees || "-"}
                      </p>
                    </div>
                  </div>
                  {a.extra?.meetingTitle && (
                    <p className="text-gray-700 mb-2">{a.extra.meetingTitle}</p>
                  )}
                  {a.content && (
                    <div
                      className="text-gray-700 break-words whitespace-pre-wrap leading-tight"
                      dangerouslySetInnerHTML={{ __html: a.content }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {(sectionTitle || buttonLabel) && (
        <div className="flex justify-between items-center mb-2 flex-wrap gap-1">
          {sectionTitle && (
            <h2 className="text-base font-semibold text-gray-600">
              {sectionTitle}
            </h2>
          )}
          {buttonLabel && (
            <Button label={buttonLabel} variant="primary" onClick={onCreate} />
          )}
        </div>
      )}

      {taskActivities.length > 0 && (
        <div className="space-y-2 mb-3 mt-3">
          {taskActivities.map(renderActivity)}
        </div>
      )}

      {Object.keys(byMonth).map((m, i) => (
        <div key={m} className={`${i === 0 ? "" : "mt-3"} space-y-2`}>
          <p className="text-sm font-semibold text-gray-600">{m}</p>
          {byMonth[m].map(renderActivity)}
        </div>
      ))}

      {activities.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-3">
          No activities to show.
        </p>
      )}
    </div>
  );
};

export default ActivityDetailView;