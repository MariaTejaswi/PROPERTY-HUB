import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import Loader from "../components/common/Loader";
import Alert from "../components/common/Alert";
import DemoPaymentGateway from "../components/payments/DemoPaymentGateway";
import { formatCurrency } from "../utils/formatters";
import {
  PlusIcon,
  MapPinIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";

const Properties = () => {
  const { isLandlord, isTenant } = useAuth();
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [buyingId, setBuyingId] = useState(null);

  const [showPayModal, setShowPayModal] = useState(false);
  const [payProperty, setPayProperty] = useState(null);
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState("");
  const [paySuccess, setPaySuccess] = useState("");
  const [createdPayment, setCreatedPayment] = useState(null);
  const [payForm, setPayForm] = useState({
    amount: "",
    type: "rent",
    description: "",
    dueDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      if (isTenant) {
        const [myRes, availableRes] = await Promise.all([
          api.get('/properties', { params: { my: 'true' } }),
          api.get('/properties'),
        ]);

        const myList = myRes.data.properties || [];
        const availableList = availableRes.data.properties || [];
        const merged = new Map();

        // Show assigned property first, then available.
        myList.forEach((p) => merged.set(p._id, p));
        availableList.forEach((p) => {
          if (!merged.has(p._id)) merged.set(p._id, p);
        });

        setProperties(Array.from(merged.values()));
      } else {
        const response = await api.get("/properties");
        setProperties(response.data.properties || []);
      }
    } catch (err) {
      setError("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (property) => {
    if (!property?._id) return;
    const landlordId = property?.landlord?._id || property?.landlord;
    if (!landlordId) {
      setError('This property has no landlord assigned.');
      return;
    }

    setError('');
    setSuccess('');
    setBuyingId(property._id);

    try {
      const formData = new FormData();
      formData.append('recipientIds', JSON.stringify([landlordId]));
      formData.append('subject', 'Property purchase inquiry');
      formData.append(
        'content',
        `Hi, I'm interested in buying this property: ${property.name}. Please contact me with next steps.`
      );
      formData.append('relatedTo', 'property');
      formData.append('propertyId', property._id);

      await api.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess('Sent to landlord. Check Messages for replies.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to contact landlord');
    } finally {
      setBuyingId(null);
    }
  };

  const openPayModal = (property) => {
    setPayError("");
    setPaySuccess("");
    setCreatedPayment(null);
    setPayProperty(property);
    setPayForm({
      amount: "",
      type: "rent",
      description: "",
      dueDate: new Date().toISOString().split("T")[0],
    });
    setShowPayModal(true);
  };

  const closePayModal = () => {
    setShowPayModal(false);
    setPayProperty(null);
    setPaySubmitting(false);
    setPayError("");
    setPaySuccess("");
    setCreatedPayment(null);
  };

  const submitPayDetails = async (e) => {
    e.preventDefault();
    if (!payProperty?._id) return;

    setPaySubmitting(true);
    setPayError("");
    setPaySuccess("");

    try {
      const payload = {
        propertyId: payProperty._id,
        amount: Number(payForm.amount),
        type: payForm.type,
        description: payForm.description || undefined,
        dueDate: payForm.dueDate,
      };
      const res = await api.post('/payments', payload);
      setCreatedPayment(res.data.payment || res.data);
      setPaySuccess('Payment created. Complete checkout below.');
    } catch (err) {
      setPayError(err.response?.data?.message || 'Failed to create payment');
    } finally {
      setPaySubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this property?")) return;

    try {
      await api.delete(`/properties/${id}`);
      setProperties((prev) => prev.filter((p) => p._id !== id));
    } catch {
      setError("Failed to delete property");
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-black px-6 py-10">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-white">Properties</h1>
            <p className="text-gray-400 mt-2">
              Manage and oversee all your properties
            </p>
          </div>

          {isLandlord && (
            <button
              onClick={() => navigate("/properties/new")}
              className="flex items-center gap-2 px-6 py-3 
                         bg-[#D4AF37] hover:bg-[#e5c56a] 
                         text-black font-semibold rounded-xl shadow-lg transition"
            >
              <PlusIcon className="h-5 w-5" />
              Add Property
            </button>
          )}
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* EMPTY */}
        {properties.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 
                          rounded-2xl p-16 text-center">
            <HomeIcon className="h-20 w-20 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">
              No Properties Found
            </h2>
            <p className="text-gray-400">
              Start by adding your first property
            </p>
          </div>
        ) : (

          /* GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">

            {properties.map((property) => (
              <div
                key={property._id}
                className="bg-white/10 backdrop-blur-xl 
                           border border-white/10 rounded-2xl 
                           hover:shadow-2xl hover:-translate-y-1 
                           transition-all overflow-hidden"
              >

                {/* IMAGE */}
                <div className="relative h-52 bg-black/30">
                  {property.images?.length ? (
                    <img
                      src={`http://localhost:5000${property.images[0]}`}
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <HomeIcon className="h-16 w-16 text-gray-500" />
                    </div>
                  )}

                  <span
                    className={`absolute top-4 right-4 px-3 py-1 rounded-full 
                                text-xs font-semibold
                      ${
                        property.status === "available"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                  >
                    {property.status}
                  </span>
                </div>

                {/* CONTENT */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {property.name}
                  </h3>

                  <div className="flex items-start gap-2 text-gray-400 mb-4">
                    <MapPinIcon className="h-5 w-5 mt-0.5" />
                    <p className="text-sm">
                      {property.address.street}<br />
                      {property.address.city}, {property.address.state}
                    </p>
                  </div>

                  <div className="flex gap-5 text-sm text-gray-400 mb-4">
                    <span>🛏 {property.bedrooms}</span>
                    <span>🚿 {property.bathrooms}</span>
                    <span>📏 {property.squareFeet || "N/A"} sqft</span>
                  </div>

                  <div className="mb-5 pb-5 border-b border-white/10">
                    <p className="text-2xl font-bold text-[#D4AF37]">
                      {formatCurrency(property.rentAmount)}
                      <span className="text-sm text-gray-400 font-normal">
                        {" "} / month
                      </span>
                    </p>
                  </div>

                  {property.amenities?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-5">
                      {property.amenities.slice(0, 3).map((a, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 text-xs rounded-full 
                                     bg-white/10 text-gray-300"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate(`/properties/${property._id}`)}
                      className="flex-1 py-2 bg-white/10 text-white 
                                 rounded-lg hover:bg-white/20 transition"
                    >
                      View
                    </button>

                    {isTenant && (
                      <>
                        <button
                          onClick={() => openPayModal(property)}
                          className="px-4 py-2 bg-white/10 text-white 
                                     rounded-lg hover:bg-white/20 transition"
                        >
                          Pay
                        </button>

                        <button
                          onClick={() => handleBuy(property)}
                          disabled={buyingId === property._id}
                          className="px-4 py-2 bg-[#D4AF37] hover:bg-[#e5c56a] 
                                     text-black font-semibold rounded-lg transition disabled:opacity-60"
                        >
                          {buyingId === property._id ? 'Sending…' : 'Message'}
                        </button>
                      </>
                    )}

                    {isLandlord && (
                      <>
                        <button
                          onClick={() =>
                            navigate(`/properties/${property._id}/edit`)
                          }
                          className="px-4 py-2 bg-emerald-600 
                                     hover:bg-emerald-700 text-white 
                                     rounded-lg transition"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(property._id)}
                          className="px-4 py-2 bg-red-500/20 
                                     text-red-400 hover:bg-red-500/30 
                                     rounded-lg transition"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

          </div>
        )}
      </div>

      {/* TENANT PAY MODAL */}
      {showPayModal && isTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-black/90 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                Pay {payProperty?.name || 'Property'}
              </h2>
              <button
                onClick={closePayModal}
                className="rounded-lg border border-white/20 px-3 py-1 text-sm text-gray-200 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            {payError && <Alert type="error" message={payError} onClose={() => setPayError('')} />}
            {paySuccess && <Alert type="success" message={paySuccess} onClose={() => setPaySuccess('')} />}

            {!createdPayment ? (
              <form onSubmit={submitPayDetails} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-gray-300">Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={payForm.amount}
                    onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))}
                    className="w-full rounded-lg border border-white/20 bg-black/40 p-3 text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-gray-300">Type</label>
                    <select
                      value={payForm.type}
                      onChange={(e) => setPayForm((p) => ({ ...p, type: e.target.value }))}
                      className="w-full rounded-lg border border-white/20 bg-black/40 p-3 text-white focus:border-[#D4AF37] focus:outline-none"
                    >
                      <option value="rent">Rent</option>
                      <option value="deposit">Deposit</option>
                      <option value="other">Utilities</option>
                      <option value="maintenance">Maintenance Fee</option>
                      <option value="late_fee">Late Fee</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-gray-300">Due Date</label>
                    <input
                      type="date"
                      required
                      value={payForm.dueDate}
                      onChange={(e) => setPayForm((p) => ({ ...p, dueDate: e.target.value }))}
                      className="w-full rounded-lg border border-white/20 bg-black/40 p-3 text-white focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-gray-300">Description (optional)</label>
                  <input
                    value={payForm.description}
                    onChange={(e) => setPayForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="e.g. January rent"
                    className="w-full rounded-lg border border-white/20 bg-black/40 p-3 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="w-full rounded-xl bg-[#D4AF37] py-3 font-semibold text-black hover:bg-[#e5c56a] disabled:opacity-60"
                >
                  {paySubmitting ? 'Creating…' : 'Continue to Checkout'}
                </button>
              </form>
            ) : (
              <DemoPaymentGateway
                paymentId={createdPayment._id}
                amount={createdPayment.amount}
                onSuccess={() => {
                  setSuccess('Payment sent to landlord');
                  closePayModal();
                }}
                onError={(msg) => setPayError(msg || 'Payment failed')}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Properties;
