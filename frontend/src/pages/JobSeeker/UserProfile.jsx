// Global Imports
import React from 'react'
import { useState, useEffect } from 'react';
import { Save, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

// Local Imports
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import uploadImage from '../../utils/uploadImage';
import Navbar from '../../components/layout/Navbar';

// Skills CareerPilot read from the resume, which drive the job match scores.
const ResumeSkills = ({ resume }) => {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!resume) return;
    axiosInstance.get(API_PATHS.MATCH.OVERVIEW).then((r) => setData(r.data)).catch(() => {});
  }, [resume]);

  const readAgain = async () => {
    setBusy(true);
    try {
      const { data: res } = await axiosInstance.post(API_PATHS.MATCH.REFRESH);
      setData((d) => ({ ...d, skills: res.skills }));
      toast.success(`Found ${res.skills.length} skills on your resume`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not read your resume.");
    } finally {
      setBusy(false);
    }
  };

  if (!resume || !data) return null;
  return (
    <div className="bg-cream border border-sand rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="font-display font-bold text-stone-900">Skills found on your resume</p>
        <button
          type="button"
          onClick={readAgain}
          disabled={busy}
          className="text-sm font-semibold text-navy-900 h-9 px-3 rounded-full hover:bg-sand/60 disabled:opacity-60"
        >
          {busy ? "Reading..." : "Read resume again"}
        </button>
      </div>
      {data.skills?.length ? (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {data.skills.map((s) => (
            <span key={s} className="text-xs font-medium px-2.5 py-1 rounded-full bg-navy-900 text-white">{s}</span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone-600 mt-2">No skills found yet. Make sure your resume is a text PDF (not a scanned image), then read it again.</p>
      )}
      {data.topMissing?.length > 0 && (
        <p className="text-sm text-stone-600 mt-3">
          Often asked for by your best-matching jobs:{" "}
          <b className="text-saffron-900">{data.topMissing.map((m) => m.skill).join(", ")}</b>
        </p>
      )}
    </div>
  );
};

const UserProfile = () => {
  const { user, updateUser } = useAuth();

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    avatar: user?.avatar || "",
    resume: user?.resume || "",
  });

  const [formData, setFormData] = useState({ ...profileData });
  const [uploading, setUploading] = useState({ avatar: false, logo: false });
  const [saving, setSaving] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = async (file, type) => {
    setUploading((prev) => ({ ...prev, [type]: true }));

    try {
      const imgUploadRes = await uploadImage(file);
      const avatarUrl = imgUploadRes.imageUrl || "";

      // Update form data with new image URL
      handleInputChange(type, avatarUrl);
      toast.success(`${type === 'avatar' ? 'Avatar' : 'Resume'} uploaded successfully!`);
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error(`Failed to upload ${type === 'avatar' ? 'avatar' : 'resume'}`);
      // Reset the preview on error
      handleInputChange(type, profileData[type]);
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      handleInputChange(type, previewUrl);

      // Upload the image
      handleImageUpload(file, type);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await axiosInstance.put(
        API_PATHS.AUTH.UPDATE_PROFILE,
        formData
      );
       
      if (response.status === 200) {
        toast.success("Profile updated successfully!");
        // Update profile data and exit mode
        setProfileData({ ...formData });
        updateUser({ ...formData });
      }
    } catch (error) {
      console.error("Profile Update Failed", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ ...profileData });
  };

  const DeleteResume = async () => {
    if (!window.confirm('Are you sure you want to delete your resume?')) {
      return;
    }

    setSaving(true);

    try {
      const response = await axiosInstance.post(
        API_PATHS.AUTH.DELETE_RESUME,
        {
          resumeUrl: user.resume || "",
        }
      );

      if (response.status === 200) {
        toast.success("Resume deleted successfully!");
        const updatedData = { 
          ...formData, 
          resume: "" 
        };
        setProfileData(updatedData);
        setFormData(updatedData);
        
        // Update user context with the response data if available
        if (response.data?.user) {
          updateUser(response.data.user);
        } else {
          updateUser({ ...user, resume: "" });
        }
      }
    } catch (error) {
      console.error("Resume deletion failed:", error);
      toast.error(error.response?.data?.message || "Failed to delete resume");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const userData = {
      name: user?.name || "",
      email: user?.email || "",
      avatar: user?.avatar || "",
      resume: user?.resume || "",
    };

    setProfileData({ ...userData });
    setFormData({ ...userData });
    return () => {};
  }, [user]);

  return (
    <div className='bg-cream'>
      <Navbar />

      <div className='min-h-screen bg-cream py-8 px-4 pt-[124px] md:pt-24'>
        <div className='max-w-4xl mx-auto'>
          <div className='bg-white rounded-[20px] border border-sand overflow-hidden'>
            {/* Header */}
            <div className='bg-navy-900 px-8 py-6 flex justify-between items-center'>
              <h1 className='text-2xl font-bold text-white'>Your profile</h1>
              </div>

              <div className='p-8'>
                <div className='space-y-6'>
                  <div className='flex items-center space-x-4'>
                    <div className='relative'>
                      <img
                        src={formData?.avatar}
                        alt='Avatar'
                        className='w-20 h-20 rounded-full object-cover border-4 border-gray-200'
                      />
                      {uploading.avatar && (
                        <div className='absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center'>
                          <div className='w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                          </div>
                      )}
                      </div>

                      <div>
                        <label className='block'>
                          <span className='sr'>Choose Avatar</span>
                          <input
                            type='file'
                            accept='image/*'
                            onChange={(e) => handleImageChange(e, "avatar")}
                            className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-saffron-100 file:text-navy-900 hover:file:bg-saffron-100 transition-colors'
                          />
                        </label>
                      </div>
                    </div>

                      {/* Name Field */}
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Full Name
                        </label>
                        <input
                          type='text'
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saffron-400 focus:border-transparent transition-all"
                          placeholder='Enter your full name'
                        />
                        </div>

                    {/* Email Field (Read-Only) */}
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Email Address
                      </label>
                      <input
                        type='email'
                        value={formData.email}
                        disabled
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500'
                        />
                    </div>

                    {/* Email (Read-Only) */}
                    {user?.resume ? (
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Resume
                        </label>

                        <div className='flex items-center gap-2'>
                          <p className='text-sm text-gray-600'>
                            Link:{" "}
                            <a
                              href={user?.resume}
                              target='_blank'
                              className='text-navy-900 underline cursor-pointer'
                            >
                              {user?.resume}
                            </a>
                          </p>

                          <button className='cursor-pointer' onClick={DeleteResume}>
                            <Trash2 className='w-4 h-4 text-red-500' />
                            </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Resume (PDF)
                        </label>
                        <label className='block'>
                          <span className='sr-only'>Choose File</span>
                          <input
                            type='file'
                            onChange={(e) => handleImageChange(e, "resume")}
                            className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-saffron-100 file:text-navy-900 hover:file:bg-saffron-100 transition-colors'
                          />
                        </label>
                        </div>
                    )}

                    <ResumeSkills resume={user?.resume} />
                      </div>

                    </div>

                    {/* Action Buttons */}
                    <div className='flex justify-end space-x-4 mt-8 pt-6 pb-8 px-8 border-t'>
                      <Link
                      onClick={handleCancel}
                      to='/find-jobs'
                      className='px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2'
                      >
                        <X className='w-4 h-4' />
                        <span>Cancel</span>
                      </Link>

                      <button
                        onClick={handleSave}
                        disabled={saving || uploading.avatar || uploading.logo}
                        className='px-6 py-3 bg-navy-900 text-white rounded-lg hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2'
                      >
                        {saving ? (
                          <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                        ) : (
                          <Save className='w-4 h-4' />
                        )}
                        <span>{saving ? "Saving..." : "Save Changes"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
          </div>
  )
}

export default UserProfile