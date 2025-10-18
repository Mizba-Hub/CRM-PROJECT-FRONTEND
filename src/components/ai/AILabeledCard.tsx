import React from "react";
import { RobotIcon } from "./RobotIcon";
import clsx from "clsx";

export type AILabeledCardProps = {
  title: string;
  description: string;
  className?: string;
  icon?: React.ReactNode;

  quoted?: string;
};

export function AILabeledCard({
  title,
  description,
  className,
  icon,
  quoted,
}: AILabeledCardProps) {
  return (
    <div
      className={clsx(
        "w-[280px] space-y-4",

        "bg-gray-100 border border-indigo-700 rounded-md shadow-sm p-4",
        className
      )}
      role="region"
      aria-label={title}
    >
      <h3 className="text-md font-semibold text-indigo-700 mb-2 flex items-center gap-2">
        {icon ?? <RobotIcon className="h-4 w-4 text-indigo-700" />}
        <span>
          {title}
          {quoted ? (
            <>
              {" "}
              <span className="text-indigo-700">“{quoted}”</span>
            </>
          ) : null}
        </span>
      </h3>
      <p className="text-md text-black mb-1">{description}</p>
    </div>
  );
}
