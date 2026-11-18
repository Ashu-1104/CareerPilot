import React, { useEffect, useRef, useState } from "react";
import { Bell, Briefcase, CalendarClock, MessageSquare, RefreshCw } from "lucide-react";
import moment from "moment";
import { useNavigate } from "react-router-dom";

import { useNotifications } from "../hooks/useNotifications";

const ICONS = { application: Briefcase, status: RefreshCw, message: MessageSquare, interview: CalendarClock };

const NotificationBell = () => {
  const { items, unread, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        className="p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200 relative"
        onClick={() => {
          setOpen(!open);
          if (!open && unread) markAllRead();
        }}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
      >
        <Bell className="h-5 w-5 text-gray-500" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900 text-sm">Notifications</div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">You're all caught up.</p>
            ) : (
              items.map((n) => {
                const Icon = ICONS[n.type] || Bell;
                return (
                  <button
                    key={n._id}
                    onClick={() => {
                      setOpen(false);
                      if (n.link) navigate(n.link);
                    }}
                    className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 border-b border-gray-50 ${n.read ? "" : "bg-blue-50/50"}`}
                  >
                    <Icon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-gray-900">{n.title}</span>
                      {n.body && <span className="block text-xs text-gray-600 mt-0.5 line-clamp-2">{n.body}</span>}
                      <span className="block text-[11px] text-gray-400 mt-1">{moment(n.createdAt).fromNow()}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
