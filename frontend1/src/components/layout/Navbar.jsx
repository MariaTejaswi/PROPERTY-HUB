import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

import {
  BuildingOfficeIcon,
  HomeIcon,
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const Navbar = () => {
  const { user, logout, isAuthenticated, isLandlord, isTenant, isManager } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: "/dashboard", label: "Dashboard", icon: HomeIcon, show: true },
    { path: "/properties", label: "Properties", icon: BuildingOfficeIcon, show: isLandlord || isTenant || isManager },
    { path: "/payments", label: "Payments", icon: CurrencyDollarIcon, show: true },
    { path: "/maintenance", label: isLandlord ? "Maintenance" : "Requests", icon: WrenchScrewdriverIcon, show: true },
    { path: "/leases", label: isLandlord ? "Leases" : "Lease", icon: ClipboardDocumentCheckIcon, show: true },
    { path: "/messages", label: "Messages", icon: ChatBubbleLeftRightIcon, show: true },
  ];

  return (
    <nav className="bg-black border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* MAIN BAR */}
        <div className="relative flex items-center h-16">

          {/* LEFT: BRAND (leftmost) */}
          <div className="flex-1 pr-4 md:pr-8">
            <Link to="/dashboard" className="flex items-center gap-2">
              <BuildingOfficeIcon className="h-8 w-8 text-[#D4AF37]" />
              <span className="text-xl font-semibold text-white tracking-wide">
                PropertyHub
              </span>
            </Link>
          </div>

          {/* CENTER: DESKTOP NAV LINKS */}
          <div className="hidden md:flex flex-1 justify-center items-center gap-6 pl-4 md:pl-8">
            {navLinks.filter((link) => link.show).map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all 
                    ${
                      active
                        ? "text-[#D4AF37] border-b-2 border-[#D4AF37]"
                        : "text-white hover:bg-white/10"
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* RIGHT: USER PROFILE + LOGOUT */}
          <div className="hidden md:flex flex-1 justify-end items-center gap-4">
            <Link
              to="/profile"
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10 transition"
            >
              <div className="text-right leading-tight">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user.role}</p>
              </div>
              <UserCircleIcon className="h-9 w-9 text-gray-300" />
            </Link>

            {/* LOGOUT BUTTON */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Logout
            </button>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 absolute right-2"
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6 text-white" />
            ) : (
              <Bars3Icon className="h-6 w-6 text-white" />
            )}
          </button>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 space-y-1">

            {navLinks.filter((l) => l.show).map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition 
                    ${
                      active
                        ? "bg-white/10 text-[#D4AF37]"
                        : "text-white hover:bg-white/10"
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}

            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-white/10 transition"
            >
              <UserCircleIcon className="h-5 w-5" />
              Profile ({user.name})
            </Link>

            {/* MOBILE LOGOUT */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Logout
            </button>

          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
