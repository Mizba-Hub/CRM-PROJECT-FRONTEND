"use client";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import dashboardReducer from "./slices/dashboardSlice";
import leadReducer from "./slices/leadSlice";
import notesReducer from "./slices/activity/notesSlice";
import callsReducer from "./slices/activity/callSlice";
import tasksReducer from "./slices/activity/taskSlice";
import emailsReducer from "./slices/activity/emailSlice";
import attachmentsReducer from"./slices/activity/attachmentSlice";
import companyReducer from "./slices/companySlice";
// import meetingReducer from "./slices/activity/meetingSlice";


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
    emails: emailsReducer,
    companies: companyReducer,
      // meetings: meetingReducer,
     tickets: ticketsReducer,
     

  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
