// Global Imports
import React from "react";
import { Bookmark, ExternalLink, MapPin } from "lucide-react";
import moment from "moment";

// Local Imports
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../StatusBadge";
import MatchRing from "../MatchRing";
import { formatSalary, trackExternalApply } from "../../utils/helper";

const initialsOf = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

// A job in the list (Design B). Imported jobs open the company's site to apply.
const JobCard = ({ job, onClick, onToggleSave, onApply, saved, hideApply }) => {
  const { user } = useAuth();
  const isExternal = job?.source && job.source !== "careerpilot";
  const company = job?.company?.companyName || job?.company?.name || "";
  const isSeeker = user?.role === "jobSeeker";

  return (
    <article
      className="bg-white rounded-[20px] border border-sand p-5 flex flex-col gap-4 cursor-pointer hover:shadow-lg hover:shadow-sand transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        {job?.company?.companyLogo ? (
          <img src={job.company.companyLogo} alt="" className="w-12 h-12 rounded-[14px] object-cover bg-white border border-sand" />
        ) : (
          <span className="w-12 h-12 rounded-[14px] bg-navy-900 text-white font-display font-bold flex items-center justify-center">
            {initialsOf(company)}
          </span>
        )}
        <div className="flex items-center gap-1">
          {isSeeker && <MatchRing score={job?.match?.score} />}
          {user && (
            <button
              className="w-11 h-11 rounded-full hover:bg-sand/60 flex items-center justify-center"
              aria-label={job?.isSaved || saved ? "Remove from saved jobs" : "Save job"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave();
              }}
            >
              <Bookmark className={`w-5 h-5 ${job?.isSaved || saved ? "fill-navy-900 text-navy-900" : "text-stone-400"}`} />
            </button>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <h3 className="text-lg font-bold text-stone-900 leading-snug">{job.title}</h3>
        <p className="text-sm text-stone-600 mt-1 flex items-center gap-1.5 min-w-0">
          <span className="truncate">{company}</span>
          {job?.location && (
            <>
              <span aria-hidden="true">·</span>
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{job.location}</span>
            </>
          )}
        </p>
      </div>

      <div className="flex gap-1.5 flex-wrap text-xs font-medium">
        {job?.type && <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full">{job.type}</span>}
        <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full">{formatSalary(job?.salaryMin, job?.salaryMax)}</span>
        {job?.category && <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full">{job.category}</span>}
      </div>

      <div className="mt-auto pt-4 border-t border-dashed border-sand-dark flex items-center justify-between gap-3">
        <span className="text-xs text-stone-500 min-w-0 leading-snug line-clamp-2">
          {isExternal ? `via ${job?.sourceInfo?.name}` : "Posted on CareerPilot"}
          {" · "}
          {moment(job?.postedAt || job?.createdAt).fromNow()}
        </span>
        {!saved &&
          (job?.applicationStatus ? (
            <StatusBadge status={job.applicationStatus} />
          ) : hideApply ? null : isExternal ? (
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                if (isSeeker) trackExternalApply(job._id);
              }}
              className="flex-shrink-0 h-11 px-4 rounded-full bg-navy-900 text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-navy-800"
            >
              Apply on site <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <button
              className="flex-shrink-0 h-11 px-4 rounded-full bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800"
              onClick={(e) => {
                e.stopPropagation();
                onApply();
              }}
            >
              Easy apply
            </button>
          ))}
      </div>
    </article>
  );
};

export default JobCard;
