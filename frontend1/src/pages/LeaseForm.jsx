import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import Alert from "../components/common/Alert";
import { formatCurrency } from "../utils/formatters";

const LeaseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [error, setError] = useState("");
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [formData, setFormData] = useState({
    propertyId: "",
    tenantId: "",
    startDate: "",
    endDate: "",
    rentAmount: "",
    securityDeposit: "",
    paymentDueDay: 1,
    terms: "",
  });

  useEffect(() => {
    fetchProperties();
    fetchTenants();
    if (isEditMode) fetchLease();
    // eslint-disable-next-line
  }, [id]);

  const fetchLease = async () => {
    try {
      const response = await api.get(`/leases/${id}`);
      const lease = response.data;
      setFormData({
        propertyId: lease.property._id || lease.property,
        tenantId: lease.tenant._id || lease.tenant,
        startDate: lease.startDate.split("T")[0],
        endDate: lease.endDate.split("T")[0],
        rentAmount: lease.rentAmount,
        securityDeposit: lease.securityDeposit,
        paymentDueDay: lease.paymentDueDay,
        terms: lease.terms,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch lease details");
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await api.get("/properties");
      const availableProps = (response.data.properties || []).filter(
        (p) => p.status === "available" && p.isAvailable !== false
      );
      setProperties(availableProps);
    } catch (err) {
      setError("Failed to load properties");
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await api.get("/auth/users");
      const tenantUsers = (response.data.users || []).filter(
        (u) => u.role === "tenant"
      );
      setTenants(tenantUsers);
    } catch (err) {
      setError("Failed to load tenants");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isEditMode) {
        await api.put(`/leases/${id}`, formData);
      } else {
        await api.post("/leases", formData);
      }
      navigate("/leases");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Failed to ${isEditMode ? "update" : "create"} lease`
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedProperty = properties.find(
    (p) => p._id === formData.propertyId
  );

  if (initialLoading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-black px-4 py-12 text-white">
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-[#D4AF37] tracking-wide">
              {isEditMode ? "Edit Lease" : "Create New Lease"}
            </h1>
            <p className="text-gray-400 mt-1">
              {isEditMode
                ? "Update the lease agreement details"
                : "Fill in the details to create a new lease agreement"}
            </p>
          </div>

          <button
            className="px-5 py-2 bg-white/10 text-gray-300 border border-white/20 rounded-lg hover:bg-white/20 transition"
            onClick={() => navigate("/leases")}
          >
            Cancel
          </button>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError("")} />
        )}

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* PROPERTY */}
            <Field label="Property *">
              <select
                name="propertyId"
                value={formData.propertyId}
                onChange={handleChange}
                required
                className="lux-input"
              >
                <option value="">Select property</option>
                {properties.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} — {p.address?.street}, {p.address?.city}
                  </option>
                ))}
              </select>
            </Field>

            {/* TENANT */}
            <Field label="Tenant *">
              <select
                name="tenantId"
                value={formData.tenantId}
                onChange={handleChange}
                required
                className="lux-input"
              >
                <option value="">Select tenant</option>
                {tenants.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} — {t.email}
                  </option>
                ))}
              </select>
            </Field>

            {/* DATES */}
            <Field label="Start Date *">
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="lux-input"
              />
            </Field>

            <Field label="End Date *">
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                className="lux-input"
              />
            </Field>

            {/* RENT */}
            <Field label="Monthly Rent *">
              <div className="relative">
                <span className="lux-prefix">$</span>
                <input
                  type="number"
                  name="rentAmount"
                  value={formData.rentAmount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                  className="lux-input pl-8"
                />
              </div>

              {selectedProperty && (
                <p className="text-xs text-gray-500 mt-1">
                  Property rent: {formatCurrency(selectedProperty.rent)}
                </p>
              )}
            </Field>

            {/* DEPOSIT */}
            <Field label="Security Deposit *">
              <div className="relative">
                <span className="lux-prefix">$</span>
                <input
                  type="number"
                  name="securityDeposit"
                  value={formData.securityDeposit}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                  className="lux-input pl-8"
                />
              </div>
            </Field>

            {/* DUE DAY */}
            <Field label="Payment Due Day *">
              <input
                type="number"
                name="paymentDueDay"
                value={formData.paymentDueDay}
                onChange={handleChange}
                min="1"
                max="31"
                required
                className="lux-input"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be between 1 and 31
              </p>
            </Field>
          </div>

          {/* TERMS */}
          <div className="mb-10">
            <Field label="Lease Terms & Conditions *">
              <textarea
                name="terms"
                value={formData.terms}
                onChange={handleChange}
                rows="10"
                required
                placeholder="Enter the complete terms and conditions..."
                className="lux-input resize-y"
              />
            </Field>
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-4 border-t border-white/10 pt-6">
            <button
              type="button"
              onClick={() => navigate("/leases")}
              className="px-6 py-2.5 bg-white/10 text-gray-300 border border-white/20 rounded-lg hover:bg-white/20 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-[#c69d2f] transition disabled:opacity-50"
            >
              {loading
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                ? "Update Lease"
                : "Create Lease"}
            </button>
          </div>
        </form>

        {loading && <Loader fullScreen />}
      </div>
    </div>
  );
};

/* ---------------------- SUBCOMPONENTS ---------------------- */

const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-semibold text-[#D4AF37] mb-2">
      {label}
    </label>
    {children}
  </div>
);

export default LeaseForm;
