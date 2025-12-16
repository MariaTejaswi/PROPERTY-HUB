import React from "react";
import { Link } from "react-router-dom";
import {
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-gray-300 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-16">

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* ABOUT */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BuildingOfficeIcon className="h-8 w-8 text-[#D4AF37]" />
              <span className="text-xl font-semibold text-white tracking-wide">
                PropertyHub
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Modern property management made simple. Manage properties, tenants, payments,
              and maintenance — all in one elegant platform.
            </p>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h3 className="text-white font-semibold mb-4 tracking-wide">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {["dashboard", "properties", "payments", "maintenance", "leases"].map((item, i) => (
                <li key={i}>
                  <Link
                    to={`/${item}`}
                    className="text-sm text-gray-400 hover:text-[#D4AF37] transition"
                  >
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* SUPPORT */}
          <div>
            <h3 className="text-white font-semibold mb-4 tracking-wide">Support</h3>
            <ul className="space-y-2">
              {["Help Center", "Documentation", "FAQs", "Terms of Service", "Privacy Policy"].map(
                (item, i) => (
                  <li key={i}>
                    <a href="#" className="text-sm text-gray-400 hover:text-[#D4AF37] transition">
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <h3 className="text-white font-semibold mb-4 tracking-wide">Contact Us</h3>
            <ul className="space-y-4">

              {/* Email */}
              <li className="flex items-start gap-3">
                <EnvelopeIcon className="h-5 w-5 text-[#D4AF37]" />
                <div>
                  <p className="text-sm">Email</p>
                  <a
                    href="mailto:support@propertyhub.com"
                    className="text-sm text-gray-400 hover:text-[#D4AF37] transition"
                  >
                    support@propertyhub.com
                  </a>
                </div>
              </li>

              {/* Phone */}
              <li className="flex items-start gap-3">
                <PhoneIcon className="h-5 w-5 text-[#D4AF37]" />
                <div>
                  <p className="text-sm">Phone</p>
                  <a
                    href="tel:+1234567890"
                    className="text-sm text-gray-400 hover:text-[#D4AF37] transition"
                  >
                    +1 (234) 567-890
                  </a>
                </div>
              </li>

              {/* Address */}
              <li className="flex items-start gap-3">
                <MapPinIcon className="h-5 w-5 text-[#D4AF37]" />
                <div>
                  <p className="text-sm">Address</p>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    123 Property St <br />
                    Real Estate City, RE 12345
                  </p>
                </div>
              </li>

            </ul>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">

          {/* COPYRIGHT */}
          <p className="text-sm text-gray-400">
            © {currentYear} PropertyHub. All rights reserved.
          </p>

          {/* EXTRA LINKS */}
          <div className="flex items-center gap-6">
            {["About Us", "Contact", "Careers"].map((item, i) => (
              <a
                key={i}
                href="#"
                className="text-sm text-gray-400 hover:text-[#D4AF37] transition"
              >
                {item}
              </a>
            ))}
          </div>

          {/* SOCIAL MEDIA ICONS */}
          <div className="flex items-center gap-5 text-gray-400">
            <a href="#" className="hover:text-[#D4AF37] transition">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>

            <a href="#" className="hover:text-[#D4AF37] transition">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </a>

            <a href="#" className="hover:text-[#D4AF37] transition">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
              </svg>
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
