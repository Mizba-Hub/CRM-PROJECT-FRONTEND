import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export type LinkedType = "deal" | "lead" | "company" | "ticket";

export interface EmailAttachment {
  id: number;
  filename: string;
  fileUrl: string;
  uploadedBy?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  isNew?: boolean;
  createdAt?: string;
}

export interface Email {
  id: number;
  subject: string;
  body: string;
  recipients: string[];
  cc?: string[] | null;
  bcc?: string[] | null;
  attachments?: EmailAttachment[];
  linkedTo?: {
    type: LinkedType;
    id: number;
    name?: string | null;
  } | null;
  owner?: {
    id: number;
    name: string;
    email: string;
  } | null;
  sentAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmailQuery {
  page?: number;
  size?: number;
  search?: string;
  linkedTo?: number;
  type?: LinkedType;
}

export interface CreateEmailPayload {
  subject: string;
  body: string;
  userId: number;
  recipients: string[];
  cc?: string[];
  bcc?: string[];
  linkedTo: {
    type: LinkedType;
    id: number;
  };
  files?: File[];
  attachmentIds?: number[];
}

export interface UpdateEmailPayload {
  subject?: string;
  body?: string;
  recipients?: string[];
  cc?: string[];
  bcc?: string[];
  userId?: number;
  linkedTo?: {
    type: LinkedType;
    id: number;
  };
}

type EmailsState = {
  items: Email[];
  current: Email | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
};

const initialState: EmailsState = {
  items: [],
  current: null,
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
};

const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const token =
    localStorage.getItem("token") || localStorage.getItem("auth_token");
  return token || null;
};

const getAuthHeaders = (includeContentType: boolean = true): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {};

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
  }

  return headers;
};

export const fetchEmails = createAsyncThunk(
  "emails/fetchEmails",
  async (query: EmailQuery = {}, { rejectWithValue }) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const params = new URLSearchParams();
      if (query.page) params.append("page", String(query.page));
      if (query.size) params.append("size", String(query.size));
      if (query.search) params.append("search", query.search);
      if (query.linkedTo) params.append("linkedTo", String(query.linkedTo));
      if (query.type) params.append("type", query.type);

      const url = `${BASE_URL}/api/v1/emails${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || data?.message || "Failed to fetch emails";
        return rejectWithValue(msg);
      }

      const emailsArray = data?.data || data || [];
      return {
        emails: Array.isArray(emailsArray) ? emailsArray : [],
        page: query.page || 1,
        totalCount: data?.pagination?.total || emailsArray.length,
      };
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch emails");
    }
  }
);

export const fetchEmailById = createAsyncThunk(
  "emails/fetchEmailById",
  async (id: number | string, { rejectWithValue }) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const res = await fetch(`${BASE_URL}/api/v1/emails/${id}`, {
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || data?.message || "Failed to fetch email";
        return rejectWithValue(msg);
      }

      return data?.data || data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch email");
    }
  }
);

export const createEmail = createAsyncThunk(
  "emails/createEmail",
  async (payload: CreateEmailPayload, { rejectWithValue }) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      // Create FormData for file uploads
      const formData = new FormData();

      // Add email data as JSON string
      const emailData = {
        subject: payload.subject,
        body: payload.body,
        userId: payload.userId,
        recipients: payload.recipients,
        cc: payload.cc || [],
        bcc: payload.bcc || [],
        linkedTo: payload.linkedTo,
        attachmentIds: payload.attachmentIds || [],
      };

      formData.append("data", JSON.stringify(emailData));

      if (payload.files && payload.files.length > 0) {
        payload.files.forEach((file) => {
          formData.append("attachments", file);
        });
      }

      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = token.startsWith("Bearer ")
          ? token
          : `Bearer ${token}`;
      }

      const res = await fetch(`${BASE_URL}/api/v1/emails`, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || data?.message || "Failed to create email";
        return rejectWithValue(msg);
      }

      return data?.data?.email || data?.data || data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to create email");
    }
  }
);

export const updateEmail = createAsyncThunk(
  "emails/updateEmail",
  async (
    { id, update }: { id: number | string; update: UpdateEmailPayload },
    { rejectWithValue }
  ) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const res = await fetch(`${BASE_URL}/api/v1/emails/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(update),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || data?.message || "Failed to update email";
        return rejectWithValue(msg);
      }

      return data?.data || { id, ...update };
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to update email");
    }
  }
);

export const deleteEmail = createAsyncThunk(
  "emails/deleteEmail",
  async (id: number | string, { rejectWithValue }) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const res = await fetch(`${BASE_URL}/api/v1/emails/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || data?.message || "Failed to delete email";
        return rejectWithValue(msg);
      }

      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to delete email");
    }
  }
);

export const uploadAttachments = createAsyncThunk(
  "emails/uploadAttachments",
  async (payload: { files: File[]; userId: number }, { rejectWithValue }) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      if (!payload.files || payload.files.length === 0) {
        return rejectWithValue("At least one file is required");
      }

      const formData = new FormData();
      payload.files.forEach((file) => {
        formData.append("attachments", file);
      });
      formData.append("userId", String(payload.userId));

      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = token.startsWith("Bearer ")
          ? token
          : `Bearer ${token}`;
      }

      const res = await fetch(`${BASE_URL}/api/v1/emails/upload-attachments`, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        const msg =
          data?.error || data?.message || "Failed to upload attachments";
        return rejectWithValue(msg);
      }

      const attachmentsArray =
        data?.data?.attachments || data?.attachments || [];
      return Array.isArray(attachmentsArray) ? attachmentsArray : [];
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to upload attachments");
    }
  }
);

export const fetchAvailableAttachments = createAsyncThunk(
  "emails/fetchAvailableAttachments",
  async (
    query: {
      search?: string;
      userId?: number;
      page?: number;
      size?: number;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const params = new URLSearchParams();
      if (query.search) params.append("search", query.search);
      if (query.userId) params.append("userId", String(query.userId));
      if (query.page) params.append("page", String(query.page));
      if (query.size) params.append("size", String(query.size));

      const url = `${BASE_URL}/api/v1/emails/available-attachments${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg =
          data?.error ||
          data?.message ||
          "Failed to fetch available attachments";
        return rejectWithValue(msg);
      }

      return {
        attachments: data?.data?.attachments || [],
        pagination: data?.data?.pagination || {},
      };
    } catch (err: any) {
      return rejectWithValue(
        err.message || "Failed to fetch available attachments"
      );
    }
  }
);

export const deleteEmailAttachment = createAsyncThunk(
  "emails/deleteEmailAttachment",
  async (id: number | string, { rejectWithValue }) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const res = await fetch(`${BASE_URL}/api/v1/emails/attachments/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data?.error || data?.message || "Failed to delete attachment";
        return rejectWithValue(msg);
      }

      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to delete attachment");
    }
  }
);

export const fetchEmailStats = createAsyncThunk(
  "emails/fetchEmailStats",
  async (
    query: {
      userId?: number;
      startDate?: string;
      endDate?: string;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const params = new URLSearchParams();
      if (query.userId) params.append("userId", String(query.userId));
      if (query.startDate) params.append("startDate", query.startDate);
      if (query.endDate) params.append("endDate", query.endDate);

      const url = `${BASE_URL}/api/v1/emails/stats${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg =
          data?.error || data?.message || "Failed to fetch email statistics";
        return rejectWithValue(msg);
      }

      return data?.data || data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch email statistics");
    }
  }
);

const emailSlice = createSlice({
  name: "emails",
  initialState,
  reducers: {
    clearEmails(state) {
      state.items = [];
      state.current = null;
      state.error = null;
      state.totalCount = 0;
      state.currentPage = 1;
    },
  },
  extraReducers: (builder) => {
    // Fetch emails
    builder
      .addCase(fetchEmails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmails.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.emails;
        state.currentPage = action.payload.page;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(fetchEmails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchEmailById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchEmailById.fulfilled,
        (state, action: PayloadAction<Email>) => {
          state.loading = false;
          state.current = action.payload;
        }
      )
      .addCase(fetchEmailById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(createEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEmail.fulfilled, (state, action: PayloadAction<Email>) => {
        state.loading = false;
        state.items = [action.payload, ...state.items];
        state.totalCount += 1;
      })
      .addCase(createEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(updateEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEmail.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload as any;
        state.items = state.items.map((e) =>
          String(e.id) === String(updated.id) ? { ...e, ...updated } : e
        );
        if (state.current && String(state.current.id) === String(updated.id)) {
          state.current = { ...state.current, ...updated };
        }
      })
      .addCase(updateEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(deleteEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEmail.fulfilled, (state, action) => {
        state.loading = false;
        const id = action.payload as any;
        state.items = state.items.filter((e) => String(e.id) !== String(id));
        if (state.current && String(state.current.id) === String(id)) {
          state.current = null;
        }
        state.totalCount = Math.max(0, state.totalCount - 1);
      })
      .addCase(deleteEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearEmails } = emailSlice.actions;
export default emailSlice.reducer;
