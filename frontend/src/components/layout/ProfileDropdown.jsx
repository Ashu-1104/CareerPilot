import React from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProfileDropdown = ({
  isOpen,
  onToggle,
  avatar,
  companyName,
  email,
  onLogout,
  userRole,
  dark = false, // on the navy job-seeker header
}) => {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    console.log("User Role:", userRole);
    console.log("Navigating to:", userRole === 'jobSeeker' ? '/profile' : '/company-profile');
    
    if (userRole === 'jobSeeker') {
      navigate('/profile');
    } else {
      navigate('/company-profile');
    }
  };

  // Format the role display
  const formatRole = (role) => {
    if (role === 'jobSeeker') {
      return 'Job Seeker';
    } else if (role === 'employer') {
      return 'Employer';
    }
    return role;
  };

  return <div className="relative">
    <button
      onClick={onToggle}
      className={`flex items-center space-x-3 p-2 rounded-xl transition-colors duration-200 ${dark ? "hover:bg-navy-800" : "hover:bg-gray-50"}`}
      >
        {avatar ? (
          <img
            src={avatar}
            alt="User Avatar"
            className="h-9 w-9 object-cover rounded-xl"
            />
        ) : (
          <div className={`h-9 w-9 rounded-full flex items-center justify-center ${dark ? "bg-saffron-400" : "bg-navy-900"}`}>
          <span className={`font-semibold text-sm ${dark ? "text-navy-900" : "text-white"}`}>
            {companyName.charAt(0).toUpperCase()}
          </span>
          </div>
        )}
        <div className="hidden sm:block text-left">
          <p className={`text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}>{companyName}</p>
          <p className={`text-xs ${dark ? "text-navy-100" : "text-gray-500"}`}>{formatRole(userRole)}</p>
        </div>
        <ChevronDown className={`h-4 w-4 ${dark ? "text-navy-100" : "text-gray-400"}`} />
      </button>

    {isOpen && (
      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
        <div className="px-4 py-3 border-b border-b-gray-100">
          <p className="text-sm font-medium text-gray-900">{companyName}</p>
          <p className="text-xs text-gray-500">{email}</p>
        </div>

        <button
        onClick={handleViewProfile}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
          View Profile
        </button>
        <div className="border-t border-gray-100 mt-2 pt-2">
          <button
          onClick={onLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              Sign Out
          </button>
        </div>
      </div>
    )}
  </div>;
};

export default ProfileDropdown;
