import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS, BASE_URL } from "../utils/apiPaths";

// Other parts of the app (an open chat, the interviews page) listen for this
// to refresh when something relevant arrives.
export const NOTIFICATION_EVENT = "careerpilot:notification";

// Notifications list + live updates over Server-Sent Events. The stream is
// opened with a short-lived ticket and reopened (with a fresh ticket) when the
// server ends it, as it does every few minutes on serverless hosting.
export const useNotifications = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const sourceRef = useRef(null);
  const retryRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.NOTIFICATIONS.GET);
      setItems(response.data.items);
      setUnread(response.data.unread);
    } catch {
      // the bell stays empty; nothing else depends on it
    }
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    let stopped = false;
    load();

    const open = async () => {
      try {
        const { data } = await axiosInstance.post(API_PATHS.NOTIFICATIONS.STREAM_TICKET);
        if (stopped) return;
        const source = new EventSource(BASE_URL + API_PATHS.NOTIFICATIONS.STREAM(data.ticket));
        sourceRef.current = source;
        source.addEventListener("notification", (e) => {
          const n = JSON.parse(e.data);
          setItems((prev) => [n, ...prev.filter((p) => p._id !== n._id)].slice(0, 30));
          setUnread((u) => u + 1);
          window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, { detail: n }));
          // an open chat shows its own messages; no need to toast those
          if (!(n.type === "message" && document.querySelector(`[data-chat="${n.data?.applicationId}"]`))) {
            toast(n.title, { icon: "🔔" });
          }
        });
        source.onerror = () => {
          // tickets expire after 2 minutes, so reconnect with a fresh one
          source.close();
          if (!stopped) retryRef.current = setTimeout(open, 3000);
        };
      } catch {
        if (!stopped) retryRef.current = setTimeout(open, 10000);
      }
    };
    open();

    return () => {
      stopped = true;
      clearTimeout(retryRef.current);
      sourceRef.current?.close();
    };
  }, [user, load]);

  const markAllRead = async () => {
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await axiosInstance.post(API_PATHS.NOTIFICATIONS.READ).catch(() => {});
  };

  return { items, unread, markAllRead };
};
