import React from "react";
import { AILabeledCard, AILabeledCardProps } from "./AILabeledCard";

type EntityType = "lead" | "deal" | "company" | "ticket";

export type AISummaryCardProps = {
  type: EntityType;

  subjectTitle?: string;

  message?: string;
  className?: string;
} & Omit<AILabeledCardProps, "title" | "description" | "quoted">;

const TITLES: Record<EntityType, string> = {
  lead: "AI Lead Summary",
  deal: "AI Deal Summary",
  company: "AI Company Summary",
  ticket: "AI Ticket Summary",
};

const DEFAULT_MESSAGE =
  "There are no activities associated with this lead and further details are needed to provide a comprehensive summary.";

const DEFAULT_TICKET_MESSAGE =
  "This ticket currently has no associated conversation, call, or note transcripts. There are no additional details or properties available for this ticket at this time.";

export function AISummaryCard({
  type,
  subjectTitle,
  message,
  className,
  ...rest
}: AISummaryCardProps) {
  const title = TITLES[type];

  const description =
    message ?? (type === "ticket" ? DEFAULT_TICKET_MESSAGE : DEFAULT_MESSAGE);

  return (
    <AILabeledCard
      title={title}
      description={description}
      quoted={type === "ticket" ? subjectTitle : undefined}
      className={className}
      {...rest}
    />
  );
}
