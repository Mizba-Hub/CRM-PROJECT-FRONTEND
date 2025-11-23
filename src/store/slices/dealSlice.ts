import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface Deal {
  id: number;
  name: string;
  stage: string;
  closeDate: string;
  owner: string[];
  amount: string;
  priority: string;
  createdDate: string;
  description?: string;
  accountName?: string;
  associatedLead?: string;
  lead?: any;
  leadName?: string;
  ownerIds?: number[];
  associatedLeadName?: string;
}

interface DealsState {
  deals: Deal[];
  loading: boolean;
  error: string | null;
}

const initialState: DealsState = {
  deals: [],
  loading: false,
  error: null,
};

/* --------------------------
   TRANSFORM DEAL (COMMON)
--------------------------- */
const transformDeal = (deal: any): Deal => {
  console.log("Transforming deal:", deal);

  let leadName = "";
  let associatedLeadId = "";

  if (deal.lead) {
    leadName =
      deal.lead.name ||
      `${deal.lead.firstName || ""} ${deal.lead.lastName || ""}`.trim() ||
      deal.lead.leadName ||
      "";

    associatedLeadId = String(deal.lead.id);
  } else if (deal.associatedLead) {
    leadName =
      deal.associatedLead.name ||
      `${deal.associatedLead.firstName || ""} ${deal.associatedLead.lastName || ""}`.trim() ||
      deal.associatedLead.leadName ||
      "";

    associatedLeadId = String(deal.associatedLead.id);
  } else if (deal.leadName) {
    leadName = deal.leadName;
    associatedLeadId = deal.leadId ? String(deal.leadId) : "";
  }

  return {
    id: deal.id,
    name: deal.dealName || deal.name || "",
    stage: deal.dealStage || deal.stage || "",
    closeDate: deal.closeDate || "",
    amount: deal.amount || "",
    priority: deal.priority || "",
    createdDate: deal.createdAt || deal.createdDate || new Date().toISOString(),

    description: deal.description || "",
    accountName: deal.accountName || "",

    owner: deal.dealOwner
      ? Array.isArray(deal.dealOwner)
        ? deal.dealOwner.map((u: any) =>
            u
              ? `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                u.name ||
                u.email ||
                `User ${u.id}`
              : "Unknown"
          )
        : []
      : deal.owner || [],

    ownerIds: Array.isArray(deal.dealOwner)
      ? deal.dealOwner.map((u: any) => u.id)
      : deal.ownerIds || [],

    associatedLead: associatedLeadId,
    lead: deal.lead || deal.associatedLead || null,
    leadName: leadName,
    associatedLeadName: leadName,
  };
};

/* --------------------------
   FETCH ALL DEALS
--------------------------- */
export const fetchDeals = createAsyncThunk(
  "deals/fetchDeals",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const token = state.auth.token;

      if (!token) return rejectWithValue("No authentication token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/deal`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const err = await response.text();
        return rejectWithValue(err);
      }

      const data = await response.json();
      return data.data.map(transformDeal);
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

/* --------------------------
   FETCH DEAL BY ID
--------------------------- */
export const fetchDealById = createAsyncThunk(
  "deals/fetchDealById",
  async (id: number | string, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const token = state.auth.token;

      if (!token) return rejectWithValue("No authentication token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/deal/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const err = await response.text();
        return rejectWithValue(err);
      }

      const data = await response.json();
      return transformDeal(data.data);
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

/* --------------------------
   CREATE DEAL
--------------------------- */
export const createDeal = createAsyncThunk(
  "deals/createDeal",
  async (dealData: any, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const token = state.auth.token;

      if (!token) return rejectWithValue("No authentication token");

      const backendData = {
        dealName: dealData.name,
        dealStage: dealData.stage,
        amount: dealData.amount,
        priority: dealData.priority,
        closeDate: dealData.closeDate,
        leadId: dealData.leadId,
        ownerIds: dealData.ownerIds,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/deal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(backendData),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
      }

      const data = await response.json();
      return transformDeal(data.data);
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

/* --------------------------
   UPDATE DEAL
--------------------------- */
export const updateDeal = createAsyncThunk(
  "deals/updateDeal",
  async ({ id, dealData }: any, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const token = state.auth.token;

      if (!token) return rejectWithValue("No authentication token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/deal/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dealData),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
      }

      const data = await response.json();
      return transformDeal(data.data);
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

/* --------------------------
   DELETE DEAL
--------------------------- */
export const deleteDeal = createAsyncThunk(
  "deals/deleteDeal",
  async (id: number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const token = state.auth.token;

      if (!token) return rejectWithValue("No auth token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/deal/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await response.json();
      if (!result.success) throw new Error("Failed to delete");

      return id;
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

/* --------------------------
   SLICE
--------------------------- */
const dealsSlice = createSlice({
  name: "deals",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchDeals.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDeals.fulfilled, (state, action) => {
        state.loading = false;
        state.deals = action.payload;
      })
      .addCase(fetchDeals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchDealById.fulfilled, (state, action) => {
        const index = state.deals.findIndex(
          (d) => d.id === action.payload.id
        );

        if (index !== -1) state.deals[index] = action.payload;
        else state.deals.push(action.payload);
      })

      .addCase(createDeal.fulfilled, (state, action) => {
        state.deals.unshift(action.payload);
      })

      .addCase(updateDeal.fulfilled, (state, action) => {
        const index = state.deals.findIndex(
          (d) => d.id === action.payload.id
        );
        if (index !== -1) state.deals[index] = action.payload;
      })

      .addCase(deleteDeal.fulfilled, (state, action) => {
        state.deals = state.deals.filter((d) => d.id !== action.payload);
      });
  },
});

export const { setLoading, setError, clearError } = dealsSlice.actions;
export default dealsSlice.reducer;
