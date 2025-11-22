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

export const calculateTotalCount = (
  organizers: string[] = [],
  attendees: string[] = []
): number => {
  const uniqueIds = new Set();

  organizers.forEach((org) => uniqueIds.add(org));

  attendees.forEach((attendee) => uniqueIds.add(attendee));

  uniqueIds.add("linkedModule");

  return uniqueIds.size;
};

export function getEntityEmail(
  entityType: string,
  entityId: string
): string | null {
  try {
    const type = entityType.toLowerCase();
    const id = String(entityId);

    const leads = JSON.parse(localStorage.getItem("leads") || "[]");
    const deals = JSON.parse(localStorage.getItem("deals") || "[]");
    const companies = JSON.parse(localStorage.getItem("companies") || "[]");
    const tickets = JSON.parse(localStorage.getItem("tickets") || "[]");

    const findLeadEmailById = (leadId: string) => {
      const lead = leads.find((l: any) => String(l.id) === String(leadId));
      return lead?.email || null;
    };

    if (type === "lead") {
      return findLeadEmailById(id);
    }

    if (type === "deal") {
      const deal = deals.find((d: any) => String(d.id) === id);
      if (deal?.associatedLead) return findLeadEmailById(deal.associatedLead);
      return null;
    }

    if (type === "company") {
      const company = companies.find((c: any) => String(c.id) === id);
      if (company?.associatedLead)
        return findLeadEmailById(company.associatedLead);
      return null;
    }

    if (type === "ticket") {
      const ticket = tickets.find((t: any) => String(t.id) === id);
      if (!ticket) return null;

      if (ticket.company?.id || ticket.companyName) {
        const companyId = ticket.company?.id || ticket.companyId;
        const companyName = ticket.company?.name || ticket.companyName;

        const company = companyId
          ? companies.find((c: any) => String(c.id) === String(companyId))
          : companies.find((c: any) => c.companyName === companyName);

        if (company?.associatedLead) {
          return findLeadEmailById(String(company.associatedLead));
        }

        return null;
      }

      if (ticket.deal?.id || ticket.dealName) {
        const dealId = ticket.deal?.id || ticket.dealId;
        const dealName = ticket.deal?.name || ticket.dealName;

        const deal = dealId
          ? deals.find((d: any) => String(d.id) === String(dealId))
          : deals.find((d: any) => (d.dealName || d.name) === dealName);

        if (deal?.associatedLead) {
          return findLeadEmailById(String(deal.associatedLead));
        }
        return null;
      }

      if (ticket.associatedLeadId) {
        return findLeadEmailById(String(ticket.associatedLeadId));
      }

      if (ticket.associatedDeal) {
        const deal = deals.find(
          (d: any) => String(d.id) === String(ticket.associatedDeal)
        );
        if (deal?.associatedLead)
          return findLeadEmailById(String(deal.associatedLead));
      }

      return null;
    }

    return null;
  } catch (error) {
    console.error("❌ Error fetching entity email:", error);
    return null;
  }
}

export const formatDurationFromSeconds = (
  seconds: number | null | undefined
): string => {
  if (seconds === null || seconds === undefined || seconds === 0) return "-";

  const secs =
    typeof seconds === "number" ? seconds : parseInt(String(seconds), 10) || 0;
  if (secs === 0) return "-";

  const totalMinutes = Math.floor(secs / 60);
  const remainingSeconds = secs % 60;

  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hrs === 0 && mins === 0) {
    return `${remainingSeconds} sec${remainingSeconds !== 1 ? "s" : ""}`;
  }

  if (hrs === 0) {
    const minsStr = `${mins} min${mins !== 1 ? "s" : ""}`;
    const secsStr =
      remainingSeconds > 0
        ? ` ${remainingSeconds} sec${remainingSeconds !== 1 ? "s" : ""}`
        : "";
    return `${minsStr}${secsStr}`;
  }

  if (mins === 0) {
    const hrsStr = `${hrs} hr${hrs !== 1 ? "s" : ""}`;
    const secsStr =
      remainingSeconds > 0
        ? ` ${remainingSeconds} sec${remainingSeconds !== 1 ? "s" : ""}`
        : "";
    return `${hrsStr}${secsStr}`;
  }

  const hrsStr = `${hrs} hr${hrs !== 1 ? "s" : ""}`;
  const minsStr = `${mins} min${mins !== 1 ? "s" : ""}`;
  const secsStr =
    remainingSeconds > 0
      ? ` ${remainingSeconds} sec${remainingSeconds !== 1 ? "s" : ""}`
      : "";
  return `${hrsStr} ${minsStr}${secsStr}`;
};

export function getEntityLeadName(
  entityType: string,
  entityId: string
): string | null {
  try {
    const type = entityType.toLowerCase();
    const id = String(entityId);

    const leads = JSON.parse(localStorage.getItem("leads") || "[]");
    const deals = JSON.parse(localStorage.getItem("deals") || "[]");
    const companies = JSON.parse(localStorage.getItem("companies") || "[]");
    const tickets = JSON.parse(localStorage.getItem("tickets") || "[]");

    const findLeadNameById = (leadId: string) => {
      const lead = leads.find((l: any) => String(l.id) === String(leadId));
      if (lead) {
        const firstName = lead.firstName || "";
        const lastName = lead.lastName || "";
        const fullName = `${firstName} ${lastName}`.trim();
        return fullName.length > 0 ? fullName : null;
      }
      return null;
    };

    if (type === "lead") {
      return findLeadNameById(id);
    }

    if (type === "deal") {
      const deal = deals.find((d: any) => String(d.id) === id);
      if (deal?.associatedLead)
        return findLeadNameById(String(deal.associatedLead));
      return null;
    }

    if (type === "company") {
      const company = companies.find((c: any) => String(c.id) === id);
      if (company?.associatedLead)
        return findLeadNameById(String(company.associatedLead));
      return null;
    }

    if (type === "ticket") {
      const ticket = tickets.find((t: any) => String(t.id) === id);
      if (!ticket) return null;

      if (ticket.company?.id || ticket.companyName) {
        const companyId = ticket.company?.id || ticket.companyId;
        const companyName = ticket.company?.name || ticket.companyName;

        const company = companyId
          ? companies.find((c: any) => String(c.id) === String(companyId))
          : companies.find((c: any) => c.companyName === companyName);

        if (company?.associatedLead) {
          return findLeadNameById(String(company.associatedLead));
        }

        return null;
      }

      if (ticket.deal?.id || ticket.dealName) {
        const dealId = ticket.deal?.id || ticket.dealId;
        const dealName = ticket.deal?.name || ticket.dealName;

        const deal = dealId
          ? deals.find((d: any) => String(d.id) === String(dealId))
          : deals.find((d: any) => (d.dealName || d.name) === dealName);

        if (deal?.associatedLead) {
          return findLeadNameById(String(deal.associatedLead));
        }
        return null;
      }

      if (ticket.associatedLeadId) {
        return findLeadNameById(String(ticket.associatedLeadId));
      }

      if (ticket.associatedDeal) {
        const deal = deals.find(
          (d: any) => String(d.id) === String(ticket.associatedDeal)
        );
        if (deal?.associatedLead)
          return findLeadNameById(String(deal.associatedLead));
      }

      return null;
    }

    return null;
  } catch (error) {
    console.error("❌ Error fetching entity lead name:", error);
    return null;
  }
}
