import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const savedToken =
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

type User = {
  id?: number;
  email: string;
  firstName?: string;
  lastName?: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  error: string | null;
  loading: boolean;
};

const initialState: AuthState = {
  user: null,
  token: savedToken,
  isAuthenticated: !!savedToken,
  error: null,
  loading: false,
};

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);

      localStorage.setItem("token", data.token);

      localStorage.setItem("user", JSON.stringify(data.user));

      return {
        token: data.token,
        user: data.user,
      };
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (payload: any, { rejectWithValue }) => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);

      return data.user;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },

  extraReducers: (b) => {
    b.addCase(loginUser.pending, (s) => {
      s.loading = true;
      s.error = null;
    })
      .addCase(
        loginUser.fulfilled,
        (s, a: PayloadAction<{ token: string; user: User }>) => {
          s.loading = false;
          s.user = a.payload.user;
          s.token = a.payload.token;
          s.isAuthenticated = true;
        }
      )
      .addCase(loginUser.rejected, (s, a: any) => {
        s.loading = false;
        s.error = a.payload;
      });

    b.addCase(registerUser.pending, (s) => {
      s.loading = true;
      s.error = null;
    })
      .addCase(registerUser.fulfilled, (s) => {
        s.loading = false;
      })
      .addCase(registerUser.rejected, (s, a: any) => {
        s.loading = false;
        s.error = a.payload;
      });
  },
});

export const { logout } = slice.actions;
export default slice.reducer;
