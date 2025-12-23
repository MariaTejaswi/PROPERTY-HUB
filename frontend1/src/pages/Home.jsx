import React from "react";
import { Link } from "react-router-dom";

import {
  BuildingOfficeIcon,
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";

// Background image
const bg2 = new URL("../bg.png", import.meta.url).href;

const Home = () => {
  const features = [
    {
      icon: BuildingOfficeIcon,
      title: "Property Management",
      description:
        "Oversee and optimize all your properties from one elegant dashboard.",
    },
    {
      icon: UserGroupIcon,
      title: "Tenant Portal",
      description:
        "Allow tenants to pay rent, request maintenance, and communicate easily.",
    },
    {
      icon: CurrencyDollarIcon,
      title: "Payment Tracking",
      description:
        "Track rent payments, generate invoices, and manage revenue seamlessly.",
    },
    {
      icon: WrenchScrewdriverIcon,
      title: "Maintenance Management",
      description:
        "Organize and respond to maintenance requests efficiently.",
    },
    {
      icon: ClipboardDocumentCheckIcon,
      title: "Lease Management",
      description:
        "Create, track, and manage leases with professional workflows.",
    },
    {
      icon: ChartBarIcon,
      title: "Analytics & Reports",
      description:
        "Get insights into occupancy, revenue trends, and asset performance.",
    },
    {
      icon: BellAlertIcon,
      title: "Smart Notifications",
      description:
        "Stay informed with automated reminders and alerts.",
    },
    {
      icon: ShieldCheckIcon,
      title: "Secure & Reliable",
      description:
        "Enterprise-grade security with encrypted data and daily backups.",
    },
  ];

  return (
    <div className="relative isolate min-h-screen">

      {/* Background Image */}
      <div
        className="fixed inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: `url(${bg2})`,
          filter: "blur(2px) brightness(0.45)",
          transform: "scale(1.08)",
        }}
      ></div>

      {/* Soft Overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 z-10"></div>

      <div className="relative z-20">

      {/* NAVIGATION */}
      <nav className="bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <div className="flex items-center space-x-2">
              <BuildingOfficeIcon className="h-8 w-8 text-[#D4AF37]" />
              <span className="text-2xl font-semibold text-white tracking-wide">
                PropertyHub
              </span>
            </div>

            {/* Nav Links */}
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-200 hover:text-white">
                Sign In
              </Link>

              <Link
                to="/register"
                className="px-5 py-2 rounded-xl bg-[#D4AF37] text-black font-medium hover:bg-[#c09b2f] transition"
              >
                Get Started
              </Link>
            </div>

          </div>
        </div>
      </nav>

      {/* HERO SECTION - FULL SCREEN */}
      <section className="h-screen flex flex-col justify-center items-center text-center text-white px-4">

        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          <span className="text-white">Modern Property Management</span>

          <span className="block mt-2 text-[#D4AF37]">
            Made Simple
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto mb-10">
          A modern all-in-one platform for managing rent, leases, tenants,
          communication, and asset performance—all in one elegant interface.
        </p>

        {/* CALL TO ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/register"
            className="px-7 py-3 rounded-xl text-lg font-medium 
            bg-[#D4AF37] text-black hover:bg-[#c09b2f] transition"
          >
            Get Started
          </Link>

          <Link
            to="/login"
            className="px-7 py-3 rounded-xl text-lg font-medium 
            bg-white/20 backdrop-blur-md border border-white/20 text-white
            hover:bg-white/30 transition"
          >
            Sign In
          </Link>
        </div>

      </section>

      {/* FEATURES SECTION */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">

          <h2 className="text-4xl font-semibold text-center mb-12 text-white">
            Everything You Need, Built with Elegance
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-white/10 backdrop-blur-xl 
                  border border-white/10 shadow-md hover:bg-white/20 transition"
                >
                  <div
                    className="w-14 h-14 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40
                    flex items-center justify-center mb-4"
                  >
                    <Icon className="h-7 w-7 text-[#D4AF37]" />
                  </div>

                  <h3 className="text-xl font-medium text-white mb-1">
                    {f.title}
                  </h3>

                  <p className="text-gray-200 text-sm">{f.description}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black/40 backdrop-blur-xl text-gray-300 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">

          <div className="flex justify-center items-center space-x-2 mb-4">
            <BuildingOfficeIcon className="h-6 w-6 text-[#D4AF37]" />
            <span className="text-xl font-semibold text-[#D4AF37]">
              PropertyHub
            </span>
          </div>

          <p className="text-gray-300 mb-1">
            A refined experience for modern property management.
          </p>

          <p className="text-sm text-gray-400">
            © 2025 PropertyHub. All rights reserved.
          </p>

        </div>
      </footer>

      </div>
    </div>
  );
};

export default Home;
