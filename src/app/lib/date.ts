export const formatNoteDate = (date: Date): string => {
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
  