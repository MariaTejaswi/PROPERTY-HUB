import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import Loader from "../common/Loader";
import Alert from "../common/Alert";

const AddPaymentModal = ({ onClose, onCreated, defaultTenantId = null, defaultPropertyId = null }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    propertyId: defaultPropertyId || "",
    tenantId: defaultTenantId || "",
    amount: "",
    type: "rent",
    description: "",
    dueDate: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/properties");
        setProperties(res.data.properties || []);
      } catch (e) {
        setError("Failed to load properties");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Build tenant options from current tenants of properties
  const tenantOptions = useMemo(() => {
    const map = new Map();
    properties.forEach((p) => {
      if (p.currentTenant) {
        map.set(p.currentTenant._id, p.currentTenant);
      }
    });
    return Array.from(map.values());
  }, [properties]);

  // If a property with currentTenant is chosen and no tenant selected, auto-fill
  useEffect(() => {
    if (!form.propertyId) return;
    const prop = properties.find((p) => p._id === form.propertyId);
    if (prop?.currentTenant && !form.tenantId) {
      setForm((prev) => ({ ...prev, tenantId: prop.currentTenant._id }));
    }
  }, [form.propertyId, form.tenantId, properties]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        propertyId: form.propertyId,
        tenantId: form.tenantId,
        amount: Number(form.amount),
        type: form.type,
        description: form.description || undefined,
        dueDate: form.dueDate,
      };
      const res = await api.post("/payments", payload);
      onCreated?.(res.data);
      onClose?.();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to create payment. Please check inputs."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-[#D4AF37]/40 bg-black/90 p-6 shadow-[0_0_40px_rgba(212,175,55,0.30)]">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold gold">Add Payment</h2>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/20 px-3 py-1 text-sm text-gray-300 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        {loading ? (
          <div className="mt-6"><Loader /></div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && <Alert type="error" message={error} />}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-300">Property</label>
                <select
                  name="propertyId"
                  value={form.propertyId}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-white/20 bg-black/40 p-3 text-white focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="">Select property</option>
                  {properties.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-300">Tenant</label>
                <select
                  name="tenantId"
                  value={form.tenantId}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-white/20 bg-black/40 p-3 text-white focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="">Select tenant</option>
                  {tenantOptions.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-300">Amount</label>
                <input
                  type="number"
                  name="amount"
                  min="0"
                  step="0.01"
                  required
                  value={form.amount}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-white/20 bg-black/40 p-3 text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-300">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  required
                  value={form.dueDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-white/20 bg-black/40 p-3 text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-300">Type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-white/20 bg-black/40 p-3 text-white focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="rent">Rent</option>
                  <option value="deposit">Deposit</option>
                  <option value="late_fee">Late Fee</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-300">Description</label>
                <input
                  name="description"
                  placeholder="Optional"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-white/20 bg-black/40 p-3 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/20 px-4 py-2 text-gray-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg border border-[#D4AF37] px-5 py-2 font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black disabled:opacity-60"
              >
                {submitting ? "Creating..." : "Create Payment"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddPaymentModal;
