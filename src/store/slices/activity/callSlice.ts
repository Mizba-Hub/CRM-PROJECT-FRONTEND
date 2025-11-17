import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export type CallTargetType = "lead" | "deal" | "company" | "ticket";
export type CallResult = "successful" | "unsuccessful";

export interface CallTarget {
  type: CallTargetType;
  id: string | number;
  name: string | null;
  phoneNumber: string | null;
}

export interface CallUser {
  id: string;
  name: string;
}

export interface CallRecord {
  callId: number;
  result: CallResult;
  user: CallUser | null;
  target: CallTarget;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
}

type CallState = {
  items: CallRecord[];
  current: CallRecord | null;
  loading: boolean;
  error: string | null;
};

const initialState: CallState = {
  items: [],
  current: null,
  loading: false,
  error: null,
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

// Initiate a new call
export const initiateCall = createAsyncThunk(
  "calls/initiateCall",
  async (
    payload: {
      userId: number;
      targetType: CallTargetType;
      targetId: number | string;
      callerPhone: string;
    },
    { rejectWithValue }
  ) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const res = await fetch(`${BASE_URL}/api/v1/calls`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message || data?.error || "Failed to initiate call";
        return rejectWithValue(msg);
      }
      
      return data as CallRecord;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to initiate call");
    }
  }
);


export const fetchCallsByUser = createAsyncThunk(
  "calls/fetchCallsByUser",
  async (userId: number | string, { rejectWithValue }) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const res = await fetch(`${BASE_URL}/api/v1/calls/user/${userId}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message || data?.error || "Failed to fetch calls";
        return rejectWithValue(msg);
      }
      return Array.isArray(data) ? (data as CallRecord[]) : [];
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch calls");
    }
  }
);


export const fetchCallById = createAsyncThunk(
  "calls/fetchCallById",
  async (callId: number | string, { rejectWithValue }) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const res = await fetch(`${BASE_URL}/api/v1/calls/${callId}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message || data?.error || "Failed to fetch call";
        return rejectWithValue(msg);
      }
      return data as CallRecord;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch call");
    }
  }
);


export const endCall = createAsyncThunk(
  "calls/endCall",
  async (callId: number | string, { rejectWithValue }) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const res = await fetch(`${BASE_URL}/api/v1/calls/${callId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message || data?.error || "Failed to end call";
        return rejectWithValue(msg);
      }
      return callId;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to end call");
    }
  }
);

const callSlice = createSlice({
  name: "calls",
  initialState,
  reducers: {
    clearCalls(state) {
      state.items = [];
      state.current = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initiateCall.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initiateCall.fulfilled, (state, action: PayloadAction<CallRecord>) => {
        state.loading = false;
        state.current = action.payload;
        state.items = [action.payload, ...state.items];
      })
      .addCase(initiateCall.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchCallsByUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCallsByUser.fulfilled, (state, action: PayloadAction<CallRecord[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCallsByUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchCallById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCallById.fulfilled, (state, action: PayloadAction<CallRecord>) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchCallById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder.addCase(endCall.fulfilled, (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((c) => String(c.callId) !== String(id));
      if (state.current && String(state.current.callId) === String(id)) {
        state.current = null;
      }
    });
  },
});

export const { clearCalls } = callSlice.actions;
export default callSlice.reducer;


