// public/custom-sw-events.js
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "pause" || event.action === "cancel") {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: event.action === "pause" ? "PAUSE_TIMER" : "RESET_TIMER",
          });
        });
      })
    );
  } else {
    event.waitUntil(self.clients.openWindow("/"));
  }
});
