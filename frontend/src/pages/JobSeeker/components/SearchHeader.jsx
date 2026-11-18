// global imports
import React from "react";
import { Link } from "react-router-dom";

// Quick searches under the search box: [label, filters they set]
const QUICK_SEARCHES = [
  ["Remote · India", { keyword: "", location: "Remote (India)" }],
  ["React", { keyword: "react", location: "" }],
  ["Node.js", { keyword: "node", location: "" }],
  ["Bengaluru", { keyword: "", location: "Bengaluru" }],
  ["Pune", { keyword: "", location: "Pune" }],
  ["Internships", { type: "Internship" }],
];

// Navy hero with a greeting and the big WHAT / WHERE search box (Design B).
const SearchHeader = ({ filters, handleFilterChange, user, overview }) => {
  const firstName = user?.name?.split(" ")[0];
  const greeting = !user
    ? "Find your next job in tech."
    : user.role !== "jobSeeker"
      ? `Namaste ${firstName}.`
      : overview?.hasResume && overview.skills?.length
        ? `Namaste ${firstName}. ${overview.strongMatches} open job${overview.strongMatches === 1 ? "" : "s"} match your resume well.`
        : `Namaste ${firstName}. Add your resume to see how well each job matches.`;

  return (
    <>
      <section className="bg-navy-900 text-white px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-[44px] leading-[1.08] font-bold max-w-3xl">{greeting}</h1>
          <p className="mt-3 text-navy-100 text-base">
            Jobs posted by employers here, plus live roles from the career pages of Paytm, InMobi, Meesho, CRED and more.
          </p>
          {user?.role === "jobSeeker" && overview && !overview.skills?.length && (
            <Link
              to="/profile"
              className="inline-flex mt-5 h-11 items-center px-5 rounded-full bg-saffron-400 text-navy-900 font-semibold text-sm"
            >
              Upload your resume
            </Link>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-11">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="bg-white rounded-[20px] shadow-[0_12px_32px_rgba(30,42,90,0.16)] overflow-hidden flex flex-col sm:flex-row"
        >
          <label className="flex-[2] px-5 py-3.5 border-b sm:border-b-0 sm:border-r border-sand text-xs font-semibold text-stone-500 tracking-wide">
            WHAT
            <input
              type="text"
              placeholder="Role, skill or company"
              className="block w-full text-lg font-semibold text-stone-900 placeholder:text-stone-400 placeholder:font-normal outline-none mt-0.5 bg-transparent"
              value={filters.keyword}
              onChange={(e) => handleFilterChange("keyword", e.target.value)}
            />
          </label>
          <label className="flex-1 px-5 py-3.5 border-b sm:border-b-0 sm:border-r border-sand text-xs font-semibold text-stone-500 tracking-wide">
            WHERE
            <input
              type="text"
              placeholder="City or Remote"
              className="block w-full text-lg font-semibold text-stone-900 placeholder:text-stone-400 placeholder:font-normal outline-none mt-0.5 bg-transparent"
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
            />
          </label>
          <button className="min-h-[60px] sm:min-h-[76px] px-9 bg-saffron-400 hover:bg-saffron-500 text-navy-900 font-bold text-base transition-colors">
            Search jobs
          </button>
        </form>

        <div className="flex gap-2 flex-wrap items-center mt-5 text-sm">
          <span className="text-stone-600 py-2">Popular:</span>
          {QUICK_SEARCHES.map(([label, set]) => (
            <button
              key={label}
              type="button"
              onClick={() => Object.entries(set).forEach(([key, value]) => handleFilterChange(key, value))}
              className="bg-saffron-100 text-saffron-900 px-3.5 py-2 rounded-full font-medium hover:bg-saffron-400 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default SearchHeader;
