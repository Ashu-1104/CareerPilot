import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// "How it works" in three steps (replaces the original made-up platform statistics).
const STEPS = [
  ["Upload your resume", "CareerPilot reads the skills on your PDF resume. Nothing to fill in by hand."],
  ["See your match on every job", "Each job shows how many of its skills you already have and which ones you are missing."],
  ["Apply and track it all", "Apply here or on the company site, then follow every application on your tracker board."],
];

const Analytics = () => (
  <section className="bg-cream py-20 px-4 sm:px-6 lg:px-8">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl sm:text-4xl font-bold text-stone-900">How it works</h2>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {STEPS.map(([title, text], i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="bg-white rounded-[20px] border border-sand p-6"
          >
            <span className="w-11 h-11 rounded-full bg-saffron-400 text-navy-900 font-display font-bold text-lg flex items-center justify-center">
              {i + 1}
            </span>
            <h3 className="mt-4 text-xl font-bold text-stone-900">{title}</h3>
            <p className="mt-2 text-stone-600">{text}</p>
          </motion.div>
        ))}
      </div>
      <div className="mt-10 bg-navy-900 text-white rounded-[20px] p-6 sm:p-8 flex flex-wrap items-center gap-5">
        <p className="font-display text-2xl font-bold flex-1 min-w-[240px]">Ready to see how well you match?</p>
        <Link to="/signup" className="h-12 px-6 rounded-full bg-saffron-400 text-navy-900 font-bold flex items-center">
          Create a free account
        </Link>
      </div>
    </div>
  </section>
);

export default Analytics;
