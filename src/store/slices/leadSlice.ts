"use client";

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const toApiStatus = (status: string) => status.toUpperCase().replace(" ", "_");

const toUiStatus = (status: any) => {
  if (!status) return "New";
  const s = status.toString().trim().toUpperCase().replace(/_/g, " ");

  switch (s) {
    case "OPEN":
      return "Open";
    case "NEW":
      return "New";
    case "IN PROGRESS":
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

export const loadLeads = createAsyncThunk(
  "leads/loadLeads",
  async ({ page = 1, size = 10 }: any, thunkAPI) => {
    return thunkAPI.dispatch(fetchLeads({ page, size })).unwrap();
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

export const createLeadAPI = createAsyncThunk(
  "leads/create",
  async (payload: any, { rejectWithValue, getState }) => {
    try {
      const token = (getState() as any).auth.token;

      const res = await fetch(`${BASE_URL}/api/v1/lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);

      return data;
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

      const res = await fetch(`${BASE_URL}/api/v1/lead/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const json = await res.json();
      if (!res.ok) return rejectWithValue(json.message);

      return { id, updates: json.data };
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

export interface Lead {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  jobTitle: string;
  status: string;
  createdDate: string;
  contactOwner: string[];
}

interface LeadState {
  leads: Lead[];
  total: number;
  page: number;
  size: number;
}

const initialState: LeadState = {
  leads: [],
  total: 0,
  page: 1,
  size: 10,
};

const leadSlice = createSlice({
  name: "leads",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder.addCase(fetchLeads.fulfilled, (state, action) => {
      state.leads = action.payload.data.map((l: any) => ({
        id: Number(l.id),
        email: l.email,
        firstName: l.firstName,
        lastName: l.lastName,
        phone: l.phoneNumber,
        jobTitle: l.jobTitle,
        city: l.city,
        status: toUiStatus(l.leadStatus),
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
              email: updates.email ?? lead.email,
              firstName: updates.firstName ?? lead.firstName,
              lastName: updates.lastName ?? lead.lastName,
              phone: updates.phoneNumber ?? lead.phone,
              city: updates.city ?? lead.city,
              jobTitle: updates.jobTitle ?? lead.jobTitle,
              status: updates.leadStatus
                ? toUiStatus(updates.leadStatus)
                : lead.status,
            }
          : lead
      );
    });
  },
});

export default leadSlice.reducer;
