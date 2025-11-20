import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface Ticket {
  id: number;
  TicketName: string;
  name?: string;
  description: string;
  status: string;
  priority: string;
  source: string;
  owners: Array<{ id: number; name: string }>;
  owner?: string | string[];
  deal?: {
    id: number;
    name: string | null;
    phoneNumber: string | null;
    city: string | null;
  } | null;
  dealName?: string;
  company?: {
    id: number;
    name: string | null;
    phoneNumber: string | null;
    city: string | null;
  } | null;
  companyName?: string;
  createdAt: string;
  createdDate?: string;
  associatedLeadId?: number;
}

export interface TicketFilters {
  status?: string;
  search?: string;
  owner?: string;
  priority?: string;
  source?: string;
  date?: string;
  page?: number;
  size?: number;
}

type TicketsState = {
  tickets: Ticket[];
  currentTicket: Ticket | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  filters: TicketFilters;
};

const initialState: TicketsState = {
  tickets: [],
  currentTicket: null,
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  filters: {},
};

const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;

  const token =
    localStorage.getItem("token") || localStorage.getItem("auth_token");

  if (token && !token.startsWith("Bearer ")) {
    return token;
  }
  return token;
};

const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
  }

  return headers;
};

const normalizeTicket = (ticket: any): Ticket => {
  const ownerNames = ticket.owners?.map((o: any) => o.name) || [];
  return {
    id: ticket.id,
    TicketName: ticket.TicketName,
    name: ticket.TicketName,
    description: ticket.description || "",
    status: ticket.status || ticket.TicketStatus || "New",
    priority: ticket.priority || "",
    source: ticket.source || "",
    owners: ticket.owners || [],
    owner: ownerNames.length > 0 ? ownerNames : "",
    deal: ticket.deal || null,
    dealName: ticket.deal?.name || null,
    company: ticket.company || null,
    companyName: ticket.company?.name || null,
    createdAt:
      ticket.createdAt || ticket.createdDate || new Date().toISOString(),
    createdDate:
      ticket.createdAt || ticket.createdDate || new Date().toISOString(),
    associatedLeadId: ticket.deal?.associatedLeadId || null,
  };
};

export const fetchTickets = createAsyncThunk(
  "tickets/fetchTickets",
  async (filters: TicketFilters = {}, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("No authentication token found");
        return rejectWithValue("No authentication token found");
      }

      if (!BASE_URL) {
        console.error(
          "BASE_URL is not defined. Please set NEXT_PUBLIC_API_BASE_URL in your .env file"
        );
        return rejectWithValue("API base URL is not configured");
      }

      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);
      if (filters.owner) params.append("owner", filters.owner);
      if (filters.priority) params.append("priority", filters.priority);
      if (filters.source) params.append("source", filters.source);
      if (filters.date) params.append("date", filters.date);
      if (filters.page) params.append("page", String(filters.page));
      if (filters.size) params.append("size", String(filters.size));

      const url = `${BASE_URL}/api/v1/tickets${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      console.log("Fetching tickets from:", url);
      console.log("Headers:", getAuthHeaders());

      const res = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      console.log("Tickets API response status:", res.status);
      console.log("Tickets API response data:", data);

      if (!res.ok) {
        console.error("Failed to fetch tickets:", {
          status: res.status,
          statusText: res.statusText,
          data,
        });

        const errorMessage =
          typeof data.message === "string"
            ? data.message
            : data.message?.message ||
              data.error ||
              `Failed to fetch tickets: ${res.statusText}`;
        return rejectWithValue(errorMessage);
      }

      const ticketsArray = data.data || data || [];

      const totalCount = data.total ?? data.totalCount ?? data.count ?? null;

      console.log("Normalized tickets count:", ticketsArray.length);
      console.log("Total count from backend:", totalCount);

      return {
        tickets: Array.isArray(ticketsArray)
          ? ticketsArray.map(normalizeTicket)
          : [],
        page: filters.page || 1,
        totalCount: totalCount,
      };
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch tickets");
    }
  }
);

export const fetchTicketById = createAsyncThunk(
  "tickets/fetchTicketById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      const res = await fetch(`${BASE_URL}/api/v1/tickets/${id}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      if (!res.ok) {
        return rejectWithValue(data.message || "Failed to fetch ticket");
      }

      return normalizeTicket(data.data);
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch ticket");
    }
  }
);

export const createTicket = createAsyncThunk(
  "tickets/createTicket",
  async (
    ticketData: {
      TicketName: string;
      description: string;
      TicketStatus: string;
      priority: string;
      source: string;
      companyId?: number | null;
      dealId?: number | null;
      userIds?: number[];
    },
    { rejectWithValue }
  ) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      console.log("Creating ticket with data:", ticketData);

      const res = await fetch(`${BASE_URL}/api/v1/tickets`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(ticketData),
      });

      const data = await res.json();

      console.log("Create ticket response status:", res.status);
      console.log("Create ticket response data:", data);

      if (!res.ok) {
        console.error("Failed to create ticket:", {
          status: res.status,
          statusText: res.statusText,
          data,
        });

        const errorMessage =
          typeof data.message === "string"
            ? data.message
            : data.message?.message ||
              data.error ||
              `Failed to create ticket: ${res.statusText}`;
        return rejectWithValue(errorMessage);
      }

      if (data.data?.id) {
        const ticketRes = await fetch(
          `${BASE_URL}/api/v1/tickets/${data.data.id}`,
          {
            method: "GET",
            headers: getAuthHeaders(),
          }
        );
        const ticketData_res = await ticketRes.json();
        if (ticketRes.ok) {
          return normalizeTicket(ticketData_res.data);
        }
      }

      return rejectWithValue("Ticket created but failed to fetch details");
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to create ticket");
    }
  }
);

export const updateTicket = createAsyncThunk(
  "tickets/updateTicket",
  async (
    {
      id,
      ticketData,
    }: {
      id: string | number;
      ticketData: {
        TicketName?: string;
        description?: string;
        TicketStatus?: string;
        priority?: string;
        source?: string;
        companyId?: number | null;
        dealId?: number | null;
        userIds?: number[];
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      const res = await fetch(`${BASE_URL}/api/v1/tickets/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(ticketData),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMessage =
          typeof data.message === "string"
            ? data.message
            : data.message?.message || data.error || "Failed to update ticket";
        return rejectWithValue(errorMessage);
      }

      const ticketRes = await fetch(`${BASE_URL}/api/v1/tickets/${id}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const ticketData_res = await ticketRes.json();
      if (ticketRes.ok) {
        return normalizeTicket(ticketData_res.data);
      }

      return rejectWithValue("Ticket updated but failed to fetch details");
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to update ticket");
    }
  }
);

export const deleteTicket = createAsyncThunk(
  "tickets/deleteTicket",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      const res = await fetch(`${BASE_URL}/api/v1/tickets/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      if (!res.ok) {
        return rejectWithValue(data.message || "Failed to delete ticket");
      }

      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to delete ticket");
    }
  }
);

const ticketsSlice = createSlice({
  name: "tickets",
  initialState,
  reducers: {
    clearTickets(state) {
      state.tickets = [];
      state.currentTicket = null;
      state.error = null;
    },
    setFilters(state, action: PayloadAction<TicketFilters>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCurrentTicket(state) {
      state.currentTicket = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload.tickets;
        state.currentPage = action.payload.page;
        state.totalCount = action.payload.totalCount ?? state.totalCount;
        state.error = null;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchTicketById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTicket = action.payload;
        state.error = null;
      })
      .addCase(fetchTicketById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(createTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = [action.payload, ...state.tickets];
        state.error = null;
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(updateTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = state.tickets.map((t) =>
          t.id === action.payload.id ? action.payload : t
        );
        if (state.currentTicket?.id === action.payload.id) {
          state.currentTicket = action.payload;
        }
        state.error = null;
      })
      .addCase(updateTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(deleteTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = state.tickets.filter(
          (t) => String(t.id) !== String(action.payload)
        );
        if (state.currentTicket?.id === action.payload) {
          state.currentTicket = null;
        }
        state.error = null;
      })
      .addCase(deleteTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearTickets, setFilters, clearCurrentTicket } =
  ticketsSlice.actions;
export default ticketsSlice.reducer;
