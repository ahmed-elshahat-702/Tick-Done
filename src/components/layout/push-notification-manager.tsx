"use client";

import { useEffect, useState } from "react";
import {
  subscribeUser,
  unsubscribeUser,
  sendNotification,
} from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } finally {
      setIsLoading(false);
    }
  }

  async function subscribeToPush() {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });
      setSubscription(sub);
      const serializedSub = JSON.parse(JSON.stringify(sub));
      await subscribeUser(serializedSub);
    } finally {
      setIsLoading(false);
    }
  }

  async function unsubscribeFromPush() {
    setIsLoading(true);
    try {
      await subscription?.unsubscribe();
      setSubscription(null);
      await unsubscribeUser();
    } finally {
      setIsLoading(false);
    }
  }

  async function sendTestNotification() {
    if (subscription) {
      setIsLoading(true);
      try {
        await sendNotification(message);
        setMessage("");
      } finally {
        setIsLoading(false);
      }
    }
  }

  if (!isSupported) {
    return (
      <p className="text-destructive text-center">
        Push notifications are not supported in this browser.
      </p>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Push Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : subscription ? (
          <>
            <p className="text-green-600">
              You are subscribed to push notifications.
            </p>
            <Button
              onClick={unsubscribeFromPush}
              variant="destructive"
              className="w-full"
              disabled={isLoading}
            >
              Unsubscribe
            </Button>
            <Input
              type="text"
              placeholder="Enter notification message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full"
              disabled={isLoading}
            />
            <Button
              onClick={sendTestNotification}
              className="w-full"
              disabled={isLoading}
            >
              Send Test
            </Button>
          </>
        ) : (
          <>
            <p className="text-muted-foreground">
              You are not subscribed to push notifications.
            </p>
            <Button
              onClick={subscribeToPush}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              Subscribe
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsIOS(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    );

    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  if (isStandalone) {
    return null; // Don't show install button if already installed
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-6">
      <CardHeader>
        <CardTitle className="text-xl">Install App</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <>
          <Button className="w-full">Add to Home Screen</Button>
          {isIOS && (
            <p className="text-muted-foreground">
              To install this app on your iOS device, tap the share button
              <span role="img" aria-label="share icon" className="mx-1">
                ⎋
              </span>
              and then &quot;Add to Home Screen&quot;
              <span role="img" aria-label="plus icon" className="mx-1">
                ➕
              </span>
              .
            </p>
          )}
        </>
      </CardContent>
    </Card>
  );
}

export default function NotificationPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <PushNotificationManager />
      <InstallPrompt />
    </div>
  );
}
