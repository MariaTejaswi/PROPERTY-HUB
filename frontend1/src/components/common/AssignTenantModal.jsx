import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import api from "../../services/api";

const AssignTenantModal = ({ property, onClose, onSuccess }) => {
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/users?role=tenant");
      setTenants(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch tenants");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTenant = async () => {
    if (!selectedTenant) {
      setError("Please select a tenant");
      return;
    }

    setAssigning(true);
    setError("");
    setSuccess("");

    try {
      await api.put(`/properties/${property._id}/tenant`, {
        tenantId: selectedTenant._id,
      });

      setSuccess(`${selectedTenant.name} assigned successfully!`);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign tenant");
    } finally {
      setAssigning(false);
    }
  };

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-[#D4AF37]/30 rounded-2xl p-8 w-full max-w-lg shadow-[0_0_30px_rgba(212,175,55,0.2)]">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Assign Tenant</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* PROPERTY INFO */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-400">Property</p>
          <p className="text-white font-semibold">{property.name}</p>
          <p className="text-gray-400 text-sm mt-1">
            Monthly Rent: <span className="text-[#D4AF37]">${property.rentAmount?.toLocaleString()}</span>
          </p>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm">
            {success}
          </div>
        )}

        {/* SEARCH */}
        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Search Tenants</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
            disabled={loading || assigning}
          />
        </div>

        {/* TENANT LIST */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-2 block">Available Tenants</label>
          <div className="bg-white/5 border border-white/10 rounded-lg max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-400">Loading tenants...</div>
            ) : filteredTenants.length === 0 ? (
              <div className="p-4 text-center text-gray-400">No tenants found</div>
            ) : (
              filteredTenants.map((tenant) => (
                <button
                  key={tenant._id}
                  onClick={() => setSelectedTenant(tenant)}
                  className={`w-full px-4 py-3 text-left border-b border-white/10 transition ${
                    selectedTenant?._id === tenant._id
                      ? "bg-[#D4AF37]/20 border-[#D4AF37]"
                      : "hover:bg-white/10"
                  }`}
                >
                  <p className="text-white font-medium">{tenant.name}</p>
                  <p className="text-sm text-gray-400">{tenant.email}</p>
                  {tenant.phone && (
                    <p className="text-xs text-gray-500">{tenant.phone}</p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={assigning}
            className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssignTenant}
            disabled={assigning || !selectedTenant}
            className="flex-1 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#e5c56a] text-black font-semibold rounded-lg transition disabled:opacity-50"
          >
            {assigning ? "Assigning..." : "Assign Tenant"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignTenantModal;
