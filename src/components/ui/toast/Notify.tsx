import React from "react";
import ReactDOM from "react-dom/client";
import Notification from "@/components/ui/toast/Notification";

type NotificationType = "success" | "error" | "info";

export const notify = (message: string, type: NotificationType, duration = 3000) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);

  root.render(<Notification message={message} type={type} duration={duration} />);

  
  setTimeout(() => {
    root.unmount();
    container.remove();
  }, duration + 100); 
};

