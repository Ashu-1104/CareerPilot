import React, { useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import moment from "moment";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import { NOTIFICATION_EVENT } from "../hooks/useNotifications";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

// Chat between the employer and the candidate about one application.
// New messages arrive through the live notification stream.
const ChatDrawer = ({ applicationId, title, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [job, setJob] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await axiosInstance.get(API_PATHS.MESSAGES(applicationId));
      setMessages(data.messages);
      setJob(data.job);
    } catch {
      toast.error("Could not load messages.");
    }
  };

  useEffect(() => {
    load();
    const onNotification = (e) => {
      if (e.detail?.type === "message" && e.detail.data?.applicationId === applicationId) load();
    };
    window.addEventListener(NOTIFICATION_EVENT, onNotification);
    return () => window.removeEventListener(NOTIFICATION_EVENT, onNotification);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const { data } = await axiosInstance.post(API_PATHS.MESSAGES(applicationId), { text });
      setMessages((prev) => [...prev, data]);
      setText("");
    } catch {
      toast.error("Message not sent. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/30 flex justify-end" onClick={onClose}>
      <div
        data-chat={applicationId}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl"
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{title}</p>
            <p className="text-xs text-gray-500 truncate">{job}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100" aria-label="Close chat">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
          {messages.length === 0 && (
            <p className="text-center text-sm text-gray-500 mt-10">No messages yet. Say hello!</p>
          )}
          {messages.map((m) => {
            const mine = m.sender?._id === user?._id;
            return (
              <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    mine ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-sm" : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <p className={`text-[10px] mt-1 ${mine ? "text-blue-100" : "text-gray-400"}`}>
                    {moment(m.createdAt).format("DD MMM, h:mm a")}
                    {mine && m.readAt ? " · Seen" : ""}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="p-3 border-t border-gray-100 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            placeholder="Write a message..."
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button
            disabled={sending || !text.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl px-4 disabled:opacity-50"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatDrawer;
