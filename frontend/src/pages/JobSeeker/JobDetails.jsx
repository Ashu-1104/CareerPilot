// global React
import React from "react";
import { Building2, Clock, Copy, ExternalLink, MapPin, MessageSquare, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import moment from "moment";
import toast from "react-hot-toast";
import { Link, useParams, useSearchParams } from "react-router-dom";

// local imports
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import Navbar from "../../components/layout/Navbar";
import StatusBadge from "../../components/StatusBadge";
import MatchRing from "../../components/MatchRing";
import { formatSalary, trackExternalApply } from "../../utils/helper";
import ChatDrawer from "../../components/ChatDrawer";

const SkillChip = ({ children, have }) => (
  <span
    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
      have ? "bg-navy-900 text-white" : "bg-saffron-100 text-saffron-900"
    }`}
  >
    {children}
  </span>
);

// "How you fit" and a cover letter, written by the free AI on request.
const AiHelper = ({ jobId }) => {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.post(API_PATHS.MATCH.INSIGHT(jobId));
      setInsight(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "The AI could not answer. Try again in a minute.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(insight.coverLetter);
    toast.success("Cover letter copied");
  };

  if (!insight) {
    return (
      <div className="bg-navy-900 text-white rounded-[20px] p-5">
        <p className="font-display font-bold text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-saffron-400" /> AI cover letter
        </p>
        <p className="text-sm text-navy-100 mt-1">
          A short note on how you fit this job and a cover letter written from your resume skills.
        </p>
        <button
          onClick={ask}
          disabled={loading}
          className="mt-4 h-11 px-5 rounded-full bg-saffron-400 text-navy-900 font-bold text-sm disabled:opacity-70"
        >
          {loading ? "Writing... (up to 30 seconds)" : "Write my cover letter"}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[20px] border border-sand p-5 space-y-4">
      <div>
        <p className="font-display font-bold text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-saffron-500" /> How you fit
        </p>
        <p className="text-sm text-stone-700 whitespace-pre-wrap mt-2">{insight.summary}</p>
      </div>
      {insight.coverLetter && (
        <div>
          <div className="flex items-center justify-between">
            <p className="font-display font-bold">Cover letter</p>
            <button onClick={copy} className="flex items-center gap-1.5 text-sm font-semibold text-navy-900 h-9 px-3 rounded-full hover:bg-sand/60">
              <Copy className="w-4 h-4" /> Copy
            </button>
          </div>
          <p className="text-sm text-stone-700 whitespace-pre-wrap mt-2 bg-cream rounded-xl p-4">{insight.coverLetter}</p>
        </div>
      )}
      <p className="text-xs text-stone-500">Written by a free AI from your resume skills. Read it and edit before sending.</p>
    </div>
  );
};

const JobDetails = () => {
  const { user } = useAuth();
  const { jobId } = useParams();

  const [jobDetails, setJobDetails] = useState(null);
  const [searchParams] = useSearchParams();
  const [chatOpen, setChatOpen] = useState(searchParams.get("chat") === "1");
  const isExternal = jobDetails?.source && jobDetails.source !== "careerpilot";
  const isSeeker = user?.role === "jobSeeker";

  const getJobDetailsById = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.JOBS.GET_JOB_BY_ID(jobId), {
        params: { userId: user?._id || null },
      });
      setJobDetails(response.data);
    } catch (error) {
      console.error("Error fetching job details:", error);
    }
  };

  const applyToJob = async () => {
    try {
      if (jobId) {
        await axiosInstance.post(API_PATHS.APPLICATIONS.APPLY_TO_JOB(jobId));
        toast.success("Application submitted successfully!");
      }

      getJobDetailsById();
    } catch (err) {
      console.log("Error", err);
      const errorMsg = err?.response?.data?.message;
      toast.error(errorMsg || "Failed to submit application! Try again later.");
    }
  };

  useEffect(() => {
    // anyone can read a job; logged-in seekers also get their match
    if (jobId) getJobDetailsById();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, user]);

  const company = jobDetails?.company?.companyName || jobDetails?.company?.name || "";
  const match = jobDetails?.match;

  return (
    <div className="bg-cream min-h-screen">
      <Navbar />

      {jobDetails && (
        <>
          <section className={`bg-navy-900 text-white px-4 sm:px-6 lg:px-8 pb-10 ${isSeeker ? "pt-[132px] md:pt-24" : "pt-24"}`}>
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end gap-6">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {jobDetails?.company?.companyLogo ? (
                  <img src={jobDetails.company.companyLogo} alt="" className="w-16 h-16 rounded-2xl object-cover bg-white" />
                ) : (
                  <span className="w-16 h-16 rounded-2xl bg-saffron-400 text-navy-900 font-display font-bold text-xl flex items-center justify-center flex-shrink-0">
                    {company.slice(0, 2).toUpperCase() || "?"}
                  </span>
                )}
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-4xl font-bold leading-tight">{jobDetails.title}</h1>
                  <p className="mt-2 text-navy-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {company}</span>
                    {jobDetails.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {jobDetails.location}</span>}
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {moment(jobDetails.postedAt || jobDetails.createdAt).fromNow()}</span>
                    {isExternal && (
                      <span>
                        via{" "}
                        {jobDetails.sourceInfo?.url ? (
                          <a href={jobDetails.sourceInfo.url} target="_blank" rel="noreferrer" className="underline text-white">
                            {jobDetails.sourceInfo.name}
                          </a>
                        ) : (
                          jobDetails.sourceInfo?.name
                        )}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {jobDetails?.applicationStatus ? (
                  <>
                    <span className="bg-white rounded-full px-1 py-1"><StatusBadge status={jobDetails.applicationStatus} /></span>
                    {jobDetails.applicationId && (
                      <button
                        onClick={() => setChatOpen(true)}
                        className="flex items-center gap-1.5 h-11 px-5 rounded-full bg-white text-navy-900 font-semibold text-sm"
                      >
                        <MessageSquare className="h-4 w-4" /> Message employer
                      </button>
                    )}
                  </>
                ) : isExternal ? (
                  // imported jobs are applied for on the company's own site
                  <a
                    href={jobDetails.applyUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => isSeeker && trackExternalApply(jobDetails._id)}
                    className="flex items-center gap-1.5 h-12 px-6 rounded-full bg-saffron-400 text-navy-900 font-bold"
                  >
                    Apply on company site <ExternalLink className="h-4 w-4" />
                  </a>
                ) : user ? (
                  isSeeker && (
                    <button onClick={applyToJob} className="h-12 px-6 rounded-full bg-saffron-400 text-navy-900 font-bold">
                      Easy apply
                    </button>
                  )
                ) : (
                  <Link to="/login" className="h-12 px-6 rounded-full bg-saffron-400 text-navy-900 font-bold flex items-center">
                    Log in to apply
                  </Link>
                )}
              </div>
            </div>
          </section>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1 min-w-0 space-y-6 w-full">
              <section className="bg-white rounded-[20px] border border-sand p-6">
                <h2 className="text-xl font-bold mb-4">About this role</h2>
                <div className="text-[15px] text-stone-700 leading-relaxed whitespace-pre-wrap break-words">{jobDetails.description}</div>
              </section>

              {/* imported jobs keep their requirements in the description */}
              {jobDetails.requirements && (
                <section className="bg-white rounded-[20px] border border-sand p-6">
                  <h2 className="text-xl font-bold mb-4">What we're looking for</h2>
                  <div className="text-[15px] text-stone-700 leading-relaxed whitespace-pre-wrap break-words">{jobDetails.requirements}</div>
                </section>
              )}
            </div>

            {/* on phones the match and AI cards come first, before the long description */}
            <aside className="w-full lg:w-[340px] flex-shrink-0 space-y-4 lg:sticky lg:top-24 order-first lg:order-none">
              {isSeeker && (
                <div className="bg-white rounded-[20px] border border-sand p-5">
                  <div className="flex items-center gap-4">
                    <MatchRing score={match?.score} size={64} />
                    <div>
                      <p className="font-display font-bold text-lg">Your match</p>
                      <p className="text-sm text-stone-600">
                        {match
                          ? `Your resume shows ${match.matched.length} of the ${match.matched.length + match.missing.length} skills this job names.`
                          : user?.resume
                            ? "This job names too few skills to score."
                            : "Upload your resume to see how well you match."}
                      </p>
                    </div>
                  </div>
                  {match && (
                    <div className="mt-4 space-y-3">
                      {match.matched.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {match.matched.map((s) => <SkillChip key={s} have>{s}</SkillChip>)}
                        </div>
                      )}
                      {match.missing.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-stone-500 mb-1.5">NOT ON YOUR RESUME</p>
                          <div className="flex flex-wrap gap-1.5">
                            {match.missing.map((s) => <SkillChip key={s}>{s}</SkillChip>)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {!match && !user?.resume && (
                    <Link to="/profile" className="inline-flex mt-4 h-10 items-center px-4 rounded-full bg-navy-900 text-white text-sm font-semibold">
                      Upload resume
                    </Link>
                  )}
                </div>
              )}

              {isSeeker && match && <AiHelper jobId={jobDetails._id} />}

              <div className="bg-white rounded-[20px] border border-sand p-5 text-sm space-y-3">
                {[
                  ["Salary", formatSalary(jobDetails.salaryMin, jobDetails.salaryMax)],
                  ["Job type", jobDetails.type],
                  ["Category", jobDetails.category],
                  ["Posted", moment(jobDetails.postedAt || jobDetails.createdAt).format("D MMM YYYY")],
                ]
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <span className="text-stone-500">{label}</span>
                      <span className="font-semibold text-stone-900 text-right">{value}</span>
                    </div>
                  ))}
              </div>
            </aside>
          </div>
        </>
      )}

      {chatOpen && jobDetails?.applicationId && (
        <ChatDrawer
          applicationId={jobDetails.applicationId}
          title={company || "Employer"}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
};

export default JobDetails;
