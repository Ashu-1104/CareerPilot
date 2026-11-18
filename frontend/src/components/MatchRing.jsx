import React from "react";

// Circular resume-match score (Design B). Grey "--" when there is no score.
const MatchRing = ({ score, size = 56 }) => {
  const known = typeof score === "number";
  const inner = size - 12;
  return (
    <span
      role="img"
      aria-label={known ? `${score} percent match with your resume` : "No match score yet"}
      title={known ? "How much of this job's skills your resume covers" : "Upload your resume to see your match"}
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: known
          ? `conic-gradient(var(--color-saffron-400) ${score * 3.6}deg, var(--color-sand) 0deg)`
          : "var(--color-sand)",
      }}
    >
      <span
        className="rounded-full bg-white flex items-center justify-center font-bold text-navy-900"
        style={{ width: inner, height: inner, fontSize: size > 48 ? 14 : 12 }}
      >
        {known ? `${score}%` : "--"}
      </span>
    </span>
  );
};

export default MatchRing;
