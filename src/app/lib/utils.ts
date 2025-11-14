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


export const getAttendeeCount = (attendees: string[], ownerCount: number = 1): number => {
  const attendeeCount = Array.isArray(attendees) ? attendees.length : 0;
  
  return attendeeCount + ownerCount;
};


export function getEntityEmail(entityType: string, entityId: string): string | null {
  try {
    const type = entityType.toLowerCase();
    const id = String(entityId);

    
    const leads = JSON.parse(localStorage.getItem("leads") || "[]");
    const deals = JSON.parse(localStorage.getItem("deals") || "[]");
    const companies = JSON.parse(localStorage.getItem("companies") || "[]");
    const tickets = JSON.parse(localStorage.getItem("tickets") || "[]");

    const findLeadEmail = (leadId: string) => {
      const lead = leads.find((l: any) => String(l.id) === String(leadId));
      return lead?.email || null;
    };

    
    if (type === "lead") {
      const lead = leads.find((l: any) => String(l.id) === id);
      return lead?.email || null;
    }

    
    if (type === "deal") {
      const deal = deals.find((d: any) => String(d.id) === id);
      if (deal?.associatedLead) return findLeadEmail(deal.associatedLead);
      return null;
    }

    
    if (type === "company") {
      const company = companies.find((c: any) => String(c.id) === id);
      if (company?.associatedDeal) {
        const deal = deals.find(
          (d: any) => String(d.id) === String(company.associatedDeal)
        );
        if (deal?.associatedLead) return findLeadEmail(deal.associatedLead);
      }
      return null;
    }

   
    if (type === "ticket") {
      const ticket = tickets.find((t: any) => String(t.id) === id);
      if (ticket?.associatedDeal) {
        const deal = deals.find(
          (d: any) => String(d.id) === String(ticket.associatedDeal)
        );
        if (deal?.associatedLead) return findLeadEmail(deal.associatedLead);
      }
      return null;
    }

    return null;
  } catch (error) {
    console.error("❌ Error fetching entity email:", error);
    return null;
  }
}
