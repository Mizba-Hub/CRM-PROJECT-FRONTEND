import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export type LinkedType = "lead" | "deal" | "ticket" | "company";

export interface Note {
  id: number;
  content: string;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface NotesQuery {
  page?: number;
  size?: number;
  search?: string;
  linkedTo?: number;
  type?: LinkedType;
}

type NotesState = {
  items: Note[];
  current: Note | null;
  loading: boolean;
  error: string | null;
};

const initialState: NotesState = {
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

export const fetchNotes = createAsyncThunk(
  "notes/fetchNotes",
  async (query: NotesQuery = {}, { rejectWithValue }) => {
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

      const res = await fetch(`${BASE_URL}/api/v1/notes${params.toString() ? `?${params.toString()}` : ""}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message || data?.error || "Failed to fetch notes";
        return rejectWithValue(msg);
      }
      return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch notes");
    }
  }
);

export const fetchNoteById = createAsyncThunk(
  "notes/fetchNoteById",
  async (id: number | string, { rejectWithValue }) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const res = await fetch(`${BASE_URL}/api/v1/notes/${id}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message || data?.error || "Failed to fetch note";
        return rejectWithValue(msg);
      }
      return data?.data || data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch note");
    }
  }
);

export const createNote = createAsyncThunk(
  "notes/createNote",
  async (
    payload: { content: string; userId?: number | null; linkedTo?: { type: LinkedType; id: number } | null },
    { rejectWithValue }
  ) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const res = await fetch(`${BASE_URL}/api/v1/notes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message || data?.error || "Failed to create note";
        return rejectWithValue(msg);
      }
      return data?.data || { id: data?.id, ...payload };
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to create note");
    }
  }
);

export const updateNote = createAsyncThunk(
  "notes/updateNote",
  async (
    {
      id,
      update,
    }: {
      id: number | string;
      update: { content?: string; userId?: number | null; linkedTo?: { type: LinkedType; id: number } | null };
    },
    { rejectWithValue }
  ) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const res = await fetch(`${BASE_URL}/api/v1/notes/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(update),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.message || data?.error || "Failed to update note";
        return rejectWithValue(msg);
      }
      return { id, ...update };
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to update note");
    }
  }
);

export const deleteNote = createAsyncThunk(
  "notes/deleteNote",
  async (id: number | string, { rejectWithValue }) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const res = await fetch(`${BASE_URL}/api/v1/notes/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.message || data?.error || "Failed to delete note";
        return rejectWithValue(msg);
      }
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to delete note");
    }
  }
);

const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    clearNotes(state) {
      state.items = [];
      state.current = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotes.fulfilled, (state, action: PayloadAction<Note[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchNoteById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNoteById.fulfilled, (state, action: PayloadAction<Note>) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchNoteById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(createNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNote.fulfilled, (state, action) => {
        state.loading = false;
        const created = action.payload as any;
        if (created) {
          const note: Note = {
            id: created.id,
            content: created.content,
            linkedTo: created.linkedTo,
            owner: state.current?.owner,
          };
          state.items = [note, ...state.items];
        }
      })
      .addCase(createNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(updateNote.fulfilled, (state, action) => {
        const updated = action.payload as any;
        state.items = state.items.map((n) =>
          String(n.id) === String(updated.id) ? { ...n, ...updated } : n
        );
        if (state.current && String(state.current.id) === String(updated.id)) {
          state.current = { ...state.current, ...updated };
        }
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        const id = action.payload as any;
        state.items = state.items.filter((n) => String(n.id) !== String(id));
        if (state.current && String(state.current.id) === String(id)) {
          state.current = null;
        }
      });
  },
});

export const { clearNotes } = notesSlice.actions;
export default notesSlice.reducer;


