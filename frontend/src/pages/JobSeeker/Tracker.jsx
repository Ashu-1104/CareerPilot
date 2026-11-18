// Global Imports
import React, { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  BellRing,
  Building2,
  ExternalLink,
  MapPin,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import moment from "moment";
import toast from "react-hot-toast";

// Local Imports
import Navbar from "../../components/layout/Navbar";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

// Column colours, in board order
const STAGE_STYLES = {
  Saved: { dot: "bg-gray-400", ring: "ring-gray-300" },
  Applied: { dot: "bg-navy-900", ring: "ring-saffron-400" },
  Interview: { dot: "bg-amber-500", ring: "ring-amber-300" },
  Offer: { dot: "bg-green-500", ring: "ring-green-300" },
  Rejected: { dot: "bg-red-400", ring: "ring-red-300" },
};

const isDue = (item) =>
  item.followUpAt &&
  moment(item.followUpAt).isSameOrBefore(moment(), "day") &&
  !["Offer", "Rejected"].includes(item.stage);

const TrackerCard = ({ item, onOpen }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item._id });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(item)}
      className={`bg-white rounded-xl border border-gray-200 p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragging ? "shadow-xl z-50 relative opacity-90" : ""
      }`}
    >
      <p className="font-semibold text-gray-900 text-sm leading-snug">{item.title}</p>
      {item.company && (
        <p className="text-xs text-gray-600 mt-1 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          {item.company}
        </p>
      )}
      {item.location && (
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          {item.location}
        </p>
      )}
      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
        <span>{moment(item.updatedAt).fromNow()}</span>
        {item.followUpAt && (
          <span
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
              isDue(item) ? "bg-red-50 text-red-600 font-semibold" : "bg-gray-100"
            }`}
          >
            <BellRing className="w-3 h-3" />
            {moment(item.followUpAt).format("DD MMM")}
          </span>
        )}
      </div>
    </div>
  );
};

const Column = ({ stage, items, onOpen }) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={`bg-gray-50/80 rounded-2xl p-3 min-h-[200px] transition-all ${
        isOver ? `ring-2 ${STAGE_STYLES[stage].ring} bg-white` : ""
      }`}
    >
      <div className="flex items-center justify-between px-1 mb-3">
        <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${STAGE_STYLES[stage].dot}`} />
          {stage}
        </h3>
        <span className="text-xs text-gray-500 bg-white border border-gray-200 rounded-full px-2">
          {items.length}
        </span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <TrackerCard key={item._id} item={item} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
};

const emptyForm = { title: "", company: "", location: "", url: "", stage: "Applied", notes: "", followUpAt: "" };

// Add a job from another site, or edit / move / delete a tracked one
const TrackerModal = ({ item, stages, onClose, onSaved }) => {
  const [form, setForm] = useState(() =>
    item
      ? { ...emptyForm, ...item, followUpAt: item.followUpAt ? moment(item.followUpAt).format("YYYY-MM-DD") : "" }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        title: form.title,
        company: form.company,
        location: form.location,
        url: form.url,
        stage: form.stage,
        notes: form.notes,
        followUpAt: form.followUpAt || null,
      };
      if (item) await axiosInstance.patch(API_PATHS.TRACKER.UPDATE(item._id), body);
      else await axiosInstance.post(API_PATHS.TRACKER.ADD, body);
      toast.success(item ? "Saved" : "Added to your tracker");
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Remove this job from your tracker?")) return;
    try {
      await axiosInstance.delete(API_PATHS.TRACKER.DELETE(item._id));
      toast.success("Removed");
      onSaved();
    } catch {
      toast.error("Could not remove. Try again.");
    }
  };

  const input = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400";

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{item ? "Tracked job" : "Add a job you applied to"}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100" aria-label="Close">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <label className="block text-sm font-medium text-gray-700">
          Job title
          <input className={`${input} mt-1`} required value={form.title} onChange={set("title")} placeholder="e.g. Frontend Developer" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-gray-700">
            Company
            <input className={`${input} mt-1`} value={form.company} onChange={set("company")} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Location
            <input className={`${input} mt-1`} value={form.location} onChange={set("location")} />
          </label>
        </div>
        <label className="block text-sm font-medium text-gray-700">
          Job link
          <input className={`${input} mt-1`} type="url" value={form.url} onChange={set("url")} placeholder="https://" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-gray-700">
            Stage
            <select className={`${input} mt-1`} value={form.stage} onChange={set("stage")}>
              {stages.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Follow up on
            <input className={`${input} mt-1`} type="date" value={form.followUpAt} onChange={set("followUpAt")} />
          </label>
        </div>
        <label className="block text-sm font-medium text-gray-700">
          Notes
          <textarea className={`${input} mt-1`} rows={4} value={form.notes} onChange={set("notes")} placeholder="Recruiter name, interview rounds, salary discussed..." />
        </label>

        {item?.history?.length > 0 && (
          <div className="text-xs text-gray-500">
            <p className="font-semibold text-gray-700 mb-1">History</p>
            {item.history.map((h, i) => (
              <p key={i}>
                {h.stage} · {moment(h.at).format("DD MMM YYYY, h:mm a")}
              </p>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            {item && (
              <button type="button" onClick={remove} className="flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl">
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            )}
            {form.url && (
              <a href={form.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-navy-900 hover:bg-saffron-100 px-3 py-2 rounded-xl">
                <ExternalLink className="w-4 h-4" /> Open job
              </a>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-navy-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60"
          >
            {saving ? "Saving..." : item ? "Save" : "Add job"}
          </button>
        </div>
      </form>
    </div>
  );
};

const Tracker = () => {
  const [data, setData] = useState({ items: [], stages: Object.keys(STAGE_STYLES), stats: null });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null, "new" or a tracked job

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  const load = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.TRACKER.GET);
      setData(response.data);
    } catch {
      toast.error("Could not load your tracker.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const byStage = useMemo(
    () => Object.fromEntries(data.stages.map((s) => [s, data.items.filter((i) => i.stage === s)])),
    [data]
  );

  // Drop a card on a column: move it there right away, then save
  const onDragEnd = async ({ active, over }) => {
    const item = data.items.find((i) => i._id === active.id);
    if (!item || !over || over.id === item.stage) return;
    const previous = data.items;
    setData((d) => ({ ...d, items: d.items.map((i) => (i._id === item._id ? { ...i, stage: over.id } : i)) }));
    try {
      await axiosInstance.patch(API_PATHS.TRACKER.UPDATE(item._id), { stage: over.id });
      load();
    } catch {
      setData((d) => ({ ...d, items: previous }));
      toast.error("Could not move the job. Try again.");
    }
  };

  const stats = data.stats;

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Application Tracker</h1>
            <p className="text-gray-600 text-sm mt-1">
              Every job you are going for, from CareerPilot or anywhere else. Drag a card to move it.
            </p>
          </div>
          <button
            onClick={() => setModal("new")}
            className="flex items-center justify-center gap-2 bg-navy-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm"
          >
            <Plus className="w-4 h-4" /> Add job
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              ["Tracked", stats.total],
              ["Applied", stats.applied],
              ["Interview rate", `${stats.interviewRate}%`],
              ["Offer rate", `${stats.offerRate}%`],
              ["Follow-ups due", stats.followUpsDue],
            ].map(([label, value]) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">{label}</p>
                <p className={`text-xl font-bold mt-1 ${label === "Follow-ups due" && value > 0 ? "text-red-600" : "text-gray-900"}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : !data.items.length ? (
          <div className="text-center py-16 bg-white/60 rounded-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Nothing tracked yet</h3>
            <p className="text-gray-600 text-sm mt-2">
              Jobs you apply to on CareerPilot appear here automatically. Add jobs from other sites with "Add job".
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {data.stages.map((stage) => (
                <Column key={stage} stage={stage} items={byStage[stage] || []} onOpen={setModal} />
              ))}
            </div>
          </DndContext>
        )}
      </div>

      {modal && (
        <TrackerModal
          item={modal === "new" ? null : modal}
          stages={data.stages}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </div>
  );
};

export default Tracker;
