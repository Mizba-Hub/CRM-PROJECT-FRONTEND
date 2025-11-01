"use client";

import React, { useState, useEffect } from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import { CalendarIcon } from "@heroicons/react/24/solid";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import Button from "@/components/ui/Button";
import { Inputs } from "@/components/ui/Inputs";

type ActivityType = "note" | "call" | "task" | "email" | "meeting";

interface Activity {
  id: number;
  type: ActivityType;
  title: string;
  author: string;
  date: string;
  content?: string;
  preview?: string;
  overdue?: boolean;
  extra?: {
    priority?: string;
    taskType?: string;
    details?: string;
    outcome?: string;
    duration?: string;
    attendees?: number | string[] | [] | string;
    [key: string]: any;
  };
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
  const [selectedDuration, setSelectedDuration] = useState("");

  useEffect(() => {
    if (openId) {
      const openActivity = activities.find((a) => a.id === openId);
      if (openActivity?.type === "call") {
        setSelectedOutcome(openActivity.extra?.outcome || "");
      }
    }
  }, [openId, activities]);

  const activitiesByMonth: Record<string, Activity[]> = {};
  activities.forEach((a) => {
    if (a.date) {
      let monthYear = "No Date";
      const cleaned = a.date.replace(" at ", " ");
      const parsed = new Date(cleaned);
      if (!isNaN(parsed.getTime())) {
        monthYear = parsed.toLocaleString("default", {
          month: "long",
          year: "numeric",
        });
      } else {
        const parts = a.date.match(/\b([A-Za-z]+)\b.*(\d{4})/);
        if (parts) monthYear = `${parts[1]} ${parts[2]}`;
      }
      if (!activitiesByMonth[monthYear]) activitiesByMonth[monthYear] = [];
      activitiesByMonth[monthYear].push(a);
    }
  });

  const renderActivity = (a: Activity) => {
    const isOpen = openId === a.id;
    const isEmail = a.type === "email";

    let boldPart = "";
    let subjectPart = "";
    let restPart = "";

    if (isEmail) {
      const parts = a.title.split("–");
      boldPart = parts[0]?.trim() || "";
      if (parts[1]) {
        const afterDash = parts[1].split("by");
        subjectPart = afterDash[0]?.trim() || "";
        restPart = `by ${afterDash[1]?.trim() || ""}`;
      }
    } else {
      const words = a.title.split(" ");
      boldPart = words[0];
      restPart = words.slice(1).join(" ");
    }

    return (
      <div
        key={a.id}
        className="flex flex-col border border-gray-200 rounded-md hover:bg-gray-50 transition"
      >
        <div
          className="flex justify-between items-start p-3 cursor-pointer"
          onClick={() => setOpenId(isOpen ? null : a.id)}
        >
          <div className="flex-1">
            <p className="text-black flex items-center gap-2">
              {isOpen ? (
                <ChevronDownIcon className="w-4 h-4 text-indigo-600" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-indigo-600" />
              )}
              <span className="font-bold">{boldPart}</span>

              {isEmail && subjectPart ? (
                <>
                  <span className="font-bold text-gray-800 truncate">
                    {" "}
                    – {subjectPart}
                  </span>
                  {restPart && (
                    <span className="truncate text-gray-600">{` ${restPart}`}</span>
                  )}
                </>
              ) : (
                restPart && <span className="truncate">{` ${restPart}`}</span>
              )}
            </p>

            {!isOpen && (
              <>
                {isEmail && a.preview && (
                  <p className="text-sm text-gray-800 mt-1 ml-[1.1rem] truncate font-bold">
                    {a.preview}
                  </p>
                )}
                {a.type === "task" ? (
                  <div className="flex items-center gap-2 mt-1 ml-[1.1rem]">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded-full border-2 border-gray-400 accent-indigo-600 appearance-none checked:bg-indigo-600 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600 truncate">
                      {a.content}
                    </span>
                  </div>
                ) : (
                  a.content &&
                  a.type !== "email" && (
                    <p className="text-sm text-gray-500 mt-1 ml-[1.1rem] truncate">
                      {a.content}
                    </p>
                  )
                )}
              </>
            )}
          </div>

          <div className="text-right text-sm text-gray-400 flex items-center gap-1">
            {a.overdue && (
              <span className="flex items-center text-red-500 gap-1">
                <CalendarIcon className="w-4 h-4" /> Overdue:
              </span>
            )}
            <span>{a.date}</span>
          </div>
        </div>

        {isOpen && (
          <div className="px-4 pb-4 text-sm text-gray-700 space-y-3">
            {a.type === "task" && (
              <>
                <div className="flex items-center gap-2 mt-1 ml-[1.1rem]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-full border-2 border-gray-400 accent-indigo-600 appearance-none checked:bg-indigo-600 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">{a.content}</span>
                </div>
                <div className="grid grid-cols-[1.7fr_1fr_1fr] gap-4 bg-gray-50 p-3 rounded mt-3">
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
                {a.extra?.details && (
                  <p className="text-gray-700 mt-2">{a.extra.details}</p>
                )}
              </>
            )}

            {a.type === "note" && a.content && (
              <div
                className="text-gray-700 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: a.content }}
              />
            )}

            {isEmail && (
              <>
                {a.preview && (
                  <p className="text-base font-bold text-gray-800">
                    {a.preview}
                  </p>
                )}
                {a.content && (
                  <p className="text-gray-700 whitespace-pre-line">
                    {a.content}
                  </p>
                )}
              </>
            )}

            {a.type === "call" && (
              <div>
                {a.content && (
                  <p className="mb-3 whitespace-pre-line">{a.content}</p>
                )}

                <div className="flex gap-6">
                  <div className="w-64">
                    <Inputs
                      variant="select"
                      name="outcome"
                      label={
                        <>
                          Outcome <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="Choose"
                      value={selectedOutcome}
                      onChange={(e) => setSelectedOutcome(e.target.value)}
                      options={[
                        { label: "Successful", value: "successful" },
                        { label: "Unsuccessful", value: "unsuccessful" },
                      ]}
                    />
                  </div>

                  <div className="relative w-40">
                    <Inputs
                      variant="select"
                      name="duration"
                      label={
                        <>
                          Duration <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="Choose"
                      value={selectedDuration}
                      onChange={(e) => setSelectedDuration(e.target.value)}
                      options={[
                        { label: "5 mins", value: "5" },
                        { label: "15 mins", value: "15" },
                        { label: "30 mins", value: "30" },
                        { label: "1 hr", value: "60" },
                      ]}
                      showChevron={false}
                      className="appearance-none pr-9 pl-3 text-sm text-gray-700 border border-gray-300 rounded h-[36px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <ClockIcon className="w-4 h-4 text-gray-500 absolute right-3 top-[70%] -translate-y-1/2 pointer-events-none transition-colors duration-150" />
                  </div>
                </div>
              </div>
            )}

            {a.type === "meeting" && (
              <div>
                <p className="text-xs text-gray-500 mb-2">
                  Organized by {a.extra?.organizer || a.author}
                </p>
                <div className="grid grid-cols-[1.7fr_1fr_1fr] gap-4 bg-gray-50 p-3 rounded mb-3">
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
                {a.content && <p className="text-gray-700">{a.content}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {(sectionTitle || buttonLabel) && (
        <div className="flex justify-between items-center mb-3">
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

      {Object.keys(activitiesByMonth).map((month, idx) => (
        <div key={month} className={`${idx === 0 ? "" : "mt-4"} space-y-3`}>
          <p className="text-sm font-semibold text-gray-600">{month}</p>
          {activitiesByMonth[month].map(renderActivity)}
        </div>
      ))}

      {activities.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          No activities to show.
        </p>
      )}
    </div>
  );
};

export default ActivityDetailView;
