"use client";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import dashboardReducer from "./slices/dashboardSlice";
import leadReducer from "./slices/leadSlice";
import notesReducer from "./slices/activity/notesSlice";
import callsReducer from "./slices/activity/callSlice";
import tasksReducer from "./slices/activity/taskSlice";
import attachmentsReducer from "./slices/activity/attachmentSlice";
import ticketsReducer from "./slices/ticketsSlice";


export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    leads: leadReducer,
    notes: notesReducer,
    calls: callsReducer,
    tasks: tasksReducer,
    attachments: attachmentsReducer,
     
     tickets: ticketsReducer,
     
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
