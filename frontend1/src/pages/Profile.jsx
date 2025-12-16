import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  LockClosedIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

const Profile = () => {
  const { user, setUser } = useAuth();

  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePasswordChange = (e) =>
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await api.put("/auth/profile", formData);
      setUser(response.data.user);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setSuccess("Profile updated successfully!");
    } catch {
      setError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword)
      return setError("Passwords do not match");

    setLoading(true);

    try {
      await api.put("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setSuccess("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch {
      setError("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">

      <div className="max-w-5xl w-full">

        {/* HEADER */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#D4AF37] text-black 
                          text-2xl font-bold flex items-center justify-center mb-3">
            {user.name?.charAt(0)?.toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
          <p className="text-gray-400 text-sm">
            Manage your details & security
          </p>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-4 bg-red-500/20 text-red-300 p-3 rounded-lg border border-red-500 flex gap-2">
            <ExclamationCircleIcon className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-500/20 text-green-300 p-3 rounded-lg border border-green-500">
            {success}
          </div>
        )}

        {/* SINGLE COMBINED CARD */}
        <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-xl 
                        shadow-2xl border border-white/10">

          <div className="grid md:grid-cols-2 gap-8">

            {/* PERSONAL INFO */}
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                Personal Information
              </h3>

              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className="w-full bg-white/10 border border-white/20 text-white 
                             rounded-lg py-2.5 pl-10 pr-3 
                             focus:ring-2 focus:ring-[#D4AF37] outline-none"
                />
              </div>

              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="w-full bg-white/10 border border-white/20 text-white 
                             rounded-lg py-2.5 pl-10 pr-3 
                             focus:ring-2 focus:ring-[#D4AF37] outline-none"
                />
              </div>

              <div className="relative">
                <PhoneIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone"
                  className="w-full bg-white/10 border border-white/20 text-white 
                             rounded-lg py-2.5 pl-10 pr-3 
                             focus:ring-2 focus:ring-[#D4AF37] outline-none"
                />
              </div>

              <button
                className="w-full bg-[#D4AF37] hover:bg-[#e5c56a] transition 
                           text-black font-semibold py-2.5 rounded-lg"
                disabled={loading}
              >
                Update Profile
              </button>
            </form>

            {/* CHANGE PASSWORD */}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                Change Password
              </h3>

              {["currentPassword", "newPassword", "confirmPassword"].map(
                (field, idx) => (
                  <div key={idx} className="relative">
                    <LockClosedIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      name={field}
                      value={passwordData[field]}
                      onChange={handlePasswordChange}
                      placeholder={
                        field === "currentPassword"
                          ? "Current Password"
                          : field === "newPassword"
                          ? "New Password"
                          : "Confirm Password"
                      }
                      className="w-full bg-white/10 border border-white/20 text-white 
                                 rounded-lg py-2.5 pl-10 pr-3 
                                 focus:ring-2 focus:ring-[#D4AF37] outline-none"
                    />
                  </div>
                )
              )}

              <button
                className="w-full bg-[#D4AF37] hover:bg-[#e5c56a] transition 
                           text-black font-semibold py-2.5 rounded-lg"
                disabled={loading}
              >
                Change Password
              </button>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
