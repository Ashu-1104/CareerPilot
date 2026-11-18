import toast from "react-hot-toast";
import axiosInstance from "./axiosInstance";

// Opens an uploaded file in a new tab. Resumes are private (/api/files/...):
// a plain link cannot send the login, so download them with it first.
export const openFile = async (url) => {
  if (!url) return;
  if (!url.includes("/api/files/")) {
    window.open(url, "_blank", "noopener");
    return;
  }
  // open the tab now (inside the click) so pop-up blockers allow it
  const tab = window.open("", "_blank");
  try {
    const { data } = await axiosInstance.get(url, { responseType: "blob" });
    const blobUrl = URL.createObjectURL(data);
    if (tab) tab.location.href = blobUrl;
    else window.location.href = blobUrl;
  } catch {
    tab?.close();
    toast.error("Could not open the resume.");
  }
};
