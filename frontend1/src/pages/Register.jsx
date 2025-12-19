import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  BuildingOfficeIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  PhoneIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "landlord",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword)
      return setError("Passwords do not match");

    if (formData.password.length < 6)
      return setError("Password must be at least 6 characters");

    setLoading(true);
    try {
      const { confirmPassword, ...data } = formData;
      await register(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* LOGO */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2">
            <BuildingOfficeIcon className="h-10 w-10 text-[#D4AF37]" />
            <h1 className="text-3xl font-extrabold text-[#D4AF37]">
              PropertyHub
            </h1>
          </div>
          <h2 className="text-2xl font-bold text-white mt-4">
            Create Account
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Join and manage properties easily
          </p>
        </div>

        {/* CARD */}
        <div className="bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-8">

          {/* ERROR */}
          {error && (
            <div className="mb-5 flex items-center gap-2 bg-red-900/40 border border-red-500 text-red-300 p-3 rounded-lg text-sm">
              <ExclamationCircleIcon className="h-5 w-5" />
              {error}
            </div>
          )}

          {/* ROLE */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {["landlord", "tenant"].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setFormData({ ...formData, role })}
                className={`py-2.5 rounded-lg font-medium transition ${
                  formData.role === role
                    ? "bg-[#D4AF37] text-black"
                    : "bg-black border border-white/20 text-gray-300 hover:bg-white/10"
                }`}
              >
                {role === "landlord" ? "Landlord" : "Tenant"}
              </button>
            ))}
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">

            {/* NAME */}
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                  className="w-full pl-10 py-2.5 rounded-lg bg-black border border-white/20 text-white focus:ring-2 focus:ring-[#D4AF37] outline-none"
                />
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Email</label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="off"
                  placeholder="abc@example.com"
                  required
                  className="w-full pl-10 py-2.5 rounded-lg bg-black border border-white/20 text-white focus:ring-2 focus:ring-[#D4AF37] outline-none"
                />
              </div>
            </div>

            {/* PHONE */}
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Phone</label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91"
                  className="w-full pl-10 py-2.5 rounded-lg bg-black border border-white/20 text-white focus:ring-2 focus:ring-[#D4AF37] outline-none"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Password</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  placeholder="Minimum 6 characters"
                  required
                  className="w-full pl-10 py-2.5 rounded-lg bg-black border border-white/20 text-white focus:ring-2 focus:ring-[#D4AF37] outline-none"
                />
              </div>
            </div>

            {/* CONFIRM */}
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Confirm Password</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  required
                  className="w-full pl-10 py-2.5 rounded-lg bg-black border border-white/20 text-white focus:ring-2 focus:ring-[#D4AF37] outline-none"
                />
              </div>
            </div>

            {/* BUTTON */}
            <button
              disabled={loading}
              className="w-full mt-3 py-3 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-[#c9a332] transition"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>

          {/* FOOTER */}
          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-[#D4AF37] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
