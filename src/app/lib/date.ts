export const formatActivityDate = (date: Date): string => {
  const optionsDate: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  };
  const optionsTime: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  const datePart = new Intl.DateTimeFormat("en-US", optionsDate).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", optionsTime).format(date);

  return `${datePart} at ${timePart}`;
};

export const formatDisplayDate = (isoString: string): string => {
  if (!isoString) return "-";
  const date = new Date(isoString);

  const month = date.toLocaleString("en-US", { month: "short" }); // Apr
  const day = String(date.getDate()).padStart(2, "0"); // 08
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  const offsetMinutes = date.getTimezoneOffset();
  const absOffset = Math.abs(offsetMinutes);
  const sign = offsetMinutes > 0 ? "-" : "+";
  const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, "0");
  const offsetMins = String(absOffset % 60).padStart(2, "0");
  const timezone = `GMT${sign}${offsetHours}:${offsetMins}`;

  return `${month} ${day}, ${year} ${hours}:${minutes} ${ampm} ${timezone}`;
};

export const formatDisplayDateOnly = (isoString: string): string => {
  if (!isoString) return "-";
  const date = new Date(isoString);

  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
};

export const formatDisplayDateTime = (isoString: string): string => {
  if (!isoString) return "-";
  const date = new Date(isoString);

  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`;
};
