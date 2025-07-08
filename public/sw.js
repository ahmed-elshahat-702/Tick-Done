self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  if (event.action === "pause") {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) =>
          client.postMessage({ type: "PAUSE_TIMER" })
        );
      })
    );
  } else if (event.action === "cancel") {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) =>
          client.postMessage({ type: "RESET_TIMER" })
        );
      })
    );
  } else {
    event.waitUntil(clients.openWindow("/"));
  }
});
