import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type User = {
  email: string;
  firstName?: string;
  lastName?: string;
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  error: string | null;
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = action.payload;
    },
    registerFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    registerSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.error = null;
    },
  },
});

export const { loginSuccess, loginFailure, registerFailure, registerSuccess } =
  authSlice.actions;
export default authSlice.reducer;
