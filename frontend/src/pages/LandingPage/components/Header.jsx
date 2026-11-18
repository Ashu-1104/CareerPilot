// Global Imports
import React from "react";
import { Link } from "react-router-dom";

// Local Imports
import { useAuth } from "../../../context/AuthContext";

// Home page header (Design B): navy bar like the app's navbar.
const Header = () => {
  const { user, isAuthenticated } = useAuth();
  const home = user?.role === "employer" ? "/employer-dashboard" : "/find-jobs";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-navy-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-8">
        <Link to="/" className="font-display font-bold text-xl tracking-tight">
          Career<span className="text-saffron-400">Pilot</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-navy-100" aria-label="Main">
          <Link to="/find-jobs" className="px-4 py-2 rounded-full hover:bg-navy-800">Find jobs</Link>
          <Link to={isAuthenticated && user?.role === "employer" ? "/employer-dashboard" : "/signup"} className="px-4 py-2 rounded-full hover:bg-navy-800">
            For employers
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="hidden sm:inline text-sm text-navy-100">Hi, {user?.name?.split(" ")[0]}</span>
              <Link to={home} className="h-10 px-5 rounded-full bg-saffron-400 text-navy-900 font-semibold text-sm flex items-center">
                {user?.role === "employer" ? "Dashboard" : "My jobs"}
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-navy-100 hover:text-white px-3 py-2">Log in</Link>
              <Link to="/signup" className="h-10 px-5 rounded-full bg-saffron-400 text-navy-900 font-semibold text-sm flex items-center">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
