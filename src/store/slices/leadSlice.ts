"use client";

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const toApiStatus = (status: string) =>
  status.toUpperCase() === "IN PROGRESS"
    ? "IN PROGRESS"
    : status.toUpperCase().replace(/ /g, "_");

export const toUiStatus = (status: any) => {
  if (!status) return "New";
  const s = status.toString().trim().toUpperCase().replace(/_/g, " ");
  switch (s) {
    case "OPEN":
      return "Open";
    case "NEW":
      return "New";
    case "IN PROGRESS":
    case "IN_PROGRESS":
      return "In Progress";
    case "CONTACT":
      return "Contact";
    case "QUALIFIED":
      return "Qualified";
    case "CLOSED":
      return "Closed";
    case "CONVERTED":
      return "Converted";
    default:
      return "New";
  }
};

export const fetchLeadById = createAsyncThunk(
  "leads/fetchById",
  async (id: number | string, { rejectWithValue, getState }) => {
    try {
      const token = (getState() as any).auth.token;

      const res = await fetch(`${BASE_URL}/api/v1/lead/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);

      return data.data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchLeads = createAsyncThunk(
  "leads/fetchAll",
  async (
    params: { page?: number; size?: number } = { page: 1, size: 10 },
    { rejectWithValue, getState }
  ) => {
    try {
      const page = params.page ?? 1;
      const size = params.size ?? 10;

      const token = (getState() as any).auth.token;

      const res = await fetch(
        `${BASE_URL}/api/v1/lead?page=${page}&size=${size}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const json = await res.json();
      if (!res.ok) return rejectWithValue(json.message);

      return {
        data: json.data,
        total: json.total,
        page: json.page,
        size: json.size,
      };
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);
export const updateLeadAPI = createAsyncThunk(
  "leads/update",
  async ({ id, updates }: any, { rejectWithValue, getState }) => {
    try {
      const token = (getState() as any).auth.token;

      const apiUpdates = {
        ...updates,
        leadStatus: updates.leadStatus
          ? toApiStatus(updates.leadStatus)
          : "NEW",
      };

      const res = await fetch(`${BASE_URL}/api/v1/lead/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiUpdates),
      });

      const json = await res.json();
      if (!res.ok) return rejectWithValue(json.message);

      return {
        id,
        updates: {
          ...json.data,
          leadStatus: json.data.leadStatus || json.data.status,
        },
      };
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const createLeadAPI = createAsyncThunk(
  "leads/create",
  async (payload: any, { rejectWithValue, getState }) => {
    try {
      const token = (getState() as any).auth.token;

      const apiPayload = {
        ...payload,
        leadStatus: payload.leadStatus
          ? toApiStatus(payload.leadStatus)
          : "NEW",
      };

      const res = await fetch(`${BASE_URL}/api/v1/lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiPayload),
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);

      return data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteLeadAPI = createAsyncThunk(
  "leads/delete",
  async (id: number, { rejectWithValue, getState }) => {
    try {
      const token = (getState() as any).auth.token;

      const res = await fetch(`${BASE_URL}/api/v1/lead/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (!res.ok) return rejectWithValue(json.message);

      return id;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

interface LeadState {
  leads: any[];
  currentLead: any | null;
  total: number;
  page: number;
  size: number;
}

const initialState: LeadState = {
  leads: [],
  currentLead: null,
  total: 0,
  page: 1,
  size: 10,
};

const leadSlice = createSlice({
  name: "leads",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder.addCase(fetchLeadById.fulfilled, (state, action) => {
      const l = action.payload;

      state.currentLead = {
        id: Number(l.id),
        email: l.email,
        firstName: l.firstName,
        lastName: l.lastName,
        phone: l.phoneNumber,
        jobTitle: l.jobTitle,
        city: l.city,
        status: toUiStatus(l.leadStatus || l.status),
        contactOwner: l.userIds ?? [],
        createdDate: l.createdAt,
      };
    });

    builder.addCase(fetchLeads.fulfilled, (state, action) => {
      state.leads = action.payload.data.map((l: any) => ({
        id: Number(l.id),
        email: l.email,
        firstName: l.firstName,
        lastName: l.lastName,
        phone: l.phoneNumber,
        jobTitle: l.jobTitle,
        city: l.city,
        status: toUiStatus(l.leadStatus || l.status),
        contactOwner:
          l.Users?.map((u: any) => `${u.firstName} ${u.lastName}`) ?? [],
        createdDate: l.createdAt,
      }));

      state.total = action.payload.total;
      state.page = action.payload.page;
      state.size = action.payload.size;
    });

    builder.addCase(deleteLeadAPI.fulfilled, (state, action) => {
      state.leads = state.leads.filter((l) => l.id !== action.payload);
    });

    builder.addCase(updateLeadAPI.fulfilled, (state, action) => {
      const { id, updates } = action.payload;

      state.leads = state.leads.map((lead) =>
        lead.id === Number(id)
          ? {
              ...lead,
              email: updates.email,
              firstName: updates.firstName,
              lastName: updates.lastName,
              phone: updates.phoneNumber,
              city: updates.city,
              jobTitle: updates.jobTitle,
              status: toUiStatus(updates.leadStatus || updates.status),
            }
          : lead
      );

      if (state.currentLead?.id === Number(id)) {
        state.currentLead = {
          ...state.currentLead,
          email: updates.email,
          firstName: updates.firstName,
          lastName: updates.lastName,
          phone: updates.phoneNumber,
          city: updates.city,
          jobTitle: updates.jobTitle,
          status: toUiStatus(updates.leadStatus || updates.status),
        };
      }
    });
  },
});

export default leadSlice.reducer;
