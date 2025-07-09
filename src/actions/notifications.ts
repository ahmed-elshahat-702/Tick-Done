"use server";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:ahmedelshahat702@gmail.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

let subscription: PushSubscription | null = null;

export async function subscribeUser(sub: PushSubscription) {
  subscription = sub;
  return { success: true };
}

export async function unsubscribeUser() {
  subscription = null;
  return { success: true };
}

export async function sendNotification(message: string) {
  if (!subscription) throw new Error("No subscription");
  try {
    await webpush.sendNotification(
      // @ts-expect-error: convert browser PushSubscription to web-push type

      subscription,
      JSON.stringify({
        title: "New Notification",
        body: message,
        icon: "/icon.png",
      })
    );
    return { success: true };
  } catch (e) {
    console.error("Push error", e);
    return { success: false, error: "Failed to send" };
  }
}
