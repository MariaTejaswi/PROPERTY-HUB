import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BuildingOfficeIcon, 
  ClipboardDocumentCheckIcon, 
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  const features = [
    {
      icon: BuildingOfficeIcon,
      title: 'Property Management',
      description: 'Manage all your properties from one centralized dashboard with detailed insights.',
      color: 'text-blue-600 bg-blue-50'
    },
    {
      icon: UserGroupIcon,
      title: 'Tenant Portal',
      description: 'Allow tenants to pay rent, submit maintenance requests, and communicate easily.',
      color: 'text-purple-600 bg-purple-50'
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Payment Tracking',
      description: 'Track rent payments, generate invoices, and manage financial records effortlessly.',
      color: 'text-green-600 bg-green-50'
    },
    {
      icon: WrenchScrewdriverIcon,
      title: 'Maintenance Management',
      description: 'Handle maintenance requests efficiently with automated workflows and tracking.',
      color: 'text-orange-600 bg-orange-50'
    },
    {
      icon: ClipboardDocumentCheckIcon,
      title: 'Lease Management',
      description: 'Create, track, and manage lease agreements with e-signature support.',
      color: 'text-indigo-600 bg-indigo-50'
    },
    {
      icon: ChartBarIcon,
      title: 'Analytics & Reports',
      description: 'Get detailed insights and reports on occupancy, revenue, and expenses.',
      color: 'text-pink-600 bg-pink-50'
    },
    {
      icon: BellAlertIcon,
      title: 'Smart Notifications',
      description: 'Stay informed with automated alerts for payments, leases, and maintenance.',
      color: 'text-red-600 bg-red-50'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure & Reliable',
      description: 'Bank-level security with encrypted data and regular backups for peace of mind.',
      color: 'text-teal-600 bg-teal-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BuildingOfficeIcon className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                PropertyHub
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/login" 
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="btn-primary"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-50"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              Modern Property Management
              <span className="block text-primary-600 mt-2">Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Streamline your rental property management with our all-in-one platform. 
              Track payments, manage leases, handle maintenance, and communicate with tenants effortlessly.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/register" 
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Start Free Trial
              </Link>
              <Link 
                to="/login" 
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary-700 bg-white hover:bg-gray-50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200"
              >
                View Demo
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { number: '500+', label: 'Properties Managed' },
              { number: '2,000+', label: 'Active Tenants' },
              { number: '99.9%', label: 'Uptime' },
              { number: '$50M+', label: 'Rent Collected' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary-600">{stat.number}</div>
                <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Properties
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed specifically for landlords and property managers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index} 
                  className="group p-6 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all duration-300 bg-white"
                >
                  <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Simplify Your Property Management?
          </h2>
          <p className="text-xl text-primary-100 mb-10">
            Join hundreds of landlords who trust PropertyHub to manage their rental properties
          </p>
          <Link 
            to="/register" 
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary-600 bg-white hover:bg-gray-50 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200"
          >
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BuildingOfficeIcon className="h-6 w-6 text-primary-400" />
            <span className="text-xl font-bold text-white">PropertyHub</span>
          </div>
          <p className="text-gray-400 mb-4">
            Modern property management platform for landlords
          </p>
          <p className="text-sm text-gray-500">
            © 2025 PropertyHub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
