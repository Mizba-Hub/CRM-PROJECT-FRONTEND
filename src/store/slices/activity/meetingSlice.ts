import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

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
  linkedModule: "lead" | "deal" | "ticket" | "company";
  linkedModuleId: number;
  totalcount: number;
  timezone: string;
  subtitle: string;
  organizers: MeetingUser[];
  attendees: MeetingUser[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingData {
  title: string;
  startDate: string;
  startTime: string;
  endTime: string;
  location: string;
  reminder: string;
  note: string;
  organizerIds: number[];
  attendeeIds: number[];
  linkedModule: "lead" | "deal" | "ticket" | "company";
  linkedModuleId: number;
}

export interface UpdateMeetingData extends Partial<CreateMeetingData> {
  id: number;
}

interface MeetingsState {
  meetings: Meeting[];
  currentMeeting: Meeting | null;
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}

const initialState: MeetingsState = {
  meetings: [],
  currentMeeting: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  },
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found. Please log in.");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const fetchCompanyMeetings = createAsyncThunk<
  { meetings: Meeting[]; pagination: MeetingsState["pagination"] },
  { companyId: number; page?: number; search?: string },
  { rejectValue: string }
>(
  "meetings/fetchCompanyMeetings",
  async ({ companyId, page = 1, search = "" }, { rejectWithValue }) => {
    try {
      const headers = getAuthHeaders();

      const queryParams = new URLSearchParams({
        linkedModule: "company",
        linkedModuleId: companyId.toString(),
        page: page.toString(),
        size: "10",
        ...(search && { search }),
      });

      const url = `http://localhost:5000/api/v1/meetings?${queryParams.toString()}`;
    

      const res = await fetch(url, { headers });

      if (!res.ok) {
        const errorText = await res.text();
        return rejectWithValue(
          `Failed to fetch meetings: ${res.status} ${errorText}`
        );
      }

      const json = await res.json();

      return {
        meetings: json.data || [],
        pagination: {
          currentPage: json.currentPage || 1,
          totalPages: json.totalPages || 1,
          totalCount: json.total || 0,
        },
      };
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch meetings");
    }
  }
);

export const createMeeting = createAsyncThunk<
  Meeting,
  CreateMeetingData,
  { rejectValue: string }
>("meetings/createMeeting", async (meetingData, { rejectWithValue }) => {
  try {
    const headers = getAuthHeaders();
  

    const BASE_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
    const url = `${BASE_URL}/api/v1/meetings`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(meetingData),
    });

    

    const responseText = await res.text();
  

    if (!res.ok) {
    }

    if (
      responseText &&
      responseText.trim() !== "" &&
      responseText.trim() !== "{}"
    ) {
      try {
        const responseData = JSON.parse(responseText);

        if (responseData.id) {
          return responseData;
        }
      } catch (parseError) {
      
      }
    }

    return rejectWithValue(
      "Backend created meeting but returned empty response"
    );
  } catch (err: any) {
    return rejectWithValue(err.message || "Network error occurred");
  }
});

export const updateMeeting = createAsyncThunk<
  Meeting,
  UpdateMeetingData,
  { rejectValue: string }
>("meetings/updateMeeting", async (meetingData, { rejectWithValue }) => {
  try {
    const headers = getAuthHeaders();

    const { id, ...updateData } = meetingData;

   

    const res = await fetch(`http://localhost:5000/api/v1/meetings/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updateData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }

    const json = await res.json();
   

    return json.data;
  } catch (err: any) {
   
    return rejectWithValue(err.message || "Failed to update meeting");
  }
});

export const deleteMeeting = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("meetings/deleteMeeting", async (meetingId, { rejectWithValue }) => {
  try {
    const headers = getAuthHeaders();

    console.log("🔍 [MEETINGS] Deleting meeting:", meetingId);

    const res = await fetch(
      `http://localhost:5000/api/v1/meetings/${meetingId}`,
      {
        method: "DELETE",
        headers,
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }

    const json = await res.json();
    

    return meetingId;
  } catch (err: any) {

    return rejectWithValue(err.message || "Failed to delete meeting");
  }
});

const meetingSlice = createSlice({
  name: "meetings",
  initialState,
  reducers: {
    setCurrentMeeting(state, action: PayloadAction<Meeting | null>) {
      state.currentMeeting = action.payload;
    },
    clearCurrentMeeting(state) {
      state.currentMeeting = null;
    },
    clearError(state) {
      state.error = null;
    },
    clearMeetings(state) {
      state.meetings = [];
      state.pagination = {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
      };
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(fetchCompanyMeetings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanyMeetings.fulfilled, (state, action) => {
        state.loading = false;
        state.meetings = action.payload.meetings;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchCompanyMeetings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch meetings";
      })

      .addCase(createMeeting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMeeting.fulfilled, (state, action) => {
        state.loading = false;
        state.meetings.unshift(action.payload);
        state.error = null;
      })
      .addCase(createMeeting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create meeting";
      })

      .addCase(updateMeeting.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateMeeting.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.meetings.findIndex(
          (m) => m.id === action.payload.id
        );
        if (index >= 0) {
          state.meetings[index] = action.payload;
        }
        if (state.currentMeeting?.id === action.payload.id) {
          state.currentMeeting = action.payload;
        }
        state.error = null;
      })
      .addCase(updateMeeting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update meeting";
      })

      .addCase(deleteMeeting.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteMeeting.fulfilled, (state, action) => {
        state.loading = false;
        state.meetings = state.meetings.filter((m) => m.id !== action.payload);
        if (state.currentMeeting?.id === action.payload) {
          state.currentMeeting = null;
        }
        state.error = null;
      })
      .addCase(deleteMeeting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete meeting";
      });
  },
});

export const {
  setCurrentMeeting,
  clearCurrentMeeting,
  clearError,
  clearMeetings,
} = meetingSlice.actions;
export default meetingSlice.reducer;
