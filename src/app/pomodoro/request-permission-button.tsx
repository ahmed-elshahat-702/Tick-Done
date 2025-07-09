"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const RequestPermissionButton = () => {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  const handleEnable = async () => {
    if (!("Notification" in window)) {
      alert("Notifications are not supported in this browser.");
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted") {
      new Notification("✅ You’re subscribed to notifications!");
    } else if (result === "denied") {
      alert("❌ Notification permission was denied.");
    }
  };

  return (
    <Button onClick={handleEnable}>
      {permission === "granted" ? "✅ Enabled" : "🔔 Enable Notifications"}
    </Button>
  );
};

export default RequestPermissionButton;
