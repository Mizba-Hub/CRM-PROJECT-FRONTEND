import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface Owner {
  id: number;
  firstName: string;
  lastName: string;
}

export interface Company {
  id: number;
  domainName: string;
  companyName: string;
  companyOwner: Owner[];
  industryType: string;
  type: string;
  city: string;
  country: string;
  noOfEmployees: number;
  annualRevenue: number;
  phoneNumber: string;
  leadId?: number;
  createdDate: string;
}

interface CompaniesState {
  list: Company[];
  currentCompany: Company | null;
  loading: boolean;
  error: string | null;
}

const initialState: CompaniesState = {
  list: [],
  currentCompany: null,
  loading: false,
  error: null,
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found. Please log in.");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const fetchCompanies = createAsyncThunk<
  Company[],
  void,
  { rejectValue: string }
>("companies/fetchCompanies", async (_, { rejectWithValue }) => {
  try {
    const headers = getAuthHeaders();
    const res = await fetch("http://localhost:5000/api/v1/companies", {
      headers,
    });

    console.log("🔍 [FRONTEND] Fetch response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.log("🔍 [FRONTEND] Fetch error:", errorText);
      return rejectWithValue(`Failed to fetch companies: ${res.status}`);
    }

    const json = await res.json();
    console.log("🔍 [FRONTEND] Full API response:", json);

    const companiesArray = json.data || [];

    console.log(`🔍 [FRONTEND] Processing ${companiesArray.length} companies`);

    return companiesArray.map((c: any) => {
      console.log(
        `🔍 [FRONTEND] Processing company: ${c.id} - ${c.companyName}`
      );
      console.log(`🔍 [FRONTEND] Raw owners data:`, c.Owners);

      const owners: Owner[] = Array.isArray(c.Owners)
        ? c.Owners.map((o: any) => ({
            id: o.id,
            firstName: o.firstName || "",
            lastName: o.lastName || "",
          }))
        : [];

      console.log(`🔍 [FRONTEND] Processed owners:`, owners);

      return {
        id: c.id ?? 0,
        domainName: c.domainName || "",
        companyName: c.companyName || "",
        companyOwner: owners,
        industryType: c.industryType || "",
        type: c.type || "",
        city: c.city || "",
        country: c.country || "",
        noOfEmployees: c.noOfEmployees ?? 0,
        annualRevenue: c.annualRevenue ?? 0,
        phoneNumber: c.phoneNumber || "",
        leadId: c.leadId ? Number(c.leadId) : undefined,
        createdDate: c.createdDate || c.createdAt || "",
      };
    });
  } catch (err: any) {
    console.log("🔍 [FRONTEND] Fetch exception:", err);
    return rejectWithValue(err.message || "Failed to fetch companies");
  }
});

export const createCompany = createAsyncThunk<
  Company,
  Omit<Company, "id" | "createdDate">,
  { rejectValue: string }
>("companies/createCompany", async (company, { rejectWithValue }) => {
  try {
    const headers = getAuthHeaders();

    const ownerIds = company.companyOwner.map((o) => o.id);

    const res = await fetch("http://localhost:5000/api/v1/companies", {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...company,
        companyOwner: undefined,
        ownerIds: ownerIds,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    const json = await res.json();
    console.log("🔍 [FRONTEND] Create response:", json);

    const c = json.data;

    const owners: Owner[] = Array.isArray(c.Owners)
      ? c.Owners.map((o: any) => ({
          id: o.id,
          firstName: o.firstName || "",
          lastName: o.lastName || "",
        }))
      : [];

    return {
      id: c.id ?? 0,
      domainName: c.domainName || "",
      companyName: c.companyName || "",
      companyOwner: owners,
      industryType: c.industryType || "",
      type: c.type || "",
      city: c.city || "",
      country: c.country || "",
      noOfEmployees: c.noOfEmployees ?? 0,
      annualRevenue: c.annualRevenue ?? 0,
      phoneNumber: c.phoneNumber || "",
      leadId: c.leadId ? Number(c.leadId) : undefined,
      createdDate: c.createdDate || c.createdAt || "",
    };
  } catch (err: any) {
    console.log("🔍 [FRONTEND] Create error:", err);
    return rejectWithValue(err.message || "Failed to create company");
  }
});

export const updateCompany = createAsyncThunk<
  Company,
  Company,
  { rejectValue: string }
>("companies/updateCompany", async (company, { rejectWithValue }) => {
  try {
    const headers = getAuthHeaders();

    const ownerIds = company.companyOwner.map((o) => o.id);

    const res = await fetch(
      `http://localhost:5000/api/v1/companies/${company.id}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          ...company,
          companyOwner: undefined,
          ownerIds: ownerIds,
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    const json = await res.json();
    const c = json.data;

    const owners: Owner[] = Array.isArray(c.Owners)
      ? c.Owners.map((o: any) => ({
          id: o.id,
          firstName: o.firstName || "",
          lastName: o.lastName || "",
        }))
      : [];

    return {
      id: c.id ?? 0,
      domainName: c.domainName || "",
      companyName: c.companyName || "",
      companyOwner: owners,
      industryType: c.industryType || "",
      type: c.type || "",
      city: c.city || "",
      country: c.country || "",
      noOfEmployees: c.noOfEmployees ?? 0,
      annualRevenue: c.annualRevenue ?? 0,
      phoneNumber: c.phoneNumber || "",
      leadId: c.leadId ? Number(c.leadId) : undefined,
      createdDate: c.createdDate || c.createdAt || "",
    };
  } catch (err: any) {
    return rejectWithValue(err.message || "Failed to update company");
  }
});

export const deleteCompany = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("companies/deleteCompany", async (id, { rejectWithValue }) => {
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`http://localhost:5000/api/v1/companies/${id}`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok) return rejectWithValue("Failed to delete company");
    return id;
  } catch (err: any) {
    return rejectWithValue(err.message || "Failed to delete company");
  }
});

const companySlice = createSlice({
  name: "companies",
  initialState,
  reducers: {
    setCurrent(state, action: PayloadAction<Company | null>) {
      state.currentCompany = action.payload;
    },
    clearCurrent(state) {
      state.currentCompany = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
        console.log("🔍 [REDUX] Companies loaded:", action.payload.length);
        if (action.payload.length > 0) {
          console.log(
            "🔍 [REDUX] First company owners:",
            action.payload[0].companyOwner
          );
        }
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch companies";
      })
      .addCase(createCompany.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateCompany.fulfilled, (state, action) => {
        const idx = state.list.findIndex((c) => c.id === action.payload.id);
        if (idx >= 0) state.list[idx] = action.payload;
      })
      .addCase(deleteCompany.fulfilled, (state, action) => {
        state.list = state.list.filter((c) => c.id !== action.payload);
      });
  },
});

export const { setCurrent, clearCurrent } = companySlice.actions;
export default companySlice.reducer;
