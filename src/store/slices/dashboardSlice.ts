import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const fetchDashboard = createAsyncThunk<
  any,
  void,
  { rejectValue: string }
>("dashboard/fetchDashboard", async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${BASE_URL}/api/v1/dashboard`, {
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
});

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    stats: {
      totalLeads: 0,
      activeDeals: 0,
      closedDeals: 0,
      monthlyRevenue: 0,
    },
    conversion: [],
    sales: [],
    team: [],
    loading: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false;

        const d = action.payload;

        state.stats = {
          totalLeads: d.totalLeads ?? 0,
          activeDeals: d.ActiveDeals ?? 0,
          closedDeals: d.ClosedDeals ?? 0,
          monthlyRevenue: d.MonthlyRevenue ?? 0,
        };

        state.conversion =
          d.conversionData?.map((c: any) => ({
            label: c.label,
            percent: c.percent,
          })) ?? [];

        state.sales =
          d.salesReports?.map((s: any) => ({
            m: s.m,
            base: s.base,
            cap: s.cap,
          })) ?? [];

        state.team =
          d.teamPerformance?.map((t: any) => ({
            employee: t.employee,
            activeDeals: t.activeDeals,
            closedDeals: t.closedDeals,
            revenue: t.revenue,
          })) ?? [];
      })

      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load dashboard";
      });
  },
});

export default dashboardSlice.reducer;
