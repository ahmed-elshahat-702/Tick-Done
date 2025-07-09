"use server";
import webpush from "web-push";
import { User } from "@/models/User";
import { auth } from "@/app/auth";

webpush.setVapidDetails(
  "mailto:ahmedelshahat702@gmail.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function subscribeUser(serializedSubscription: any) {
  const session = await auth();
  if (!session?.user || !session.user.id) {
    return { error: "Unauthorized" };
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return { error: "User not found" };
  }

  try {
    await User.updateOne(
      { email: session.user.email },
      { $set: { pushSubscription: serializedSubscription } }
    );
    return { success: true };
  } catch (error) {
    console.error("Subscription error:", error);
    return { error: "Failed to subscribe" };
  }
}

export async function unsubscribeUser() {
  const session = await auth();
  if (!session?.user || !session.user.id) {
    return { error: "Unauthorized" };
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return { error: "User not found" };
  }

  try {
    await User.updateOne(
      { email: session.user.email },
      { $unset: { pushSubscription: "" } }
    );
    return { success: true };
  } catch (error) {
    console.error("Unsubscription error:", error);
    return { error: "Failed to unsubscribe" };
  }
}

export async function sendNotification(message: string, time: string) {
  const session = await auth();
  if (!session?.user || !session.user.id) {
    return { error: "Unauthorized" };
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return { error: "User not found" };
  }

  if (!user.pushSubscription) {
    return { error: "No subscription found for user" };
  }

  try {
    await webpush.sendNotification(
      user.pushSubscription,
      JSON.stringify({
        title: "Pomodoro Timer",
        body: `${message} - Time: ${time}`,
        icon: "/icon.png",
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Push error:", error);
    return { error: "Failed to send notification" };
  }
}

// Schedule a notification to be sent at a specific time
export async function scheduleEndNotification(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serializedSubscription: any,
  endTime: number, // Timestamp in ms
  isWorkSession: boolean
) {
  const session = await auth();
  if (!session?.user || !session.user.id) {
    return { error: "Unauthorized" };
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return { error: "User not found" };
  }

  try {
    // Store the subscription and schedule info
    await User.updateOne(
      { email: session.user.email },
      {
        $set: {
          pushSubscription: serializedSubscription,
          scheduledNotification: {
            endTime,
            message: isWorkSession
              ? "Work session complete!"
              : "Break complete!",
          },
        },
      }
    );
    return { success: true };
  } catch (error) {
    console.error("Schedule notification error:", error);
    return { error: "Failed to schedule notification" };
  }
}
