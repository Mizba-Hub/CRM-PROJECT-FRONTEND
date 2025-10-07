"use client";

import React, { useEffect, useState } from "react";

type NotificationType = "success" | "error" | "info";

interface NotificationProps {
  message: string;
  type: NotificationType;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  duration = 3000,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500";

  return (
    <div
      className={`fixed top-4 right-4 px-4 py-2 rounded-lg text-white shadow-lg ${bgColor} animate-slide-in z-[9999]`}
    >
      {message}
    </div>
  );
};

export default Notification;
