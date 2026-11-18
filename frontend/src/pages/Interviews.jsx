// Global Imports
import React, { useEffect, useState } from "react";
import { CalendarClock, ExternalLink, MapPin, Phone, Video } from "lucide-react";
import moment from "moment";
import toast from "react-hot-toast";

// Local Imports
import DashboardLayout from "../components/layout/DashboardLayout";
import Navbar from "../components/layout/Navbar";
import { useAuth } from "../context/AuthContext";
import { NOTIFICATION_EVENT } from "../hooks/useNotifications";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

const MODE_ICONS = { Video, Phone, "In person": MapPin };

// Interviews for both roles: candidates pick a slot, employers see who picked what.
const Interviews = () => {
  const { user } = useAuth();
  const isEmployer = user?.role === "employer";
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await axiosInstance.get(API_PATHS.INTERVIEWS.GET);
      setInterviews(data);
    } catch {
      toast.error("Could not load interviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const refresh = (e) => e.detail?.type === "interview" && load();
    window.addEventListener(NOTIFICATION_EVENT, refresh);
    return () => window.removeEventListener(NOTIFICATION_EVENT, refresh);
  }, []);

  const act = async (request, success) => {
    try {
      await request;
      toast.success(success);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong. Try again.");
    }
  };

  const proposed = interviews.filter((i) => i.status === "Proposed");
  const upcoming = interviews.filter((i) => i.status === "Confirmed" && moment(i.scheduledAt).isAfter(moment().subtract(2, "hours")));
  const past = interviews.filter((i) => i.status === "Confirmed" && !upcoming.includes(i));

  const Card = ({ interview }) => {
    const Icon = MODE_ICONS[interview.mode] || CalendarClock;
    const other = isEmployer ? interview.candidate?.name : interview.employer?.companyName || interview.employer?.name;
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">{interview.job?.title}</p>
            <p className="text-sm text-gray-600 mt-0.5">
              {isEmployer ? "Candidate" : "With"}: {other}
            </p>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5" /> {interview.mode} · {interview.durationMins} min
            </p>
          </div>
          {interview.scheduledAt && (
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-gray-900">{moment(interview.scheduledAt).format("ddd, D MMM")}</p>
              <p className="text-sm text-navy-900 font-semibold">{moment(interview.scheduledAt).format("h:mm A")}</p>
            </div>
          )}
        </div>

        {interview.note && <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 mt-3 whitespace-pre-wrap">{interview.note}</p>}

        {interview.status === "Proposed" && !isEmployer && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Pick a time that works for you:</p>
            <div className="flex flex-wrap gap-2">
              {interview.slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => act(axiosInstance.post(API_PATHS.INTERVIEWS.CONFIRM(interview._id), { slot }), "Interview confirmed")}
                  className="px-3 py-2 rounded-xl border border-sand bg-saffron-100 text-navy-900 text-sm font-medium hover:bg-navy-800 hover:text-white transition-colors"
                >
                  {moment(slot).format("ddd D MMM, h:mm A")}
                </button>
              ))}
            </div>
          </div>
        )}
        {interview.status === "Proposed" && isEmployer && (
          <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-3 py-2 mt-3">
            Waiting for the candidate to pick one of {interview.slots.length} slot{interview.slots.length > 1 ? "s" : ""}.
          </p>
        )}

        <div className="flex items-center gap-3 mt-4">
          {interview.status === "Confirmed" && interview.location && (
            /^https?:\/\//.test(interview.location) ? (
              <a href={interview.location} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-semibold text-white bg-navy-900 px-4 py-2 rounded-xl">
                Join <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <span className="text-sm text-gray-700">{interview.location}</span>
            )
          )}
          {interview.status !== "Cancelled" && moment(interview.scheduledAt || interview.slots.at(-1)).isAfter(moment()) && (
            <button
              onClick={() => window.confirm("Cancel this interview?") && act(axiosInstance.post(API_PATHS.INTERVIEWS.CANCEL(interview._id)), "Interview cancelled")}
              className="text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  };

  const Section = ({ title, list, empty }) => (
    <section className="mb-8">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h2>
      {list.length ? (
        <div className="grid gap-4 md:grid-cols-2">{list.map((i) => <Card key={i._id} interview={i} />)}</div>
      ) : (
        <p className="text-sm text-gray-500">{empty}</p>
      )}
    </section>
  );

  const content = (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
      <p className="text-gray-600 text-sm mt-1 mb-6">
        {isEmployer ? "Interviews you scheduled from the Applicants page." : "Interview invitations from employers. Pick a time and you're set."}
      </p>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <>
          <Section title={isEmployer ? "Waiting for a reply" : "Pick a time"} list={proposed} empty="Nothing waiting." />
          <Section title="Upcoming" list={upcoming} empty="No upcoming interviews." />
          {past.length > 0 && <Section title="Past" list={past} empty="" />}
        </>
      )}
    </div>
  );

  return isEmployer ? (
    <DashboardLayout activeMenu="interviews">{content}</DashboardLayout>
  ) : (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">{content}</div>
    </div>
  );
};

export default Interviews;
