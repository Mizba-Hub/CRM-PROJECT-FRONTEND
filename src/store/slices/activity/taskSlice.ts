import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export type LinkedModule = "lead" | "deal" | "ticket" | "company";
export type TaskType = "to do" | "call" | "email" | "meeting";
export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "pending" | "completed";

export interface AssignedUser {
  id: string;
  name: string | null;
}

export interface Task {
  id: number;
  taskName: string;
  dueDate: string | null;
  dueTime: string | null;
  taskType: TaskType;
  priority: TaskPriority;
  assignedTo: AssignedUser | null;
  note: string | null;
  status: TaskStatus;
  linkedModule: LinkedModule;
  linkedModuleId: string;
  createdAt: string | null;
  updatedAt: string | null;
  timezone?: string | null;
  completedAt?: string | null;
}

export interface TasksQuery {
  page?: number;
  size?: number;
  status?: TaskStatus;
  taskType?: TaskType;
  priority?: TaskPriority;
  linkedModule?: LinkedModule;
  linkedModuleId?: string | number;
  search?: string;
}

export interface CreateTaskPayload {
  taskName: string;
  dueDate?: string | null;
  dueTime?: string | null;
  taskType: TaskType;
  priority: TaskPriority;
  assignedToId: number;
  note?: string | null;
  linkedModule: LinkedModule;
  linkedModuleId: string | number;
  timezone?: string | null;
}

export interface UpdateTaskPayload {
  taskName?: string;
  dueDate?: string | null;
  dueTime?: string | null;
  taskType?: TaskType;
  priority?: TaskPriority;
  assignedToId?: number;
  note?: string | null;
  status?: TaskStatus;
  linkedModule?: LinkedModule;
  linkedModuleId?: string | number;
  timezone?: string | null;
}

type TaskState = {
  items: Task[];
  current: Task | null;
  loading: boolean;
  error: string | null;
};

const initialState: TaskState = {
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


export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async (query: TasksQuery = {}, { rejectWithValue }) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const params = new URLSearchParams();
      if (query.page) params.append("page", String(query.page));
      if (query.size) params.append("size", String(query.size));
      if (query.status) params.append("status", query.status);
      if (query.taskType) params.append("taskType", query.taskType);
      if (query.priority) params.append("priority", query.priority);
      if (query.linkedModule) params.append("linkedModule", query.linkedModule);
      if (query.linkedModuleId) params.append("linkedModuleId", String(query.linkedModuleId));
      if (query.search) params.append("search", query.search);

      const res = await fetch(`${BASE_URL}/api/v1/tasks${params.toString() ? `?${params.toString()}` : ""}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message || data?.error || "Failed to fetch tasks";
        return rejectWithValue(msg);
      }
      
      return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch tasks");
    }
  }
);


export const fetchTaskById = createAsyncThunk(
  "tasks/fetchTaskById",
  async (taskId: number | string, { rejectWithValue }) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const res = await fetch(`${BASE_URL}/api/v1/tasks/${taskId}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message || data?.error || "Failed to fetch task";
        return rejectWithValue(msg);
      }
      return data?.data || data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch task");
    }
  }
);


export const createTask = createAsyncThunk(
  "tasks/createTask",
  async (payload: CreateTaskPayload, { rejectWithValue }) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const res = await fetch(`${BASE_URL}/api/v1/tasks`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message || data?.error || "Failed to create task";
        return rejectWithValue(msg);
      }
      return data?.data || data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to create task");
    }
  }
);


export const updateTask = createAsyncThunk(
  "tasks/updateTask",
  async (
    { taskId, payload }: { taskId: number | string; payload: UpdateTaskPayload },
    { rejectWithValue }
  ) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const res = await fetch(`${BASE_URL}/api/v1/tasks/${taskId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message || data?.error || "Failed to update task";
        return rejectWithValue(msg);
      }
      return data?.data || data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to update task");
    }
  }
);


export const completeTask = createAsyncThunk(
  "tasks/completeTask",
  async (
    { taskId, note }: { taskId: number | string; note?: string | null },
    { rejectWithValue }
  ) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const res = await fetch(`${BASE_URL}/api/v1/tasks/${taskId}/complete`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ note: note || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message || data?.error || "Failed to complete task";
        return rejectWithValue(msg);
      }
      return data?.data || data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to complete task");
    }
  }
);


export const deleteTask = createAsyncThunk(
  "tasks/deleteTask",
  async (taskId: number | string, { rejectWithValue }) => {
    try {
      if (!BASE_URL) return rejectWithValue("API base URL is not configured");
      const token = getAuthToken();
      if (!token) return rejectWithValue("No authentication token found");

      const res = await fetch(`${BASE_URL}/api/v1/tasks/${taskId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message || data?.error || "Failed to delete task";
        return rejectWithValue(msg);
      }
      return taskId;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to delete task");
    }
  }
);

const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrent: (state) => {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === "string" ? action.payload : "Failed to fetch tasks";
      });

  
    builder
      .addCase(fetchTaskById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaskById.fulfilled, (state, action: PayloadAction<Task>) => {
        state.loading = false;
        state.current = action.payload;
        
        const index = state.items.findIndex((t) => t.id === action.payload.id);
        if (index >= 0) {
          state.items[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === "string" ? action.payload : "Failed to fetch task";
      });

    
    builder
      .addCase(createTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === "string" ? action.payload : "Failed to create task";
      });

    
    builder
      .addCase(updateTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === "string" ? action.payload : "Failed to update task";
      });

    
    builder
      .addCase(completeTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeTask.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
      
        const taskId = action.payload?.id;
        if (taskId) {
          const index = state.items.findIndex((t) => t.id === taskId);
          if (index >= 0) {
            state.items[index] = {
              ...state.items[index],
              status: "completed" as TaskStatus,
              completedAt: action.payload.completedAt || new Date().toISOString(),
            };
          }
          
          if (state.current && state.current.id === taskId) {
            state.current.status = "completed" as TaskStatus;
            state.current.completedAt = action.payload.completedAt || new Date().toISOString();
          }
        }
        state.error = null;
      })
      .addCase(completeTask.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === "string" ? action.payload : "Failed to complete task";
      });

    
    builder
      .addCase(deleteTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action: PayloadAction<number | string>) => {
        state.loading = false;
        state.items = state.items.filter((t) => String(t.id) !== String(action.payload));
        // Clear current if it's the deleted task
        if (state.current && String(state.current.id) === String(action.payload)) {
          state.current = null;
        }
        state.error = null;
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === "string" ? action.payload : "Failed to delete task";
      });
  },
});

export const { clearError, clearCurrent } = taskSlice.actions;
export default taskSlice.reducer;

