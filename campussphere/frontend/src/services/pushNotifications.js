import api from "./api";

function decodeApplicationServerKey(value) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

export async function enablePushNotifications() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    throw new Error("Push notifications are not supported by this browser.");
  }
  const { data: preferences } = await api.get("/notifications/preferences/");
  if (!preferences.push_public_key) {
    throw new Error("Browser push is not configured by the portal administrator.");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Allow notifications in browser settings to enable push alerts.");

  const registration = await navigator.serviceWorker.register("/sw.js");
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: decodeApplicationServerKey(preferences.push_public_key),
  });
  await api.post("/notifications/push-subscriptions/", subscription.toJSON());
  await api.patch("/notifications/preferences/", { push_enabled: true });
}

export async function disablePushNotifications() {
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration("/");
    const subscription = await registration?.pushManager?.getSubscription();
    if (subscription) {
      await api.delete("/notifications/push-subscriptions/", { data: { endpoint: subscription.endpoint } });
      await subscription.unsubscribe();
    } else {
      await api.delete("/notifications/push-subscriptions/");
    }
  }
  await api.patch("/notifications/preferences/", { push_enabled: false });
}
