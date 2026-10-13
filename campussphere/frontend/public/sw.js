self.addEventListener("push", (event) => {
  if (!event.data) return;
  const payload = event.data.json();
  event.waitUntil(self.registration.showNotification(payload.title || "CampusSphere", {
    body: payload.body || "You have an event reminder.",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: payload.tag || `campussphere-${payload.url || "notification"}`,
    data: { url: payload.url || "/" },
    vibrate: payload.vibrate || [150, 70, 150],
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    if ("vibrate" in self.navigator) self.navigator.vibrate([150, 70, 150]);
    const requestedUrl = new URL(event.notification.data?.url || "/", self.location.origin);
    const url = requestedUrl.origin === self.location.origin ? requestedUrl.href : `${self.location.origin}/`;
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if (client.url.startsWith(self.location.origin) && "focus" in client) {
        await client.navigate(url);
        await client.focus();
        return;
      }
    }
    await self.clients.openWindow(url);
  })());
});
