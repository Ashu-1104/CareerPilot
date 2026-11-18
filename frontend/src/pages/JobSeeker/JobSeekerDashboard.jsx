// Global Imports
import React from "react";
import { useState, useEffect } from "react";
import { Search, Filter, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// Local Imports
import LoadingSpinner from "../../components/LoadingSpinner";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { useAuth } from "../../context/AuthContext";
import FilterContent from "./components/FilterContent";
import SearchHeader from "./components/SearchHeader";
import Navbar from "../../components/layout/Navbar";
import JobCard from "../../components/Cards/JobCard";

const JobSeekerDashboard = () => {
  const { user } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Filter States
  const [filters, setFilters] = useState({
    // the home page search sends ?q=
    keyword: new URLSearchParams(window.location.search).get("q") || "",
    location: "",
    category: "",
    type: "",
    minSalary: "",
    maxSalary: "",
    source: "",
  });

  // Sidebar collapse states
  const [expandedSections, setExpandedSections] = useState({
    jobType: true,
    salary: true,
    categories: true,
    source: true,
  });

  // Resume match summary and tracker numbers for the hero and the strip
  const [overview, setOverview] = useState(null);
  const [trackerStats, setTrackerStats] = useState(null);
  const [sort, setSort] = useState("match"); // "match" needs a resume; else newest

  // Pagination: the API returns 20 jobs per page
  const [page, setPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Functions to fetch jobs from API
  const fetchJobs = async (filterParams = {}, pageToLoad = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();

      if (filterParams.keyword) params.append("keyword", filterParams.keyword);
      if (filterParams.location)
        params.append("location", filterParams.location);
      if (filterParams.minSalary)
        params.append("minSalary", filterParams.minSalary);
      if (filterParams.maxSalary)
        params.append("maxSalary", filterParams.maxSalary);
      if (filterParams.category)
        params.append("category", filterParams.category);
      if (filterParams.type) params.append("type", filterParams.type);
      if (filterParams.source) params.append("source", filterParams.source);
      if (user) params.append("userId", user?._id);
      if (sort === "match") params.append("sort", "match");
      params.append("page", pageToLoad);

      const response = await axiosInstance.get(
        `${API_PATHS.JOBS.GET_ALL_JOBS}?${params.toString()}`
      );

      const jobsData = Array.isArray(response.data)
        ? response.data
        : response.data.jobs || [];

      // page 1 replaces the list, later pages are appended ("Load more")
      setJobs((prev) => (pageToLoad === 1 ? jobsData : [...prev, ...jobsData]));
      setPage(pageToLoad);
      setTotalJobs(response.data.total ?? jobsData.length);
      setHasMore(pageToLoad < (response.data.pages || 1));
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError("Failed to load jobs. Please try again later.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch jobs on component mount and when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const apiFilters = {
        keyword: filters.keyword,
        location: filters.location,
        minSalary: filters.minSalary,
        maxSalary: filters.maxSalary,
        category: filters.category,
        type: filters.type,
        experience: filters.experience,
        remoteOnly: filters.remoteOnly,
        source: filters.source,
      };

      // Only call API if there are meaningful filter
      const hasFilters = Object.values(apiFilters).some(
        (value) =>
          value !== "" &&
          value !== false &&
          value !== null &&
          value !== undefined
      );

      if (hasFilters) {
        fetchJobs(apiFilters);
      } else {
        fetchJobs(); // Fetch all jobs if no filters
      }
    }, 500); // Debounce API calls by 500ms

    return () => clearTimeout(timeoutId);
  }, [filters, user, sort]);

  useEffect(() => {
    if (user?.role !== "jobSeeker") return;
    axiosInstance.get(API_PATHS.MATCH.OVERVIEW).then((r) => setOverview(r.data)).catch(() => setOverview({}));
    axiosInstance.get(API_PATHS.TRACKER.GET).then((r) => setTrackerStats(r.data.stats)).catch(() => {});
  }, [user]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      keyword: "",
      location: "",
      category: "",
      type: "",
      minSalary: "",
      maxSalary: "",
      source: "",
    });
  };

  const MobileFilterOverlay = () => (
    <div
      className={`fixed inset-0 z-50 lg:hidden ${
        showMobileFilters ? "" : "hidden"
      }`}
    >
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => setShowMobileFilters(false)}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="font-bold text-gray-900 text-lg">Filters</h3>
          <button
            onClick={() => setShowMobileFilters(false)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto h-full pb-20">
          {/* Filters go here */}
          <FilterContent
            toggleSection={toggleSection}
            clearAllFilters={clearAllFilters}
            expandedSections={expandedSections}
            filters={filters}
            handleFilterChange={handleFilterChange}
          />
        </div>
      </div>
    </div>
  );

  const toggleSaveJob = async (jobId, isSaved) => {
    try {
      if (isSaved) {
        await axiosInstance.delete(API_PATHS.JOBS.UNSAVE_JOB(jobId));
        toast.success("Job removed successfully");
      } else {
        await axiosInstance.post(API_PATHS.JOBS.SAVE_JOB(jobId));
        toast.success("Job saved successfully");
      }

      fetchJobs();
    } catch (err) {
      console.log("Error:", err);
      toast.error("Failed to update saved jobs. Please try again.");
    }
  };

  const applyToJob = async (jobId) => {
    try {
      if (jobId) {
        await axiosInstance.post(API_PATHS.APPLICATIONS.APPLY_TO_JOB(jobId));
        toast.success("Applied to job successfully");
      }

      fetchJobs();
    } catch (err) {
      console.log("Error:", err);
      const errMsg = err?.response?.data?.message;
      toast.error(errMsg || "Failed to apply to job. Please try again.");
    }
  };

  if (jobs.length == 0 && loading && !overview) {
    return <LoadingSpinner />;
  }

  const isSeeker = user?.role === "jobSeeker";
  const canSortByMatch = isSeeker && overview?.skills?.length > 0;

  return (
    <div className="bg-cream min-h-screen">
      <Navbar />

      {/* navbar height: 64px, plus its 44px link row on phones */}
      <div className={`pb-16 ${isSeeker ? "pt-[108px] md:pt-16" : "pt-16"}`}>
        <SearchHeader
          filters={filters}
          handleFilterChange={handleFilterChange}
          user={user}
          overview={overview}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="flex gap-6 lg:gap-8">
            {/* Desktop Filters Sidebar */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="bg-white rounded-[20px] border border-sand p-6 sticky top-24">
                <h2 className="font-bold text-stone-900 text-lg mb-4">Filters</h2>
                <FilterContent
                  toggleSection={toggleSection}
                  clearAllFilters={clearAllFilters}
                  expandedSections={expandedSections}
                  filters={filters}
                  handleFilterChange={handleFilterChange}
                />
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">
                    {sort === "match" && canSortByMatch ? "Best matches for you" : "Latest jobs"}
                  </h2>
                  <p className="text-sm text-stone-600 mt-1">
                    Showing <b className="text-stone-900">{jobs.length}</b> of{" "}
                    <b className="text-stone-900">{totalJobs}</b> jobs
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {canSortByMatch && (
                    <div className="flex bg-white border border-sand rounded-full p-1 text-sm font-medium" role="group" aria-label="Sort jobs">
                      {[
                        ["match", "Best match"],
                        ["newest", "Newest"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          onClick={() => setSort(value)}
                          aria-pressed={sort === value}
                          className={`px-4 h-9 rounded-full ${sort === value ? "bg-navy-900 text-white" : "text-stone-600 hover:text-stone-900"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => setShowMobileFilters(true)}
                    className="lg:hidden flex items-center gap-2 bg-white h-11 px-4 rounded-full border border-sand font-medium text-stone-700"
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                  </button>
                </div>
              </div>

              {jobs.length === 0 && !loading ? (
                <div className="text-center py-16 bg-white rounded-[20px] border border-sand">
                  <Search className="w-12 h-12 mx-auto text-stone-300 mb-4" />
                  <h3 className="text-xl font-bold text-stone-900 mb-2">No jobs found</h3>
                  <p className="text-stone-600 mb-6">Try a different role, city or fewer filters.</p>
                  <button
                    onClick={clearAllFilters}
                    className="bg-navy-900 text-white h-11 px-6 rounded-full font-semibold hover:bg-navy-800"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {jobs.map((job) => (
                      <JobCard
                        key={job._id}
                        job={job}
                        onClick={() => navigate(`/job/${job._id}`)}
                        onToggleSave={() => toggleSaveJob(job._id, job.isSaved)}
                        onApply={() => applyToJob(job._id)}
                      />
                    ))}
                  </div>

                  {hasMore && (
                    <div className="flex justify-center mt-8">
                      <button
                        onClick={() => fetchJobs(filters, page + 1)}
                        disabled={loading}
                        className="bg-white border border-sand text-stone-800 h-11 px-6 rounded-full font-semibold hover:bg-sand/40 disabled:opacity-60"
                      >
                        {loading ? "Loading..." : "Load more jobs"}
                      </button>
                    </div>
                  )}
                </>
              )}

              {isSeeker && trackerStats && (
                <div className="mt-8 bg-navy-900 text-white rounded-[20px] px-6 py-6 flex flex-wrap items-center gap-6">
                  <p className="font-display text-xl flex-1 min-w-[240px]">
                    Your search so far: {trackerStats.applied} applied, {trackerStats.interviews} interview
                    {trackerStats.interviews === 1 ? "" : "s"}, {trackerStats.followUpsDue} follow-up
                    {trackerStats.followUpsDue === 1 ? "" : "s"} due.
                  </p>
                  <button
                    onClick={() => navigate("/tracker")}
                    className="h-11 px-5 rounded-full bg-saffron-400 text-navy-900 font-bold hover:bg-saffron-500"
                  >
                    Open tracker
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Filters Overlay */}
        <MobileFilterOverlay />
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
