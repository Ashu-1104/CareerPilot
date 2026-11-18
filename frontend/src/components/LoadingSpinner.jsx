import React from "react";
import { Briefcase } from "lucide-react";

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-sand border-t-navy-900 mx-auto mb-4"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-navy-900" />
          </div>
        </div>

        <p className="text-gray-600 font-medium">
          Finding the best matches for you...
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
