
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


const transformDeal = (deal: any): Deal => {
  console.log("Transforming deal:", deal);
  
  return {
    id: deal.id,
    name: deal.dealName || deal.name || "",
    stage: deal.dealStage || deal.stage || "",
    closeDate: deal.closeDate || "",
    amount: deal.amount || "",
    priority: deal.priority || "",
    createdDate: deal.createdAt || deal.createdDate || new Date().toISOString(),
    owner: deal.dealOwner 
      ? (Array.isArray(deal.dealOwner) 
          ? deal.dealOwner.map((u: any) => 
              u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || u.email || `User ${u.id}` : 'Unknown'
            )
          : [])
      : deal.owner || [],
    associatedLead: deal.associatedLead
      ? (typeof deal.associatedLead === 'object'
          ? `${deal.associatedLead.firstName || ''} ${deal.associatedLead.lastName || ''}`.trim() || deal.associatedLead.name || `Lead ${deal.associatedLead.id}`
          : deal.associatedLead)
      : "-",
  };
};


export const fetchDeals = createAsyncThunk(
  'deals/fetchDeals',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const token = state.auth.token;
      
      if (!token) {
        return rejectWithValue("No authentication token found");
      }
      
      console.log("Fetching deals from:", `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/deal`);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/deal`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log("Deals response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Deals fetch error:", errorText);
        return rejectWithValue(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("Deals API response:", data);
      
      if (data.success && data.data) {
        const transformedDeals = data.data.map(transformDeal);
        return transformedDeals;
      } else {
        return rejectWithValue(data.message || 'Failed to fetch deals');
      }
    } catch (error: any) {
      console.error('Fetch deals exception:', error);
      return rejectWithValue(error.message || 'Network error');
    }
  }
);


export const createDeal = createAsyncThunk(
  "deals/createDeal",
  async (dealData: any, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const token = state.auth.token;
      
      if (!token) {
        return rejectWithValue("No authentication token found");
      }

    
      const backendData = {
  dealName: dealData.name,
  dealStage: dealData.stage,
  amount: dealData.amount,
  priority: dealData.priority,
  closeDate: dealData.closeDate,
  leadId: dealData.leadId,
  ownerIds: dealData.ownerIds,
};

      console.log("Sending to backend:", backendData);

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
        const errorText = await response.text();
        console.error("Create deal error:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("Create deal response:", result);

      if (!result.success) {
        throw new Error(result.message || "Failed to create deal");
      }

      return transformDeal(result.data);
    } catch (error: any) {
      console.error('Create deal error:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const updateDeal = createAsyncThunk(
  "deals/updateDeal",
  async ({ id, ...dealData }: any, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const token = state.auth.token;

      if (!token) {
        return rejectWithValue("No authentication token found");
      }

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

      const result = await response.json();

      if (!result.success) {
        throw new Error("Failed to update deal");
      }

      return {
        id,
        ...dealData,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);


export const deleteDeal = createAsyncThunk(
  "deals/deleteDeal",
  async (id: number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const token = state.auth.token;

      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/deal/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error("Failed to delete deal");
      }

      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

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
        state.error = null;
      })
      .addCase(fetchDeals.fulfilled, (state, action) => {
        state.loading = false;
        state.deals = action.payload;
        state.error = null;
      })
      .addCase(fetchDeals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      
      .addCase(createDeal.pending, (state) => {
        state.loading = true;
      })
      .addCase(createDeal.fulfilled, (state, action) => {
        state.loading = false;
        state.deals.unshift(action.payload);
        state.error = null;
      })
      .addCase(createDeal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      
      .addCase(updateDeal.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateDeal.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.deals.findIndex(
          (deal) => deal.id === action.payload.id
        );
        if (index !== -1) {
          state.deals[index] = {
            ...state.deals[index],
            ...action.payload,
          };
        }
        state.error = null;
      })
      .addCase(updateDeal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      
      .addCase(deleteDeal.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteDeal.fulfilled, (state, action) => {
        state.loading = false;
        state.deals = state.deals.filter((d) => d.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteDeal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setLoading, setError, clearError } = dealsSlice.actions;
export default dealsSlice.reducer;