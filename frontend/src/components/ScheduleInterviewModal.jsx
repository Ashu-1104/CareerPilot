import React, { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import moment from "moment";
import toast from "react-hot-toast";

import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

// Employer offers 1 to 5 time slots; the candidate picks one on their Interviews page.
const ScheduleInterviewModal = ({ application, onClose, onScheduled }) => {
  const tomorrow = moment().add(1, "day").hour(11).minute(0).format("YYYY-MM-DDTHH:mm");
  const [slots, setSlots] = useState([tomorrow]);
  const [form, setForm] = useState({ mode: "Video", durationMins: 30, location: "", note: "" });
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axiosInstance.post(API_PATHS.INTERVIEWS.PROPOSE, {
        applicationId: application._id,
        slots: slots.filter(Boolean).map((s) => new Date(s).toISOString()),
        ...form,
        durationMins: Number(form.durationMins),
      });
      toast.success("Interview slots sent to the candidate");
      onScheduled?.();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not schedule. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const input = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200";

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Schedule an interview</h2>
            <p className="text-sm text-gray-500">
              {application.applicant?.name} · {application.job?.title}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100" aria-label="Close">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Time slots to offer</p>
          {slots.map((slot, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="datetime-local"
                required
                min={moment().format("YYYY-MM-DDTHH:mm")}
                className={input}
                value={slot}
                onChange={(e) => setSlots((prev) => prev.map((s, j) => (j === i ? e.target.value : s)))}
              />
              {slots.length > 1 && (
                <button type="button" onClick={() => setSlots((prev) => prev.filter((_, j) => j !== i))} className="p-2 rounded-xl hover:bg-red-50" aria-label="Remove slot">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              )}
            </div>
          ))}
          {slots.length < 5 && (
            <button type="button" onClick={() => setSlots((prev) => [...prev, ""])} className="flex items-center gap-1.5 text-sm text-blue-600 font-medium">
              <Plus className="w-4 h-4" /> Add another slot
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-gray-700">
            Type
            <select className={`${input} mt-1`} value={form.mode} onChange={set("mode")}>
              <option>Video</option>
              <option>Phone</option>
              <option>In person</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Duration
            <select className={`${input} mt-1`} value={form.durationMins} onChange={set("durationMins")}>
              {[15, 30, 45, 60, 90].map((m) => (
                <option key={m} value={m}>{m} minutes</option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-sm font-medium text-gray-700">
          {form.mode === "Video" ? "Meeting link" : form.mode === "Phone" ? "Phone number" : "Address"}
          <input className={`${input} mt-1`} value={form.location} onChange={set("location")} />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Note for the candidate
          <textarea className={`${input} mt-1`} rows={3} value={form.note} onChange={set("note")} placeholder="Who they will meet, what to prepare..." />
        </label>

        <div className="flex justify-end">
          <button disabled={saving} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60">
            {saving ? "Sending..." : "Send invitation"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScheduleInterviewModal;
