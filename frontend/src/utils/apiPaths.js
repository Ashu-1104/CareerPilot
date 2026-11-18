export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const API_PATHS = {
    AUTH: {
        REGISTER: "/api/auth/register", // Sign-Up
        LOGIN: "/api/auth/login",       // Authenticate user & return JWT
        GET_PROFILE: "/api/auth/profile", // Get user profile
        UPDATE_PROFILE: "/api/user/profile", // Update user profile
        DELETE_RESUME: "/api/user/resume", // Delete user resume
    },

    DASHBOARD:{
        OVERVIEW: `/api/analytics/overview`, // Get dashboard overview data
    },

    NOTIFICATIONS: {
        GET: "/api/notifications", // Latest notifications + unread count
        READ: "/api/notifications/read", // Mark one ({ id }) or all as read
        STREAM_TICKET: "/api/notifications/stream-ticket", // Short ticket for the live stream
        STREAM: (ticket) => `/api/notifications/stream?ticket=${encodeURIComponent(ticket)}`,
    },
    MESSAGES: (applicationId) => `/api/applications/${applicationId}/messages`,
    INTERVIEWS: {
        GET: "/api/interviews", // My interviews (employer or candidate)
        PROPOSE: "/api/interviews", // Employer offers time slots
        CONFIRM: (id) => `/api/interviews/${id}/confirm`, // Candidate picks a slot
        CANCEL: (id) => `/api/interviews/${id}/cancel`,
    },
    MATCH: {
        OVERVIEW: "/api/match/overview", // Resume skills, strong matches, top missing skills
        REFRESH: "/api/match/refresh", // Read the resume again
        INSIGHT: (jobId) => `/api/match/${jobId}/insight`, // AI summary + cover letter
    },
    TRACKER: {
        GET: "/api/tracker", // Tracked jobs and stats
        ADD: "/api/tracker", // Track a job ({ jobId } or a job from another site)
        UPDATE: (id) => `/api/tracker/${id}`, // Move to another stage / edit
        DELETE: (id) => `/api/tracker/${id}`, // Remove from the tracker
    },
    JOBS: {
        GET_ALL_JOBS: "/api/jobs", // Get all job listings
        GET_JOB_BY_ID: (id) => `/api/jobs/${id}`, // Get job details by ID
        POST_JOB: "/api/jobs", // Post a new job
        GET_JOBS_EMPLOYER: "/api/jobs/get-jobs-employer", // Get jobs posted by the logged-in employer
        GET_JOB_BY_ID: (id) => `/api/jobs/${id}`, // Get job details by ID
        UPDATE_JOB: (id) => `/api/jobs/${id}`, // Update job by ID
        TOGGLE_CLOSE: (id) => `/api/jobs/${id}/toggle-close`, // Close or reopen job by ID
        DELETE_JOB: (id) => `/api/jobs/${id}`, // Delete job by ID
        DELETE_JOB: (id) => `/api/jobs/${id}`, // Delete job by ID

        SAVE_JOB: (id) => `/api/save-jobs/${id}`, // Save job by ID
        UNSAVE_JOB: (id) => `/api/save-jobs/${id}`, // Unsave job by ID
        GET_SAVED_JOBS: "api/save-jobs/my", // Get all saved jobs for the logged-in user
    },

    APPLICATIONS: {
        APPLY_TO_JOB: (id) => `/api/applications/${id}`, // Apply to a job by ID
        GET_ALL_APPLICATIONS: (id) => `/api/applications/job/${id}`, // Get all applications for a specific job
        UPDATE_STATUS: (id) => `api/applications/${id}/status`, // Update application status by ID
    },

    IMAGE: {
        UPLOAD_IMAGE: "/api/auth/upload-image", // Upload an image
    },
};