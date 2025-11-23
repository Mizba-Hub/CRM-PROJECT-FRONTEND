import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export type LinkedModule = "lead" | "deal" | "ticket" | "company";

export interface MeetingUser {
  id: number;
  firstName: string;
  lastName: string;
}

export interface Meeting {
  id: number;
  title: string;
  startDate: string;
  startTime: string;
  endTime: string;
  duration: string;
  location: string;
  reminder: string;
  note: string;
  linkedModule: LinkedModule;
  linkedModuleId: number;
  totalcount: number;
  timezone: string;
  subtitle: string;
  organizers: MeetingUser[];
  attendees: MeetingUser[];
  createdAt: string;
  updatedAt: string;
}

export interface MeetingsQuery {
  page?: number;
  size?: number;
  linkedModule?: LinkedModule;
  linkedModuleId?: string | number;
  search?: string;
}

export interface CreateMeetingPayload {
  title: string;
  startDate: string;
  startTime: string;
  endTime: string;
  location: string;
  reminder: string;
  note: string;
  organizerIds: number[];
  attendeeIds: number[];
  linkedModule: LinkedModule;
  linkedModuleId: number;
}

export interface UpdateMeetingPayload {
  title?: string;
  startDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  reminder?: string;
  note?: string;
  organizerIds?: number[];
  attendeeIds?: number[];
  linkedModule?: LinkedModule;
  linkedModuleId?: number;
}

type MeetingState = {
  items: Meeting[];
  current: Meeting | null;
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
};

const initialState: MeetingState = {
  items: [],
  current: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  },
};

const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
  return token || null;
};

const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  return headers;
};


export const fetchMeetings = createAsyncThunk(
  "meetings/fetchMeetings",
  async (query: MeetingsQuery = {}, { rejectWithValue }) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const params = new URLSearchParams();
      if (query.page) params.append("page", String(query.page));
      if (query.size) params.append("size", String(query.size));
      if (query.linkedModule) params.append("linkedModule", query.linkedModule);
      if (query.linkedModuleId) params.append("linkedModuleId", String(query.linkedModuleId));
      if (query.search) params.append("search", query.search);

      const res = await fetch(`${BASE_URL}/api/v1/meetings${params.toString() ? `?${params.toString()}` : ""}`, {
        headers: getAuthHeaders(),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        return rejectWithValue(`Failed to fetch meetings: ${res.status} ${errorText}`);
      }

      const data = await res.json();
      
      return {
        meetings: Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [],
        pagination: {
          currentPage: data?.currentPage || 1,
          totalPages: data?.totalPages || 1,
          totalCount: data?.total || data?.totalCount || 0,
        }
      };
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch meetings");
    }
  }
);

export const fetchMeetingById = createAsyncThunk(
  "meetings/fetchMeetingById",
  async (meetingId: number | string, { rejectWithValue }) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const res = await fetch(`${BASE_URL}/api/v1/meetings/${meetingId}`, {
        headers: getAuthHeaders(),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        return rejectWithValue(`Failed to fetch meeting: ${res.status} ${errorText}`);
      }

      const data = await res.json();
      return data?.data || data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch meeting");
    }
  }
);

export const createMeeting = createAsyncThunk(
  "meetings/createMeeting",
  async (payload: CreateMeetingPayload, { rejectWithValue }) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const res = await fetch(`${BASE_URL}/api/v1/meetings`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();

      if (!res.ok) {
        return rejectWithValue(`Failed to create meeting: ${res.status} ${responseText}`);
      }

      if (responseText && responseText.trim() !== "" && responseText.trim() !== "{}") {
        try {
          const responseData = JSON.parse(responseText);
          if (responseData.id) {
            return responseData;
          }
        } catch (parseError) {
         
        }
      }

      return rejectWithValue("Backend created meeting but returned empty response");
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to create meeting");
    }
  }
);

export const updateMeeting = createAsyncThunk(
  "meetings/updateMeeting",
  async (
    { meetingId, payload }: { meetingId: number | string; payload: UpdateMeetingPayload },
    { rejectWithValue }
  ) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const res = await fetch(`${BASE_URL}/api/v1/meetings/${meetingId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return rejectWithValue(`Failed to update meeting: ${res.status} ${errorText}`);
      }

      const data = await res.json();
      return data?.data || data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to update meeting");
    }
  }
);

export const deleteMeeting = createAsyncThunk(
  "meetings/deleteMeeting",
  async (meetingId: number | string, { rejectWithValue }) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const res = await fetch(`${BASE_URL}/api/v1/meetings/${meetingId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return rejectWithValue(`Failed to delete meeting: ${res.status} ${errorText}`);
      }

      const data = await res.json();
      return meetingId;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to delete meeting");
    }
  }
);

const meetingSlice = createSlice({
  name: "meetings",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrent: (state) => {
      state.current = null;
    },
    clearMeetings: (state) => {
      state.items = [];
      state.pagination = {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
      };
    },
  },
  extraReducers: (builder) => {
   
    builder
      .addCase(fetchMeetings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMeetings.fulfilled, (state, action: PayloadAction<{ meetings: Meeting[]; pagination: any }>) => {
        state.loading = false;
        state.items = action.payload.meetings;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchMeetings.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === "string" ? action.payload : "Failed to fetch meetings";
      });

    
    builder
      .addCase(fetchMeetingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMeetingById.fulfilled, (state, action: PayloadAction<Meeting>) => {
        state.loading = false;
        state.current = action.payload;
        
        const index = state.items.findIndex((m) => m.id === action.payload.id);
        if (index >= 0) {
          state.items[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(fetchMeetingById.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === "string" ? action.payload : "Failed to fetch meeting";
      });

    
    builder
      .addCase(createMeeting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMeeting.fulfilled, (state, action: PayloadAction<Meeting>) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.error = null;
      })
      .addCase(createMeeting.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === "string" ? action.payload : "Failed to create meeting";
      });

   
    builder
      .addCase(updateMeeting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMeeting.fulfilled, (state, action: PayloadAction<Meeting>) => {
        state.loading = false;
        const index = state.items.findIndex((m) => m.id === action.payload.id);
        if (index >= 0) {
          state.items[index] = action.payload;
        }
        if (state.current?.id === action.payload.id) {
          state.current = action.payload;
        }
        state.error = null;
      })
      .addCase(updateMeeting.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === "string" ? action.payload : "Failed to update meeting";
      });

   
    builder
      .addCase(deleteMeeting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMeeting.fulfilled, (state, action: PayloadAction<number | string>) => {
        state.loading = false;
        state.items = state.items.filter((m) => String(m.id) !== String(action.payload));
        if (state.current && String(state.current.id) === String(action.payload)) {
          state.current = null;
        }
        state.error = null;
      })
      .addCase(deleteMeeting.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === "string" ? action.payload : "Failed to delete meeting";
      });
  },
});

export const { clearError, clearCurrent, clearMeetings } = meetingSlice.actions;
export default meetingSlice.reducer;