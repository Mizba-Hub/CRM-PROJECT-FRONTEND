import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export type LinkedType = "deal" | "lead" | "company" | "ticket";

export interface Attachment {
  id: number;
  filename: string;
  fileUrl: string;
  frontendUrl?: string;
  uploadedById: number;
  uploadedBy?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  emailId?: number | null;
  linkedType?: LinkedType | null;
  linkedId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttachmentQuery {
  linkedType?: LinkedType;
  linkedId?: string | number;
}

type AttachmentsState = {
  items: Attachment[];
  current: Attachment | null;
  loading: boolean;
  error: string | null;
};

const initialState: AttachmentsState = {
  items: [],
  current: null,
  loading: false,
  error: null,
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

// Fetch all attachments or by linkedType/linkedId
export const fetchAttachments = createAsyncThunk(
  "attachments/fetchAttachments",
  async (query: AttachmentQuery = {}, { rejectWithValue }) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const params = new URLSearchParams();
      if (query.linkedType) params.append("linkedType", query.linkedType);
      if (query.linkedId) params.append("linkedId", String(query.linkedId));

      const url = `${BASE_URL}/api/v1/attachments${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg =
          data?.message || data?.error || "Failed to fetch attachments";
        return rejectWithValue(msg);
      }

      // Handle response format: { attachments: [...] } or { data: [...] } or [...]
      const attachmentsArray = data.attachments || data.data || data || [];
      return Array.isArray(attachmentsArray) ? attachmentsArray : [];
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch attachments");
    }
  }
);

// Fetch attachment by ID
export const fetchAttachmentById = createAsyncThunk(
  "attachments/fetchAttachmentById",
  async (id: number | string, { rejectWithValue }) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const res = await fetch(`${BASE_URL}/api/v1/attachments/${id}`, {
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg =
          data?.message || data?.error || "Failed to fetch attachment";
        return rejectWithValue(msg);
      }

      return data || data.data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch attachment");
    }
  }
);

// Create attachments (file upload)
export const createAttachments = createAsyncThunk(
  "attachments/createAttachments",
  async (
    payload: {
      files: File[];
      uploadedById: number;
      linkedType?: LinkedType | null;
      linkedId?: string | number | null;
    },
    { rejectWithValue }
  ) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      if (!payload.files || payload.files.length === 0) {
        return rejectWithValue("At least one file is required");
      }

      const totalSize = payload.files.reduce((acc, file) => acc + file.size, 0);
      const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20 MB
      if (totalSize > MAX_TOTAL_SIZE) {
        return rejectWithValue("Total file size exceeds 20 MB");
      }

      const formData = new FormData();

      payload.files.forEach((file) => {
        formData.append("files", file);
      });

      formData.append("uploadedById", String(payload.uploadedById));
      if (payload.linkedType) {
        formData.append("linkedType", payload.linkedType);
      }
      if (payload.linkedId) {
        formData.append("linkedId", String(payload.linkedId));
      }

      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = token.startsWith("Bearer ")
          ? token
          : `Bearer ${token}`;
      }

      const res = await fetch(`${BASE_URL}/api/v1/attachments`, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        const msg =
          data?.message || data?.error || "Failed to upload attachments";
        return rejectWithValue(msg);
      }

      const attachmentsArray = data.attachments || data.data || data || [];
      return Array.isArray(attachmentsArray) ? attachmentsArray : [];
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to upload attachments");
    }
  }
);

export const deleteAttachment = createAsyncThunk(
  "attachments/deleteAttachment",
  async (id: number | string, { rejectWithValue }) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const res = await fetch(`${BASE_URL}/api/v1/attachments/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data?.message || data?.error || "Failed to delete attachment";
        return rejectWithValue(msg);
      }

      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to delete attachment");
    }
  }
);

const attachmentSlice = createSlice({
  name: "attachments",
  initialState,
  reducers: {
    clearAttachments(state) {
      state.items = [];
      state.current = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch attachments
    builder
      .addCase(fetchAttachments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAttachments.fulfilled,
        (state, action: PayloadAction<Attachment[]>) => {
          state.loading = false;
          state.items = action.payload;
        }
      )
      .addCase(fetchAttachments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchAttachmentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAttachmentById.fulfilled,
        (state, action: PayloadAction<Attachment>) => {
          state.loading = false;
          state.current = action.payload;
        }
      )
      .addCase(fetchAttachmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(createAttachments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createAttachments.fulfilled,
        (state, action: PayloadAction<Attachment[]>) => {
          state.loading = false;

          state.items = [...action.payload, ...state.items];
        }
      )
      .addCase(createAttachments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(deleteAttachment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAttachment.fulfilled, (state, action) => {
        state.loading = false;
        const id = action.payload as any;
        state.items = state.items.filter((a) => String(a.id) !== String(id));
        if (state.current && String(state.current.id) === String(id)) {
          state.current = null;
        }
      })
      .addCase(deleteAttachment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAttachments } = attachmentSlice.actions;
export default attachmentSlice.reducer;
