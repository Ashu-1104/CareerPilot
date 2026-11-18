import {
    Search,
    Users,
    FileText,
    MessageSquare,
    BarChart3,
    Shield,
    Clock,
    Award,
    Briefcase,
    Building2,
    LayoutDashboard,
    CalendarClock,
    Plus,
} from "lucide-react";

export const jobSeekerFeatures = [
    {
        icon: Search,
        title: "Resume match on every job",
        description:
            "Upload your resume once. Every job shows how many of its skills you already have, and which ones you are missing.",
    },
    {
        icon: Briefcase,
        title: "Live jobs from company sites",
        description:
            "Roles from the career pages of Indian companies and remote job boards, refreshed every day, next to jobs posted here.",
    },
    {
        icon: FileText,
        title: "Application tracker and AI cover letters",
        description:
            "Track every application on one board, with follow-up reminders, and get a cover letter written from your skills.",
    },
    {
        icon: MessageSquare,
        title: "Chat and interviews",
        description:
            "Message employers about your application and pick an interview time from the slots they offer.",
    },
];

export const employerFeatures = [
    {
        icon: Users,
        title: "Review applicants",
        description:
            "See everyone who applied, their profile and resume, and move them from Applied to In Review, Accepted or Rejected.",
    },
    {
        icon: Clock,
        title: "Schedule interviews",
        description:
            "Offer up to five time slots; the candidate picks one and both of you get it on your Interviews page.",
    },
    {
        icon: MessageSquare,
        title: "Live notifications and chat",
        description:
            "New applications and messages appear the moment they arrive, and you can reply to candidates right away.",
    },
    {
        icon: BarChart3,
        title: "Hiring analytics",
        description:
            "Track active jobs, applications and hires over time from your dashboard.",
    },
];

// Navigation items Configuration
export const NAVIGATION_MENU = [
    { id: "employer-dashboard", name: "Dashboard", icon: LayoutDashboard },
    { id: "post-job", name: "Post a Job", icon: Plus },
    { id: "manage-jobs", name: "Manage Jobs", icon: Briefcase },
    { id: "interviews", name: "Interviews", icon: CalendarClock },
    { id: "company-profile", name: "Company Profile", icon: Building2 },

];

// categories data and job types
export const CATEGORIES = [
    { value: "Engineering", label: "Engineering" },
    { value: "Design", label: "Design" },
    { value: "Marketing", label: "Marketing" },
    { value: "Sales", label: "Sales" },
    { value: "Customer Support", label: "Customer Support" },
    { value: "Human Resources", label: "Human Resources" },
    { value: "Finance", label: "Finance" },
    { value: "Operations", label: "Operations" },
    { value: "IT & Software", label: "IT & Software" },
    { value: "Education", label: "Education" },
];

export const JOB_TYPES = [
    { value: "Full-Time", label: "Full-Time" },
    { value: "Part-Time", label: "Part-Time" },
    { value: "Contract", label: "Contract" },
    { value: "Internship", label: "Internship" },
    { value: "Remote", label: "Remote" },
];

// Where a job comes from: posted by an employer here, or imported from job boards
export const JOB_SOURCES = [
    { value: "careerpilot", label: "Posted on CareerPilot" },
    { value: "external", label: "Company sites & job boards" },
];

export const SALARY_RANGES = [
    "Less then $1000",
    "$1000 - $3000",
    "More then $15,000",
];