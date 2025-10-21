export function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
export const calculateDuration = (start: string, end: string): string => {
  if (!start || !end) return "-";

  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  let diff = eh * 60 + em - (sh * 60 + sm);

  
  if (diff < 0) diff += 24 * 60;

  if (diff === 0) return "0 mins";

  const hrs = Math.floor(diff / 60);
  const mins = diff % 60;

  if (hrs === 0) return `${mins} mins`;
  if (mins === 0) return `${hrs} hr${hrs > 1 ? "s" : ""}`;
  return `${hrs} hr${hrs > 1 ? "s" : ""} ${mins} mins`;
};


export const getAttendeeCount = (attendees: string[]): number =>
  Array.isArray(attendees) ? attendees.length : 0;
