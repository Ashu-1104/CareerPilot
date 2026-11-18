// global Imports
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Local Imports
import { useAuth } from "../../../context/AuthContext";
import axiosInstance from "../../../utils/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";

const Hero = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [stats, setStats] = useState(null);

  // live numbers from the database (no made-up figures)
  useEffect(() => {
    axiosInstance.get(API_PATHS.JOBS.STATS).then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const search = (e) => {
    e.preventDefault();
    // the job list reads ?q= to prefill its search box
    navigate(`/find-jobs${keyword ? `?q=${encodeURIComponent(keyword)}` : ""}`);
  };

  return (
    <section className="bg-navy-900 text-white pt-32 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-6xl font-bold leading-[1.05] max-w-4xl"
        >
          Find a job that fits <span className="text-saffron-400">your skills</span>, not just your search.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-5 text-lg text-navy-100 max-w-2xl"
        >
          CareerPilot reads your resume, shows how well you match every job, and keeps your whole job hunt in one
          place: live roles from Indian company career pages, an application tracker, chat with employers and interview
          scheduling.
        </motion.p>

        <motion.form
          onSubmit={search}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 bg-white rounded-[20px] overflow-hidden flex flex-col sm:flex-row max-w-3xl"
        >
          <label className="flex-1 px-5 py-3.5 text-xs font-semibold text-stone-500 tracking-wide">
            WHAT ARE YOU LOOKING FOR?
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="React developer, data analyst, Paytm..."
              className="block w-full text-lg font-semibold text-stone-900 placeholder:text-stone-400 placeholder:font-normal outline-none mt-0.5"
            />
          </label>
          <button className="min-h-[60px] sm:min-h-[76px] px-8 bg-saffron-400 hover:bg-saffron-500 text-navy-900 font-bold flex items-center justify-center gap-2">
            Find jobs <ArrowRight className="w-5 h-5" />
          </button>
        </motion.form>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <button
            onClick={() => navigate(isAuthenticated && user?.role === "employer" ? "/post-job" : "/signup")}
            className="h-11 px-5 rounded-full border border-navy-800 text-navy-100 hover:bg-navy-800 font-semibold"
          >
            I'm hiring: post a job
          </button>
        </div>

        {stats && (
          <dl className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl">
            {[
              [stats.openJobs, "open jobs right now"],
              [stats.companies, "companies hiring"],
              [stats.sources, "job sources checked daily"],
              [stats.postedHere, "posted on CareerPilot"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-4xl font-bold text-saffron-400">{value}</dd>
                <dd className="text-sm text-navy-100 mt-1">{label}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
};

export default Hero;
