// Global Imports
import React from "react";
import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";

// Local Imports
import { useAuth } from "../../context/AuthContext";
import ProfileDropdown from "./ProfileDropdown";
import NotificationBell from "../NotificationBell";

const SEEKER_LINKS = [
  { to: "/find-jobs", label: "Find jobs" },
  { to: "/tracker", label: "Tracker" },
  { to: "/interviews", label: "Interviews" },
];

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (profileDropdownOpen) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [profileDropdownOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-navy-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 h-16">
          {/* Logo */}
          <Link to="/find-jobs" className="font-display font-bold text-xl tracking-tight">
            Career<span className="text-saffron-400">Pilot</span>
          </Link>

          {user?.role === "jobSeeker" && (
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium" aria-label="Main">
              {SEEKER_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-full transition-colors ${
                      isActive ? "bg-saffron-400 text-navy-900" : "text-navy-100 hover:bg-navy-800"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-2">
            {user && (
              <button
                className="w-10 h-10 rounded-full hover:bg-navy-800 transition-colors flex items-center justify-center"
                onClick={() => navigate("/saved-jobs")}
                aria-label="Saved jobs"
              >
                <Bookmark className="h-5 w-5" />
              </button>
            )}
            {user && <NotificationBell dark />}

            {isAuthenticated ? (
                <ProfileDropdown
                  dark
                  isOpen={profileDropdownOpen}
                  onToggle={(e) => {
                    e.stopPropagation();
                    setProfileDropdownOpen(!profileDropdownOpen);
                  }}
                  avatar={user?.avatar || ""}
                  companyName={user?.name || ""}
                  email={user?.email || ""}
                  userRole={user?.role || ""}
                  onLogout={logout}
                />
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-navy-100 hover:text-white px-3 py-2">
                  Login
                </Link>
                <Link to="/signup" className="text-sm font-semibold bg-saffron-400 text-navy-900 px-4 py-2 rounded-full">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* phone: the main links as a scrollable row under the logo */}
        {user?.role === "jobSeeker" && (
          <nav className="md:hidden flex gap-1 pb-3 overflow-x-auto text-sm font-medium" aria-label="Main">
            {SEEKER_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-full whitespace-nowrap ${isActive ? "bg-saffron-400 text-navy-900" : "text-navy-100"}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
