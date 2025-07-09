// scripts/sendScheduledNotifications.ts
import { User } from "@/models/User";
import webpush from "web-push";
import cron from "node-cron";

webpush.setVapidDetails(
  "mailto:ahmedelshahat702@gmail.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

async function sendScheduledNotifications() {
  const now = Date.now();
  const users = await User.find({
    "scheduledNotification.endTime": { $lte: now },
    pushSubscription: { $exists: true },
  });

  for (const user of users) {
    try {
      await webpush.sendNotification(
        user.pushSubscription,
        JSON.stringify({
          title: "Pomodoro Timer",
          body: `${user.scheduledNotification.message} - Time: 00:00`,
          icon: "/icon.png",
        })
      );
      await User.updateOne(
        { _id: user._id },
        { $unset: { scheduledNotification: "" } }
      );
    } catch (error) {
      console.error(
        `Failed to send notification to user ${user.email}:`,
        error
      );
    }
  }
}

// Run every minute
cron.schedule("* * * * *", sendScheduledNotifications);

// Start the script
sendScheduledNotifications().catch(console.error);
