import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import Loader from "../components/common/Loader";
import Alert from "../components/common/Alert";
import Button from "../components/common/Button";
import { formatCurrency } from "../utils/formatters";

const LeaseForm = ({ isModal = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { user, isTenant } = useAuth();

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
    depositAmount: "",
    paymentDueDay: 1,
    terms: "",
  });

  useEffect(() => {
    fetchProperties();
    if (!isTenant) fetchTenants();
    if (isEditMode) fetchLease();
    // eslint-disable-next-line
  }, [id, isTenant]);

  useEffect(() => {
    if (isTenant && user?.id) {
      setFormData((prev) => ({
        ...prev,
        tenantId: user.id,
      }));
    }
  }, [isTenant, user?.id]);

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
        depositAmount: lease.depositAmount ?? "",
        paymentDueDay: lease.paymentDueDay,
        terms: lease.terms,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load lease details");
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      if (isTenant) {
        const [assignedRes, availableRes] = await Promise.all([
          api.get("/properties", { params: { my: true } }),
          api.get("/properties"),
        ]);

        const assigned = assignedRes.data.properties || [];
        const available = availableRes.data.properties || [];

        const byId = new Map();
        [...assigned, ...available].forEach((p) => {
          if (p?._id && !byId.has(p._id)) byId.set(p._id, p);
        });

        setProperties(Array.from(byId.values()));
      } else {
        const response = await api.get("/properties");

            // For landlords, the API already returns only their properties.
            // Don't filter by status here; a landlord may need to draft a lease
            // even when the property's status isn't strictly "available".
            setProperties(response.data.properties || []);
      }
    } catch {
      setError("Failed to fetch properties");
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await api.get("/auth/users");
      const tenantUsers = (response.data.users || []).filter(
        (u) => u.role === "tenant"
      );
      setTenants(tenantUsers);
    } catch {
      setError("Failed to fetch tenants");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      if (isModal) {
        navigate("/leases", { replace: true, state: { leaseCreatedAt: Date.now() } });
      } else {
        navigate("/leases");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Unable to ${isEditMode ? "update" : "create"} lease`
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedProperty = properties.find(
    (p) => p._id === formData.propertyId
  );

  if (initialLoading) return <Loader fullScreen />;

  const inputClass =
    "w-full mt-2 bg-white/10 border border-white/20 text-white p-3 rounded-lg focus:ring-2 focus:ring-[#D4AF37]";
  const labelClass = "text-gray-300";

  const handleCancel = () => {
    if (isModal) return navigate(-1);
    return navigate("/leases");
  };

  return (
    <div className={isModal ? "" : "min-h-screen bg-black py-10 px-4"}>
      <div className={isModal ? "" : "max-w-4xl mx-auto"}>

        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-[#D4AF37]">
            {isEditMode ? "Edit Lease" : "New Lease Agreement"}
          </h2>
          <p className="text-gray-400 mt-2">
            {isEditMode
              ? "Update the lease agreement details"
              : "Create a lease agreement for a property"}
          </p>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError("")} />
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl space-y-10">

            {/* PROPERTY */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Property Information</h3>

              <div className="max-w-2xl">
                <label className={labelClass}>Select Property *</label>
                <select
                  name="propertyId"
                  value={formData.propertyId}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="" className="text-black">
                    Select a property
                  </option>

                  {properties.map((p) => (
                    <option key={p._id} value={p._id} className="text-black">
                      {p.name}
                      {p.landlord?.name
                        ? ` — ${p.landlord.name}`
                        : p.landlord?.email
                        ? ` — ${p.landlord.email}`
                        : p.address?.city
                        ? ` — ${p.address.city}`
                        : ""}
                    </option>
                  ))}
                </select>
                <p className="text-gray-400 text-sm mt-2">
                  Choose the property this lease belongs to.
                </p>

                {selectedProperty?.landlord && (
                  <div className="mt-4">
                    <label className={labelClass}>Landlord</label>
                    <input
                      disabled
                      value={
                        selectedProperty.landlord?.name
                          ? `${selectedProperty.landlord.name}${selectedProperty.landlord.email ? ` — ${selectedProperty.landlord.email}` : ""}`
                          : selectedProperty.landlord?.email || ""
                      }
                      className={`${inputClass} opacity-70`}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* DETAILS */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Lease Details</h3>

              {/* Tenant */}
              {isTenant ? (
                <>
                  <label className={labelClass}>Tenant</label>
                  <input
                    disabled
                    value={user?.email || ""}
                    className={`${inputClass} opacity-70`}
                  />
                </>
              ) : (
                <>
                  <label className={labelClass}>Select Tenant *</label>
                  <select
                    name="tenantId"
                    value={formData.tenantId}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  >
                    <option value="" className="text-black">
                      Select a tenant
                    </option>
                    {tenants.map((t) => (
                      <option key={t._id} value={t._id} className="text-black">
                        {t.name} — {t.email}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {/* Dates + numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className={labelClass}>Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Monthly Rent *</label>
                  <input
                    type="number"
                    name="rentAmount"
                    value={formData.rentAmount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                    placeholder="Enter monthly rent"
                    className={inputClass}
                  />
                  {selectedProperty && (
                    <p className="text-gray-400 text-sm mt-1">
                      Suggested rent: {formatCurrency(selectedProperty.rent)}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Security Deposit *</label>
                  <input
                    type="number"
                    name="depositAmount"
                    value={formData.depositAmount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                    placeholder="Enter security deposit"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Payment Due Day *</label>
                  <input
                    type="number"
                    name="paymentDueDay"
                    value={formData.paymentDueDay}
                    onChange={handleChange}
                    min="1"
                    max="31"
                    required
                    placeholder="1 - 31"
                    className={inputClass}
                  />
                  <p className="text-gray-400 text-sm mt-1">
                    Must be between 1 and 31
                  </p>
                </div>
              </div>

              {/* Terms */}
              <label className={`${labelClass} mt-6 block`}>Terms & Conditions *</label>
              <textarea
                name="terms"
                rows="8"
                value={formData.terms}
                onChange={handleChange}
                required
                placeholder="Enter the complete terms and conditions..."
                className={inputClass}
              />
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-4 mt-10">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>

            <Button type="submit" disabled={loading}>
              {loading
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                ? "Update Lease"
                : "Create Lease"}
            </Button>
          </div>
        </form>

        {loading && <Loader fullScreen />}
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-semibold text-[#D4AF37] mb-2">
      {label}
    </label>
    {children}
  </div>
);

export default LeaseForm;
